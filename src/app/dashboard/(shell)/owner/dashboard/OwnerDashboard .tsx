'use client';

import React, { useState, useEffect } from 'react';
import { fetchDashboardData, DashboardData } from '@/owner/dashboard/dashboardService';

const OwnerDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const getDashboard = async () => {
      try {
        setLoading(true);
        const boutiqueId = 'votre-boutique-id'; // À remplacer par l'ID dynamique
        const result = await fetchDashboardData(boutiqueId);
        setData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Échec du chargement des données';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    getDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gray-50 min-h-screen">
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md font-bold">
          Erreur : {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const last7Days = [...data.dailyRevenue].reverse().slice(-7);
  const maxCA = Math.max(...last7Days.map(d => d.chiffre_affaires), 1);
  const today = data.dailyRevenue[0] || { chiffre_affaires: 0, benefice_net: 0 };

  return (
    <div className="p-4 space-y-8 bg-gray-50 min-h-screen pb-20">
      <header>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Espace Administration</h1>
        <p className="text-sm font-bold text-gray-600 mt-1 uppercase tracking-wider">Pilotage Business</p>
      </header>

      {/* KPI CARDS */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Chiffre d affaires (Jour)</h3>
          <p className="mt-2 text-3xl font-black text-green-600">
            {today.chiffre_affaires.toLocaleString()} <span className="text-sm font-medium">FC</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Bénéfice Net</h3>
          <p className="mt-2 text-3xl font-black text-gray-800">
            {today.benefice_net.toLocaleString()} <span className="text-sm font-medium">FC</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Alerte Rupture</h3>
          <p className="mt-2 text-3xl font-black text-red-600">
            {data.outOfStockCount} <span className="text-sm font-medium">Produits à 0</span>
          </p>
        </div>
      </section>

      {/* HISTOGRAMME CSS */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-xs font-black text-gray-800 mb-6 uppercase tracking-widest">Ventes des 7 derniers jours</h3>
        <div className="flex items-end justify-between h-48 gap-2 px-2 border-b border-gray-100">
          {last7Days.map((day, idx) => {
            const percentage = (day.chiffre_affaires / maxCA) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div 
                  className="w-full max-w-8 bg-blue-500 rounded-t-md transition-all duration-300 group-hover:bg-blue-600"
                  style={{ height: `${percentage}%` }}
                ></div>
                <span className="mt-2 text-[10px] font-black text-gray-600 uppercase">
                  {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* TABLEAU TOP PRODUITS */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/30">
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Top 5 Produits Vendus</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-4 text-[10px] font-black text-gray-600 uppercase">Désignation</th>
                <th className="p-4 text-[10px] font-black text-gray-600 uppercase text-right">Quantité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.topProducts.map((p) => (
                <tr key={p.product_id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm font-bold text-gray-800">{p.product_name}</td>
                  <td className="p-4 text-sm font-black text-gray-800 text-right">{p.total_vendus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default OwnerDashboard;