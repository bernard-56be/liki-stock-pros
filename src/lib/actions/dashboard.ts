import { createClient } from "@/lib/supabase/client";
import type { DailyRevenue, TopProduitVendu } from "@/types/types/database.types";

export async function fetchDashboardData() {
  const supabase = createClient();

  const [dailyRes, topRes, ruptureRes] = await Promise.all([
    supabase.from("vue_revenu_journalier").select("*").single(),
    supabase.from("vue_top_produits_vendus").select("*").limit(5),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("stock_quantity", 0)
  ]);

  if (dailyRes.error || topRes.error || ruptureRes.error) {
    throw new Error("Impossible de charger les données du tableau de bord.");
  }

  return {
    dailyRevenue: dailyRes.data as DailyRevenue | null,
    topProducts: (topRes.data as TopProduitVendu[]) || [],
    ruptureCount: ruptureRes.count || 0,
  };
}