"use client";

import type { TopProduitVendu } from "@/types/types/database.types";

interface SalesChartProps {
  topProducts: TopProduitVendu[];
}

export default function SalesChart({ topProducts }: SalesChartProps) {
  if (!topProducts || topProducts.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="text-md font-semibold text-gray-800 mb-4">📊 Top Produits Vendus</h3>
        <p className="text-gray-600">Aucune vente enregistrée pour le moment.</p>
      </div>
    );
  }

  const maxQuantity = Math.max(...topProducts.map((p) => p.totalquantity));

  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <h3 className="text-md font-semibold text-gray-800 mb-4">📊 Top Produits Vendus</h3>
      <div className="flex items-end justify-around h-40 gap-2">
        {topProducts.map((product) => {
          const heightPercent = (product.totalquantity / maxQuantity) * 100;
          return (
            <div key={product.product_id} className="flex flex-col items-center flex-1">
              <span className="text-xs text-gray-700 mb-1 font-medium">
                {product.totalquantity}
              </span>
              <div
                className="w-full bg-blue-500 rounded-t"
                style={{ height: `${heightPercent}%` }}
                title={product.product_name}
              />
              <span className="text-xs text-gray-600 mt-1 truncate w-full text-center">
                {product.product_name?.substring(0, 8) ?? "?"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}