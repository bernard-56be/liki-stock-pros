'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// --- ACTION D'INSCRIPTION ---
export async function registerAction(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const role = formData.get('role') as 'owner' | 'employee';
  
  let targetBoutiqueId: string | null = null;

  // 1. Validation (Employé) : Vérifier si le code boutique existe
  if (role === 'employee') {
    const boutiqueCode = formData.get('boutiqueCode') as string;
    const { data: boutique, error: vError } = await supabase
      .from('boutiques')
      .select('id')
      .eq('boutique_code', boutiqueCode)
      .single();

    if (vError || !boutique) {
      return { error: "Code boutique invalide." };
    }
    targetBoutiqueId = boutique.id;
  }

  // 2. Création de l'utilisateur dans Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    if (authError?.message.includes('already registered')) return { error: "Cet email est déjà utilisé." };
    return { error: authError?.message || "Erreur d'inscription." };
  }

  const userId = authData.user.id;

  // 3. Création de la boutique (Propriétaire)
  if (role === 'owner') {
    const boutiqueName = formData.get('boutiqueName') as string;
    // Génération d'un code unique
    const generatedCode = 'LIKI-' + Math.floor(100000 + Math.random() * 900000);
    
    const { data: newBoutique, error: bError } = await supabase
      .from('boutiques')
      .insert([{ name: boutiqueName, owner_id: userId, boutique_code: generatedCode }])
      .select('id')
      .single();

    if (bError) return { error: "Erreur lors de la création de la boutique." };
    targetBoutiqueId = newBoutique.id;
  }

  // 4. Création du profil (Note : Idéalement géré par le Trigger SQL dont on a parlé)
  const { error: pError } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: fullName,
    email: email,
    role: role,
    boutique_id: targetBoutiqueId,
    status: role === 'owner' ? 'active' : 'pending' // L'employé est en attente
  });

  if (pError) return { error: "Erreur lors de la création du profil." };

  // 5. Redirection intelligente
  if (role === 'owner') {
    redirect('/dashboard');
  } else {
    redirect('/dashboard/pending');
  }
}

// --- ACTION DE CONNEXION ---
export async function loginAction(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // 1. Authentification
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: "Identifiants incorrects." };
  }

  // 2. Vérification du profil pour le routage
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', authData.user.id)
    .single();

  if (!profile) return { error: "Profil introuvable." };

  // 3. Redirection basée sur le rôle et le statut
  if (profile.role === 'owner') {
    redirect('/dashboard');
  } else if (profile.role === 'employee') {
    if (profile.status === 'pending') {
      redirect('/dashboard/pending');
    } else {
      redirect('/dashboard/vendeur');
    }
  }
}