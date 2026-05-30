import { createClient } from "@/lib/supabase/client";
import type { DailyRevenue,  TopProduitVendu } from "@/types/types/database.types"; // adapte le chemin si besoin

export async function fetchDashboardData() {
  const supabase = createClient();

  const [dailyRes, topRes, ruptureRes] = await Promise.all([
    supabase.from("vue_revenu_journalier").select("*").single(),
    supabase.from("vue_top_produits_vendus").select("*").limit(5),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("stock_quantity", 0)
  ]);

  const { data: dailyData, error: dailyError } = dailyRes;
  const { data: topProducts, error: topError } = topRes;
  const { count: ruptureCount, error: ruptureError } = ruptureRes;

  if (dailyError || topError || ruptureError) {
    throw new Error("Impossible de charger les données du tableau de bord.");
  }

  return {
    dailyRevenue: dailyData as DailyRevenue | null,
    topProducts: (topProducts as  TopProduitVendu[]) || [],
    ruptureCount: ruptureCount || 0,
  };
}