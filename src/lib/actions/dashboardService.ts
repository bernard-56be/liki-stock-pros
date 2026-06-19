'use server'

import { createClient } from '@/lib/supabase/server'
import type { DailyRevenue, TopProduitVendu } from '@/types/database.types'

export interface DashboardData {
  dailyRevenue: DailyRevenue[]
  topProducts: TopProduitVendu[]
  outOfStockCount: number
  exchange_rate: number
  default_currency: string
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

  const { data: boutique } = await supabase
    .from('boutiques')
    .select('exchange_rate, default_currency')
    .eq('id', profile.boutique_id)
    .single()

  const exchangeRate = Number(boutique?.exchange_rate) || 2850
  const defaultCurrency = boutique?.default_currency || 'USD'

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

  let outOfStockCount = 0
  const { count, error: stockError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .lte('quantity', 5)

  if (!stockError) {
    outOfStockCount = count || 0
  }

  return {
    dailyRevenue: revenue || [],
    topProducts: topProducts || [],
    outOfStockCount,
    exchange_rate: exchangeRate,
    default_currency: defaultCurrency,
  }
}