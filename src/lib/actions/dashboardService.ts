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

  // Récupérer les ventes avec les sale_items et les prix d'achat
  const { data: salesData } = await supabase
    .from('sales')
    .select(`
      id,
      created_at,
      sale_currency,
      total_amount,
      sale_items (
        unit_price,
        quantity,
        currency,
        product_id,
        products (
          purchase_price,
          currency
        )
      )
    `)

  let total_usd = 0
  let total_cdf = 0
  let dailyRevenueMap: Record<string, { chiffre_affaires: number; benefice_net: number }> = {}

  salesData?.forEach(sale => {
    let saleTotalUSD = 0
    let saleTotalCDF = 0
    let saleGlobalChiffreAffairesCDF = 0 // Pour le calcul du CA Global journalier
    let saleBeneficeCDF = 0

    sale.sale_items?.forEach((item: any) => {
      const quantity = item.quantity || 1
      const unitPrice = item.unit_price || 0
      const purchasePrice = item.products?.purchase_price || 0
      const itemCurrency = item.currency || item.products?.currency || 'CDF'

      const itemTotal = unitPrice * quantity
      const itemCost = purchasePrice * quantity
      const benefice = itemTotal - itemCost

      if (itemCurrency === 'USD') {
        // Caisse Dollar uniquement
        saleTotalUSD += itemTotal
        
        // Pour les totaux globaux et bénéfices (convertis en CDF)
        saleGlobalChiffreAffairesCDF += itemTotal * exchangeRate
        saleBeneficeCDF += benefice * exchangeRate
      } else {
        // Caisse Franc Congolais uniquement
        saleTotalCDF += itemTotal
        
        // Pour les totaux globaux et bénéfices
        saleGlobalChiffreAffairesCDF += itemTotal
        saleBeneficeCDF += benefice
      }
    })

    // Cumul strict des tiroirs de caisses par devise
    total_usd += saleTotalUSD
    total_cdf += saleTotalCDF

    // Agrégation par jour (Le Chiffre d'affaires Global doit rester en CDF)
    const dateKey = new Date(sale.created_at).toISOString().split('T')[0]
    if (!dailyRevenueMap[dateKey]) {
      dailyRevenueMap[dateKey] = { chiffre_affaires: 0, benefice_net: 0 }
    }
    dailyRevenueMap[dateKey].chiffre_affaires += saleGlobalChiffreAffairesCDF
    dailyRevenueMap[dateKey].benefice_net += saleBeneficeCDF
  })

  // Convertir la map en tableau
  const dailyRevenue = Object.entries(dailyRevenueMap).map(([date, values]) => ({
    date,
    chiffre_affaires: values.chiffre_affaires,
    benefice_net: values.benefice_net
  })).sort((a, b) => b.date.localeCompare(a.date))

  const todayDate = new Date().toISOString().split('T')[0]
  const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let caToday = 0, caYesterday = 0, benefToday = 0, benefYesterday = 0

  dailyRevenue.forEach(day => {
    if (day.date === todayDate) { caToday = day.chiffre_affaires; benefToday = day.benefice_net }
    if (day.date === yesterdayDate) { caYesterday = day.chiffre_affaires; benefYesterday = day.benefice_net }
  })

  const progressionCA = (caYesterday > 0 && caToday > 0)
    ? Math.round(((caToday - caYesterday) / caYesterday) * 100)
    : 0

  const progressionBenefice = (benefYesterday > 0 && benefToday > 0)
    ? Math.round(((benefToday - benefYesterday) / (caYesterday || 1)) * 100)
    : 0

  return {
    dailyRevenue: dailyRevenue.length > 0 ? dailyRevenue : revenue || [],
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