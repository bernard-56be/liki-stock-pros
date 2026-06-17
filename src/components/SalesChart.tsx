<<<<<<<<< Temporary merge branch 1
// components/SalesChart.tsx
import type { TopProduitVendu } from '../types/database.types';
=========
"use client";

import type { TopProduitVendu } from "@/types/database.types";
>>>>>>>>> Temporary merge branch 2

interface SalesChartProps {
  topProducts: TopProduitVendu[];
}

export default function SalesChart({ topProducts }: SalesChartProps) {
  if (!topProducts || topProducts.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-purple-500 text-lg">📊</span>
          <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
            Top 5 Produits
          </h3>
        </div>
        <p className="text-gray-500 text-sm">Aucune vente enregistrée.</p>
      </div>
    );
  }

  const maxVendus = Math.max(...topProducts.map((p) => p.total_vendus), 1);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-purple-500 text-lg">📊</span>
        <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
          Top 5 Produits
        </h3>
      </div>

      <div className="flex items-end justify-between gap-3 h-48 px-2">
        {topProducts.map((product, index) => {
          const heightPercent = (product.total_vendus / maxVendus) * 100;
          const colors = [
            "from-blue-600 to-blue-400",
            "from-blue-500 to-blue-300",
            "from-blue-400 to-blue-200",
            "from-blue-300 to-blue-100",
            "from-blue-200 to-blue-50",
          ];

          return (
            <div key={product.product_id} className="flex flex-col items-center flex-1 h-full justify-end">
              <span className="text-xs font-bold text-gray-700 mb-1">
                {product.total_vendus}
              </span>
              <div
                className={`w-full max-w-10[40px] rounded-t-lg bg-linear-to-t ${colors[index] || colors[4]} transition-all duration-300 hover:brightness-110`}
                style={{ height: `${heightPercent}%` }}
                title={`${product.product_name} : ${product.total_vendus} ventes`}
              />
              <span className="text-xs text-gray-600 mt-2 font-medium text-center w-full truncate">
                {product.product_name?.substring(0, 10) ?? "?"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}