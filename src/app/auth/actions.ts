'use server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export async function registerAction(formData: FormData) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('fullName') ?? '').trim();
  const role = formData.get('role');

  if (!email || !password || !fullName) {
    return { error: 'Tous les champs obligatoires doivent être remplis.' };
  }

  if (role !== 'owner' && role !== 'employee') {
    return { error: 'Type de compte invalide.' };
  }

  let targetBoutiqueId: string | null = null;
  let createdAuthUserId: string | null = null;

  if (role === 'employee') {
    const boutiqueCode = String(formData.get('boutiqueCode') ?? '').trim().toUpperCase();
    if (!boutiqueCode) {
      return { error: 'Le code boutique est requis pour un employé.' };
    }

    const { data: boutique, error: vError } = await supabaseAdmin
      .from('boutiques')
      .select('id')
      .eq('boutique_code', boutiqueCode)
      .single();

    if (vError || !boutique) {
      return { error: 'Code boutique invalide. Vérifiez avec votre gérant.' };
    }

    targetBoutiqueId = boutique.id;
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
    },
  });

  if (authError || !authData.user) {
    if (authError?.message.includes('already registered')) {
      return { error: 'Cet email est déjà utilisé.' };
    }
    return { error: authError?.message || "Erreur lors de l'inscription." };
  }

  createdAuthUserId = authData.user.id;

  try {
    const { error: profileInsertError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: createdAuthUserId,
          full_name: fullName,
          email,
          role,
          boutique_id: role === 'employee' ? targetBoutiqueId : null,
          status: role === 'owner' ? 'active' : 'pending',
        },
      ]);

    if (profileInsertError) {
      throw profileInsertError;
    }

    if (role === 'owner') {
      const boutiqueName = String(formData.get('boutiqueName') ?? '').trim();
      if (!boutiqueName) {
        return { error: 'Le nom de boutique est requis pour un propriétaire.' };
      }

      let newBoutiqueId: string | null = null;
      let lastInsertError: Error | null = null;

      for (let i = 0; i < 5; i += 1) {
        const generatedCode = `LIKI-${Math.floor(100000 + Math.random() * 900000)}`;

        const { data: newBoutique, error: boutiqueInsertError } = await supabaseAdmin
          .from('boutiques')
          .insert([
            {
              name: boutiqueName,
              owner_id: createdAuthUserId,
              boutique_code: generatedCode,
            },
          ])
          .select('id')
          .single();

        if (!boutiqueInsertError && newBoutique) {
          newBoutiqueId = newBoutique.id;
          break;
        }

        lastInsertError = boutiqueInsertError;
      }

      if (!newBoutiqueId) {
        throw lastInsertError ?? new Error('Erreur lors de la création de la boutique.');
      }

      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ boutique_id: newBoutiqueId })
        .eq('id', createdAuthUserId);

      if (profileUpdateError) {
        throw profileUpdateError;
      }
    }
  } catch (error) {
    if (createdAuthUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Erreur lors de la finalisation de votre profil.';
    return { error: message };
  }

  if (role === 'owner') {
    redirect('/dashboard');
  } else {
    redirect('/dashboard/pending');
  }
}