"use client";

import { useEffect, useState } from "react";
import { fetchDashboardData, type DashboardData } from "@/lib/actions/dashboardService";
import DashboardKpi from "@/components/DashboardKpi";
import SalesChart from "@/components/SalesChart";

export default function OwnerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const result = await fetchDashboardData();
        setData(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <p className="text-gray-600">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl font-bold">
          Erreur : {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const today = data.dailyRevenue[0] || { chiffre_affaires: 0, benefice_net: 0 };
  const rate = data.exchange_rate;

  const caUSD = today.chiffre_affaires;
  const benefUSD = today.benefice_net;
  const caCDF = caUSD * rate;
  const benefCDF = benefUSD * rate;

  const last7Days = [...data.dailyRevenue].reverse().slice(-7);
  const caSparkline = last7Days.map(d => d.chiffre_affaires);
  const benefSparkline = last7Days.map(d => d.benefice_net);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-900">📊 Tableau de Bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardKpi
          title="💰 Chiffre d'Affaires"
          value={`${caUSD.toFixed(2)} $`}
          secondary={`${caCDF.toLocaleString()} FC`}
          valueColor="text-green-600"
          sparklineData={caSparkline}
          sparklineColor="#10B981"
        />
        <DashboardKpi
          title="📈 Bénéfice Net"
          value={`${benefUSD.toFixed(2)} $`}
          secondary={`${benefCDF.toLocaleString()} FC`}
          valueColor="text-blue-600"
          sparklineData={benefSparkline}
          sparklineColor="#3B82F6"
        />
        <DashboardKpi
          title="🚨 Alerte Rupture"
          value={data.outOfStockCount}
          valueColor="text-red-600"
        />
      </div>

      <SalesChart topProducts={data.topProducts} />
    </div>
  );
}