'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Interface pour la table profiles
interface ProfileUpdatePayload {
  full_name: string;
}

// Interface pour la table boutiques
interface BoutiqueUpdatePayload {
  name?: string;
  default_currency?: string;
  exchange_rate?: number;
}

export async function updateProfileInfo(formData: FormData) {
  const fullName = formData.get('fullName') as string;
  const boutiqueName = formData.get('boutiqueName') as string | null;
  const defaultCurrency = formData.get('defaultCurrency') as string | null;
  const exchangeRateRaw = formData.get('exchangeRate') as string | null;
  const exchangeRate = exchangeRateRaw ? parseFloat(exchangeRateRaw) : null;

  if (!fullName || fullName.trim() === '') {
    return { success: false, message: "Le nom complet est obligatoire." };
  }


  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "Vous devez être connecté." };
    }

    // 1. Mise à jour des informations du profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName } as ProfileUpdatePayload)
      .eq('id', user.id)
      .select('boutique_id, role')
      .single();

    if (profileError) throw profileError;

    // 2. Mise à jour de la boutique si l'utilisateur est propriétaire
    const role = user.user_metadata?.role || profile?.role;
    if (role === 'owner' && profile?.boutique_id) {
      const boutiqueUpdates: BoutiqueUpdatePayload = {};

      if (boutiqueName?.trim()) boutiqueUpdates.name = boutiqueName;
      if (defaultCurrency) boutiqueUpdates.default_currency = defaultCurrency;
      if (exchangeRate !== null && !isNaN(exchangeRate)) boutiqueUpdates.exchange_rate = exchangeRate;

      if (Object.keys(boutiqueUpdates).length > 0) {
        const { error: boutiqueError } = await supabase
          .from('boutiques')
          .update(boutiqueUpdates)
          .eq('id', profile.boutique_id);

        if (boutiqueError) throw boutiqueError;
      }
    } else if (role === 'owner' && !profile?.boutique_id) {
      return { success: false, message: "Aucune boutique associée à ce compte propriétaire." };
    }

    revalidatePath('/settings');

    revalidatePath('/dashboard', 'layout');

   return { success: true, message: "Informations mises à jour avec succès." };
  } catch (error: unknown) {
    console.error("Erreur updateProfileInfo:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur lors de la mise à jour.";
    return { success: false, message: errorMessage };
  }
}

// AJOUTEZ CECI POUR CORRIGER L'ERREUR :
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
  } catch (error: unknown) {
    console.error("Erreur updatePassword:", error);
    return { success: false, message: "Erreur lors de la mise à jour du mot de passe." };
  }
}