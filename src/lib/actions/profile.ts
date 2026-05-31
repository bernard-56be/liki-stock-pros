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

    const role = user.user_metadata?.role;
    const updateData: Record<string, string> = { full_name: fullName };

    if (role === 'owner' && boutiqueName && boutiqueName.trim() !== '') {
      updateData.boutique_name = boutiqueName;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) throw error;

    return { success: true, message: "Informations mises à jour avec succès." };
  } catch (error) {
    console.error("Erreur updateProfileInfo:", error);
    return { success: false, message: "Erreur lors de la mise à jour du profil." };
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