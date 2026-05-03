'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

function getSafeInternalRedirectPath(rawValue: string) {
  const nextPath = rawValue.trim();

  if (!nextPath) return null;
  if (!nextPath.startsWith('/')) return null;
  if (nextPath.startsWith('//')) return null;
  if (nextPath.includes('://')) return null;
  if (nextPath.startsWith('/auth/')) return null;

  return nextPath;
}

export async function loginAction(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const rawNextPath = String(formData.get('next') ?? '');
  const safeNextPath = getSafeInternalRedirectPath(rawNextPath);

  if (!email || !password) {
    return { error: 'Email et mot de passe sont requis.' };
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: 'Email ou mot de passe incorrect.' };
  }

  const supabaseAdmin = createAdminClient();
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, status')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    return { error: 'Erreur lors de la récupération de votre profil.' };
  }

  await supabase.auth.getUser();

  let redirectTo: string;
  if (safeNextPath) {
    redirectTo = safeNextPath;
  } else if (profile.role === 'owner') {
    redirectTo = '/dashboard/owner/inventaire';
  } else if (profile.role === 'employee' && profile.status === 'active') {
    redirectTo = '/dashboard/employee/ventes';
  } else {
    redirectTo = '/dashboard/pending';
  }

  redirect(redirectTo);
}

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

    if (profileInsertError) throw profileInsertError;

    if (role === 'owner') {
      const boutiqueName = String(formData.get('boutiqueName') ?? '').trim();
      if (!boutiqueName) return { error: 'Le nom de boutique est requis pour un propriétaire.' };

      let newBoutiqueId: string | null = null;
      let lastInsertError: Error | null = null;

      for (let i = 0; i < 5; i += 1) {
        const generatedCode = `LIKI-${Math.floor(100000 + Math.random() * 900000)}`;
        const { data: newBoutique, error: boutiqueInsertError } = await supabaseAdmin
          .from('boutiques')
          .insert([{ name: boutiqueName, owner_id: createdAuthUserId, boutique_code: generatedCode }])
          .select('id')
          .single();

        if (!boutiqueInsertError && newBoutique) {
          newBoutiqueId = newBoutique.id;
          break;
        }
        lastInsertError = boutiqueInsertError;
      }

      if (!newBoutiqueId) throw lastInsertError ?? new Error('Erreur lors de la création de la boutique.');

      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ boutique_id: newBoutiqueId })
        .eq('id', createdAuthUserId);

      if (profileUpdateError) throw profileUpdateError;
    }
  } catch (error) {
    if (createdAuthUserId) await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
    const message = error instanceof Error ? error.message : 'Erreur lors de la finalisation de votre profil.';
    return { error: message };
  }

  await supabase.auth.getUser();

  if (role === 'owner') {
    redirect('/dashboard/owner/inventaire');
  }
  
  redirect('/dashboard/pending');
}