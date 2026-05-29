"use client";

import { useEffect, useState } from "react";
import { fetchDashboardData } from "@/lib/actions/dashboard";
import type { DailyRevenue, TopProduitVendu } from "@/types/types/database.types";
import KPICards from "./kpi-cards";
import SalesChart from "./sales-chart";

export default function OwnerDashboardPage() {
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduitVendu[]>([]);
  const [ruptureCount, setRuptureCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchDashboardData();
        setDailyRevenue(data.dailyRevenue);
        setTopProducts(data.topProducts);
        setRuptureCount(data.ruptureCount);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">📊 Tableau de Bord</h1>
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            Erreur : {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">📊 Tableau de Bord</h1>
        <KPICards dailyRevenue={dailyRevenue} ruptureCount={ruptureCount} />
        <SalesChart topProducts={topProducts} />
      </div>
    </div>
  );
}