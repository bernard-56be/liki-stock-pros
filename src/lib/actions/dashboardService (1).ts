'use server'
import { createClient } from '@/lib/supabase/server';

import type { DailyRevenue, TopProduitVendu } from '@/types/types/database.types';

export interface DashboardData {
  dailyRevenue: DailyRevenue[];
  topProducts: TopProduitVendu[];
  outOfStockCount: number;
}

export const fetchDashboardData = async (boutiqueId: string): Promise<DashboardData> => {
  try {
    const supabase = await createClient();

    // 1. Chiffre d'affaires et Bénéfice (via vue_revenu_journalier)
    const { data: revenue, error: revenueError } = await supabase
      .from('vue_revenu_journalier')
      .select('*')
      .eq('boutique_id', boutiqueId)
      .order('date', { ascending: false });

    if (revenueError) throw new Error(revenueError.message);

    // 2. Top 5 Produits (via vue_top_produits_vendus)
    const { data: topProducts, error: topError } = await supabase
      .from('vue_top_produits_vendus')
      .select('*')
      .limit(5);

    if (topError) throw new Error(topError.message);

    // 3. Alerte Rupture (Compteur de produits avec stock === 0)
    const { count, error: stockError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('stock_quantity', 0);

    if (stockError) throw new Error(stockError.message);

    return {
      dailyRevenue: revenue || [],
      topProducts: topProducts || [],
      outOfStockCount: count || 0,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
    console.error('Server Action Error:', message);
    throw new Error(message);
  }
};