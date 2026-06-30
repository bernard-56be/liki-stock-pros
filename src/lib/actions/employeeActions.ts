'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Employee {
  id: string;
  full_name: string;
  role: 'employee' | 'associate' | 'owner';
}

export interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  limitReached?: boolean;
  currentCount?: number;
  maxAllowed?: number;
  subscription?: string;
}

const SUBSCRIPTION_LIMITS = {
  BRONZE: 1,
  SILVER: 3,
  GOLD: Infinity,
} as const

// --- Fonction 1 : approveEmployee ---
export async function approveEmployee(employeeId: string) {
  const supabase = await createClient()
  
  // 1. Récupérer l'utilisateur connecté (propriétaire)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Utilisateur non authentifié')

  // 2. Récupérer la boutique du propriétaire
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.shop_id) {
    throw new Error('Aucune boutique associée à ce compte')
  }

  if (profile.role !== 'owner') {
    throw new Error('Seul le propriétaire peut approuver des employés')
  }

  // 3. Récupérer l'abonnement de la boutique
  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .select('subscription')
    .eq('id', profile.shop_id)
    .single()

  if (shopError) throw new Error('Impossible de récupérer les informations de la boutique')

  const subscription = shop.subscription || 'BRONZE'
  const maxEmployees = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS]

  // 4. Compter les employés actifs
  const { count, error: countError } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', profile.shop_id)
    .eq('role', 'employee')
    .eq('status', 'active')

  if (countError) throw new Error('Impossible de compter les employés actifs')

  // 5. Vérifier la limite
  if (count !== null && count >= maxEmployees) {
    const subscriptionName = subscription.charAt(0) + subscription.slice(1).toLowerCase()
    return {
      success: false,
      error: `Limite atteinte pour l'offre ${subscriptionName} (${count}/${maxEmployees === Infinity ? '∞' : maxEmployees} employés actifs). Passez à l'offre Silver pour ajouter plus d'employés.`,
      limitReached: true,
      currentCount: count,
      maxAllowed: maxEmployees,
      subscription,
    }
  }

  // 6. Approuver l'employé
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', employeeId)
    .eq('shop_id', profile.shop_id)

  if (updateError) throw new Error('Erreur lors de l\'approbation')

  revalidatePath('/dashboard/owner/validation')
  return {
    success: true,
    message: 'Employé approuvé avec succès',
  }
}

// --- Fonction 2 : getPendingEmployees ---
export async function getPendingEmployees() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: profile } = await supabase.from('profiles').select('shop_id').eq('id', user.id).single()
  if (!profile?.shop_id) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, created_at')
    .eq('shop_id', profile.shop_id)
    .eq('role', 'employee')
    .eq('status', 'pending')

  if (error) throw new Error(error.message)
  return data || []
}

export async function getEmployeesFromDatabase(): Promise<Employee[]> {
  const supabase = await createClient()

  // 1. Récupération de l'utilisateur connecté
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  // 2. Récupération de la boutique associée à l'utilisateur[cite: 1]
  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

 if (!profile?.shop_id) return []
  

 // 3. Mettre à jour le rôle dans la table profiles
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('shop_id', profile.shop_id)
    .eq('status', 'active')

  if (error) throw new Error(error.message)
  return (data as Employee[]) || []
}

export interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// --- Fonction 4 : updateEmployeeRole (Nettoyée et unique) ---
export async function updateEmployeeRole(
  employeeId: string, 
  newRole: 'employee' | 'associate' | 'owner'
): Promise<ActionResponse> {
  const supabase = await createClient();
  
  // 1. Vérifier qui fait la demande
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: 'Utilisateur non authentifié' };
  }

  // 2. Vérifier que l'utilisateur actuel est bien le propriétaire de la boutique
  const { data: currentUserProfile, error: profileError } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !currentUserProfile?.shop_id) {
    return { success: false, error: 'Boutique introuvable' };
  }

  if (currentUserProfile.role !== 'owner') {
    return { success: false, error: 'Seul un propriétaire peut modifier les rôles' };
  }

  // 3. Mettre à jour le rôle de l'employé (en s'assurant qu'il est dans la même boutique)
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', employeeId)
    .eq('shop_id', currentUserProfile.shop_id); // Sécurité cruciale pour l'étanchéité

  if (updateError) {
    console.error('Erreur Supabase:', updateError.message);
    return { success: false, error: 'Erreur lors de la mise à jour du rôle' };
  }

  // 4. Rafraîchir les données de la page pour afficher le nouveau rôle
  revalidatePath('/dashboard/manage-employees');
  
  return { success: true, message: 'Le rôle a été mis à jour avec succès.' };
}