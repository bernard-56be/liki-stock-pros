'use server';

import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js'; // Importation du type User pour supprimer le 'any'

// Définition propre sans aucun 'any' pour valider les règles d'Exaucé
interface ProfileStatusResult {
  user: User | null;
  status: 'active' | 'pending' | 'rejected' | null;
  error: string | null;
}

/**
 * Action serveur pour récupérer de manière sécurisée le statut initial de l'utilisateur
 */
export async function getInitialProfileStatus(): Promise<ProfileStatusResult> {
  // AJOUT DE AWAIT ICI : Car createClient() renvoie une Promise sur le serveur
  const supabase = await createClient();

  try {
    // 1. Récupération de la session utilisateur côté serveur
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { user: null, status: null, error: null };
    }

    // 2. Récupération du statut dans la table profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { user, status: null, error: "Impossible de récupérer votre statut en base de données." };
    }

    return {
      user,
      status: profile?.status as 'active' | 'pending' | 'rejected',
      error: null
    };
 } catch {
    // Plus besoin de spécifier (err), l'avertissement disparaît immédiatement !
    return { user: null, status: null, error: "Une erreur serveur est survenue." };
  }
}

/**
 * Action serveur pour déconnecter l'utilisateur de manière propre
 */
export async function signOutAction() {
  // AJOUT DE AWAIT ICI AUSSI
  const supabase = await createClient();
  await supabase.auth.signOut();
}