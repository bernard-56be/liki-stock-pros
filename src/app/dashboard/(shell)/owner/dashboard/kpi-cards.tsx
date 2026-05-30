"use client";

import type { DailyRevenue } from "@/types/types/database.types";

interface KPICardsProps {
  dailyRevenue: DailyRevenue | null;
  ruptureCount: number;
}

export default function KPICards({ dailyRevenue, ruptureCount }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="text-sm font-medium text-gray-600">💰 Chiffre d Affaires</h3>
        <p className="text-2xl font-bold text-green-600">
          ${dailyRevenue?.chiffre_affaires?.toFixed(2) ?? "0.00"}
        </p>
        <p className="text-xs text-gray-600">Aujourdhui</p>
      </div>
      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="text-sm font-medium text-gray-600">📈 Bénéfice Net</h3>
        <p className="text-2xl font-bold text-blue-600">
          ${dailyRevenue?.benefice_net?.toFixed(2) ?? "0.00"}
        </p>
        <p className="text-xs text-gray-600">Aujourdhui</p>
      </div>
      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="text-sm font-medium text-gray-600">🚨 Ruptures</h3>
        <p className="text-2xl font-bold text-red-600">{ruptureCount}</p>
        <p className="text-xs text-gray-600">Produits épuisés</p>
      </div>
    </div>
  );
}