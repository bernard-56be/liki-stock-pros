'use server'

import { createClient } from '@/lib/supabase/server'
import type { DailyRevenue, TopProduitVendu } from '@/types/database.types'

export interface DashboardData {
  dailyRevenue: DailyRevenue[]
  topProducts: TopProduitVendu[]
  outOfStockCount: number
  exchange_rate: number
  default_currency: string
  total_usd: number
  total_cdf: number
  progressionCA: number
  progressionBenefice: number
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

  if (profileError || !profile?.boutique_id) throw new Error('Aucune boutique associée')

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
    .eq('boutique_id', profile.boutique_id)
    .lte('quantity', 5)

  if (!stockError) outOfStockCount = count || 0

  const { data: sales } = await supabase
    .from('sales')
    .select('total_amount, sale_currency')

  let total_usd = 0
  let total_cdf = 0
  sales?.forEach(sale => {
    if (sale.sale_currency === 'USD') total_usd += Number(sale.total_amount)
    if (sale.sale_currency === 'CDF') total_cdf += Number(sale.total_amount)
  })

  const todayDate = new Date().toISOString().split('T')[0]
  const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let caToday = 0, caYesterday = 0, benefToday = 0, benefYesterday = 0

  revenue?.forEach(day => {
    if (day.date === todayDate) { caToday = day.chiffre_affaires; benefToday = day.benefice_net }
    if (day.date === yesterdayDate) { caYesterday = day.chiffre_affaires; benefYesterday = day.benefice_net }
  })

  // Sécurisation : éviter les pourcentages explosifs quand J-1 est à 0
  const progressionCA = (caYesterday > 0 && caToday > 0)
    ? Math.round(((caToday - caYesterday) / caYesterday) * 100)
    : 0

  const progressionBenefice = (benefYesterday > 0 && benefToday > 0)
    ? Math.round(((benefToday - benefYesterday) / benefYesterday) * 100)
    : 0

  return {
    dailyRevenue: revenue || [],
    topProducts: topProducts || [],
    outOfStockCount,
    exchange_rate: exchangeRate,
    default_currency: defaultCurrency,
    total_usd,
    total_cdf,
    progressionCA,
    progressionBenefice,
  }
}