'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const SUBSCRIPTION_LIMITS = {
  BRONZE: 1,
  SILVER: 3,
  GOLD: Infinity,
} as const

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

export async function getPendingEmployees() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

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