'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Supprime un compte utilisateur et ses données associées selon son rôle.
 * - Employé ou propriétaire non unique : seule suppression du compte auth.
 * - Propriétaire unique : purge complète (Storage + compte) avant suppression.
 */
export async function deleteAccount() {
  const supabase = await createClient();

  // Vérifier l'utilisateur connecté
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, message: 'Non authentifié' };
  }

  // Récupérer le profil (boutique_id, rôle)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('boutique_id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.boutique_id) {
    return { success: false, message: 'Profil introuvable' };
  }

  const isOwner = profile.role === 'owner';

  // Compter les propriétaires de la boutique
  const { count, error: countError } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('boutique_id', profile.boutique_id)
    .eq('role', 'owner');

  if (countError) {
    return { success: false, message: 'Erreur lors du comptage des propriétaires' };
  }

  const isSoleOwner = isOwner && count === 1;

  // 1. Si propriétaire unique : purger le Storage avant la suppression
  if (isSoleOwner) {
    const bucketName = 'product-images';
    const folderPath = `${profile.boutique_id}/`;

    // Lister tous les fichiers du dossier boutique
    const { data: files, error: listError } = await supabase.storage
      .from(bucketName)
      .list(folderPath);

    if (!listError && files && files.length > 0) {
      const filePaths = files.map((file) => `${folderPath}${file.name}`);
      // Supprimer tous les fichiers en une seule requête
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove(filePaths);

      if (deleteError) {
        console.error('Erreur suppression Storage:', deleteError);
        // On continue quand même pour ne pas bloquer la suppression du compte
      }
    }
  }

  // 2. Supprimer le compte utilisateur via l'API Admin
  // L'auto-suppression directe est bloquée par l'auth client, d'où l'API admin.
  const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);

  if (deleteUserError) {
    console.error('Erreur suppression compte:', deleteUserError);
    return { success: false, message: 'Erreur lors de la suppression du compte' };
  }

  // 3. Nettoyer les caches et rediriger côté client
  revalidatePath('/');

  return { success: true, message: 'Compte supprimé avec succès' };
}