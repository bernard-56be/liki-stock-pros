'use server'

import { createClient } from '@/lib/supabase/server'
import type { DailyRevenue, TopProduitVendu } from '@/types/database.types'

export interface DashboardData {
  dailyRevenue: DailyRevenue[]
  topProducts: TopProduitVendu[]
  outOfStockCount: number
}

export const fetchDashboardData = async (): Promise<DashboardData> => {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Utilisateur non connecté')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('boutique_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.boutique_id) {
    throw new Error('Aucune boutique associée à votre compte')
  }

  const { data: revenue, error: revenueError } = await supabase
    .from('vue_revenu_journalier')
    .select('*')
    .eq('boutique_id', profile.boutique_id)
    .order('date', { ascending: false })

  if (revenueError) throw new Error(revenueError.message)

  const { data: topProducts, error: topError } = await supabase
    .from('vue_top_produits_vendus')
    .select('*')
    .limit(5)

  if (topError) throw new Error(topError.message)

  // Ruptures : gestion propre de l'erreur RLS
  let outOfStockCount = 0
  const { count, error: stockError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('stock_quantity', 0)

  if (!stockError) {
    outOfStockCount = count || 0
  } else {
    console.warn('Compteur ruptures indisponible (RLS) :', stockError)
  }

  return {
    dailyRevenue: revenue || [],
    topProducts: topProducts || [],
    outOfStockCount,
  }
}