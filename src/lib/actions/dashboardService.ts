'use server'

import { createClient } from '@/lib/supabase/server'
import type { DailyRevenue, TopProduitVendu } from '@/types/database.types'

export interface DashboardData {
  dailyRevenue: DailyRevenue[]
  topProducts: TopProduitVendu[]
  outOfStockCount: number
}

export interface FinancialStats {
  total_usd: number
  total_cdf: number
  total_global: number
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
    .eq('stock_quantity', 0)

  if (!stockError) {
    outOfStockCount = count || 0
  }

  return {
    dailyRevenue: revenue || [],
    topProducts: topProducts || [],
    outOfStockCount,
  }
}

export async function getFinancialStats(): Promise<FinancialStats> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Utilisateur non connecté')

  const { data: profile } = await supabase
    .from('profiles')
    .select('boutique_id')
    .eq('id', user.id)
    .single()

  if (!profile?.boutique_id) throw new Error('Aucune boutique associée')

  const { data: boutique } = await supabase
    .from('boutiques')
    .select('default_currency, exchange_rate')
    .eq('id', profile.boutique_id)
    .single()

  const defaultCurrency = boutique?.default_currency || 'USD'
  const rate = Number(boutique?.exchange_rate) || 1

  const { data: sales } = await supabase
    .from('sales')
    .select('total_amount, sale_currency')

  let total_usd = 0
  let total_cdf = 0

  sales?.forEach(sale => {
    if (sale.sale_currency === 'USD') total_usd += Number(sale.total_amount)
    if (sale.sale_currency === 'CDF') total_cdf += Number(sale.total_amount)
  })

  const total_global = defaultCurrency === 'USD'
    ? total_usd + total_cdf / rate
    : total_cdf + total_usd * rate

  return { total_usd, total_cdf, total_global, default_currency: defaultCurrency }
}