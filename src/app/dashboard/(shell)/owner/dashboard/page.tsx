"use client";

import { useEffect, useState } from "react";
import { fetchDashboardData, type DashboardData } from "@/lib/actions/dashboardService";
import DashboardKpi from "@/components/DashboardKpi";
import SalesChart from "@/components/SalesChart";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { generateDailyReportPdf } from '@/lib/actions/reports';
import { Button } from "@/components/ui/button";
import { CalendarDays, FileDown } from "lucide-react";

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

  const handleDownloadReport = async () => {
    try {
      const pdfDataUri = await generateDailyReportPdf();
      const a = document.createElement("a");
      a.href = pdfDataUri;
      a.download = `rapport-caisse-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 p-6"><p className="text-gray-600">Chargement...</p></div>;
  if (error) return <div className="min-h-screen bg-gray-50 p-6"><div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl font-bold">Erreur : {error}</div></div>;
  if (!data || !data.dailyRevenue || data.dailyRevenue.length === 0) {
    return <div className="min-h-screen bg-gray-50 p-6"><p className="text-gray-500">Aucune donnée disponible pour le moment.</p></div>;
  }

  const today = data.dailyRevenue[0] || { chiffre_affaires: 0, benefice_net: 0 };
  const rate = data.exchange_rate || 2850;

  const caUSD = Number(today.chiffre_affaires) || 0;
  const benefUSD = Number(today.benefice_net) || 0;
  const caCDF = caUSD * rate;
  const benefCDF = benefUSD * rate;

  const last7Days = [...data.dailyRevenue].reverse().slice(-7);
  const caSparkline = last7Days.map(d => Number(d.chiffre_affaires) || 0);
  const benefSparkline = last7Days.map(d => Number(d.benefice_net) || 0);

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-gray-900">📊 Tableau de Bord</h1>
          <div className="flex items-center gap-4">
            {/* Date stylée */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200 shadow-sm text-sm text-gray-700">
              <CalendarDays className="w-4 h-4 text-indigo-500" />
              <span className="font-medium">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
                        {/* Bouton utilisant le composant de l'app */}
            <Button
  variant="primary"
  size="sm"
  onClick={handleDownloadReport}
  className="h-[50px] px-3 flex items-center gap-2 text-sm rounded-xl"
>
  <FileDown className="w-4 h-4" />
  <span>Télécharger le rapport</span>
</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DashboardKpi
            title="💰 Chiffre d'Affaires Global"
            value={`${caUSD.toFixed(2)} $`}
            secondary={`${caCDF.toLocaleString()} FC`}
            valueColor="text-green-600"
            progression={data.progressionCA}
            sparklineData={caSparkline}
            sparklineColor="#10B981"
          />
          <DashboardKpi
            title="📈 Bénéfice Net Global"
            value={`${benefUSD.toFixed(2)} $`}
            secondary={`${benefCDF.toLocaleString()} FC`}
            valueColor="text-blue-600"
            progression={data.progressionBenefice}
            sparklineData={benefSparkline}
            sparklineColor="#3B82F6"
          />
          <DashboardKpi
            title="🚨 Ruptures"
            value={data.outOfStockCount || 0}
            valueColor="text-red-600"
          />
          <DashboardKpi
            title="💵 Total perçu en USD"
            value={`$${(data.total_usd || 0).toLocaleString()}`}
            valueColor="text-blue-600"
          />
          <DashboardKpi
            title="💵 Total perçu en CDF"
            value={`${(data.total_cdf || 0).toLocaleString()} FC`}
            valueColor="text-green-600"
          />
        </div>

        <SalesChart topProducts={data.topProducts || []} />
      </div>
    </NotificationProvider>
  );
}