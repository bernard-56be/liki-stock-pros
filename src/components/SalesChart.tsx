"use client";

import React from "react";
import type { TopProduitVendu } from "@/types/database.types";

interface SalesChartProps {
  topProducts: TopProduitVendu[];
}

const SalesChart: React.FC<SalesChartProps> = ({ topProducts }) => {
  if (!topProducts || topProducts.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          📊 Top 5 Produits
        </h3>
        <p className="text-gray-400 text-sm">Aucune vente enregistrée pour le moment.</p>
      </div>
    );
  }

  const maxVendus = Math.max(...topProducts.map((p) => p.total_vendus), 1);

  const colors = [
    "bg-gradient-to-t from-emerald-500 to-emerald-300",
    "bg-gradient-to-t from-amber-500 to-amber-300",
    "bg-gradient-to-t from-sky-500 to-sky-300",
    "bg-gradient-to-t from-rose-500 to-rose-300",
    "bg-gradient-to-t from-indigo-500 to-indigo-300",
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6">
        📊 Top 5 Produits Vendus
      </h3>

      {/* Graphique : hauteur augmentée à 64 (h-64 = 256px) */}
      <div className="flex items-end justify-between gap-5 h-64 px-4">
        {topProducts.map((product, index) => {
          const heightPercent = (product.total_vendus / maxVendus) * 100;

          return (
            <div
              key={product.product_id}
              className="flex flex-col items-center flex-1 h-full justify-end"
            >
              {/* Quantité vendue au-dessus de la barre */}
              <span className="text-sm font-extrabold text-gray-800 mb-2">
                {product.total_vendus}
              </span>

              {/* Barre */}
              <div
                className={`w-full max-w-[36px] rounded-t-xl ${colors[index] || colors[4]} shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg`}
                style={{ height: `${heightPercent}%` }}
                title={`${product.product_name} : ${product.total_vendus} ventes`}
              />

              {/* Nom complet du produit, sur 2 lignes max */}
              <span className="text-xs font-semibold text-gray-700 mt-3 text-center w-full leading-tight line-clamp-2">
                {product.product_name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(SalesChart);