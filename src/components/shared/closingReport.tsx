'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ClosingStats {
  total_usd: number;
  total_cdf: number;
  total_global_fc: number;
  sales_count: number;
  date: string;
}

export default function ClosingReport() {
  const [stats, setStats] = useState<ClosingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const supabase = createClient();

  const EXCHANGE_RATE = 2850; // 1 USD = 2850 FC

  useEffect(() => {
    const fetchClosingData = async () => {
      setLoading(true);
      const startDate = `${selectedDate}T00:00:00`;
      const endDate = `${selectedDate}T23:59:59`;

      const { data: sales, error } = await supabase
        .from('sales')
        .select('total_usd, total_cdf')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      let total_usd = 0;
      let total_cdf = 0;

      sales?.forEach((sale) => {
        total_usd += sale.total_usd || 0;
        total_cdf += sale.total_cdf || 0;
      });

      const total_global_fc = total_cdf + total_usd * EXCHANGE_RATE;

      setStats({
        total_usd,
        total_cdf,
        total_global_fc,
        sales_count: sales?.length || 0,
        date: selectedDate,
      });
      setLoading(false);
    };

    fetchClosingData();
  }, [selectedDate]);

  const formatFC = (amount: number) => `${amount.toLocaleString()} FC`;
  const formatUSD = (amount: number) => `${amount.toLocaleString()} USD`;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <p className="text-gray-500">Chargement du rapport...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800">📋 Clôture de caisse</h2>
        
        <div>
          <label htmlFor="closing-date" className="sr-only">
            Sélectionner une date
          </label>
          <input
            id="closing-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            title="Sélectionner une date pour voir le rapport"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-700 font-medium">💰 Recettes en USD</p>
          <p className="text-2xl font-bold text-green-800">{formatUSD(stats?.total_usd || 0)}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">💵 Recettes en FC</p>
          <p className="text-2xl font-bold text-blue-800">{formatFC(stats?.total_cdf || 0)}</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-700 font-medium">📊 CA consolidé</p>
          <p className="text-2xl font-bold text-purple-800">{formatFC(stats?.total_global_fc || 0)}</p>
          <p className="text-xs text-purple-500 mt-1">Base: 1 USD = {EXCHANGE_RATE.toLocaleString()} FC</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm text-gray-500">
        <span>🧾 Nombre de transactions : {stats?.sales_count || 0}</span>
        <span>📅 {new Date(selectedDate).toLocaleDateString('fr-FR')}</span>
      </div>
    </div>
  );
}