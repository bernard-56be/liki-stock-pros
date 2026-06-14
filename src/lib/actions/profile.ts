'use server';

import { createClient } from "@/lib/supabase/server";

export async function updateProfileInfo(formData: FormData) {
  const fullName = formData.get('fullName') as string;
  const boutiqueName = formData.get('boutiqueName') as string | null;

  if (!fullName || fullName.trim() === '') {
    return { success: false, message: "Le nom complet est obligatoire." };
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Vous devez être connecté." };
    }

    // 1. Mise à jour des informations de l'utilisateur dans la table 'profiles'
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)
      .select('boutique_id, role')
      .single();

    if (profileError) throw profileError;

    // 2. Si l'utilisateur est un propriétaire et qu'un nom de boutique est fourni
    const role = user.user_metadata?.role || profile?.role;
    if (role === 'owner' && boutiqueName && boutiqueName.trim() !== '') {
      
      if (!profile?.boutique_id) {
        return { success: false, message: "Aucune boutique associée à ce compte propriétaire." };
      }

      // Mise à jour du nom de la boutique dans la table 'boutiques' (colonne 'name')
      const { error: boutiqueError } = await supabase
        .from('boutiques')
        .update({ name: boutiqueName }) // Ajuste 'name' si ta colonne s'appelle différemment
        .eq('id', profile.boutique_id);

      if (boutiqueError) throw boutiqueError;
    }

    return { success: true, message: "Informations mises à jour avec succès." };
  } catch (error) {
    console.error("Erreur updateProfileInfo:", error);
    return { success: false, message: "Erreur lors de la mise à jour du profil ou de la boutique." };
  }
}

export async function updatePassword(formData: FormData) {
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: "Le mot de passe doit contenir au moins 6 caractères." };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, message: "Les mots de passe ne correspondent pas." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) throw error;

    return { success: true, message: "Mot de passe modifié avec succès." };
  } catch (error) {
    console.error("Erreur updatePassword:", error);
    return { success: false, message: "Erreur lors de la mise à jour du mot de passe." };
  }
}