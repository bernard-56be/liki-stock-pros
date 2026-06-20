"use client";

import React from "react";
import Sparkline from "@/components/Sparkline";

interface DashboardKpiProps {
  title: string;
  value: string | number;
  secondary?: string;
  valueColor: string;
  progression?: number;
  sparklineData?: number[];
  sparklineColor?: string;
}

const DashboardKpi: React.FC<DashboardKpiProps> = ({
  title,
  value,
  secondary,
  valueColor,
  progression,
  sparklineData,
  sparklineColor = "#3B82F6",
}) => {
  // Extraire la couleur de fond depuis la couleur du texte
  const bgColor = valueColor.includes("green")
    ? "bg-green-50"
    : valueColor.includes("blue")
    ? "bg-blue-50"
    : valueColor.includes("red")
    ? "bg-red-50"
    : valueColor.includes("purple")
    ? "bg-purple-50"
    : "bg-gray-50";

  const iconColor = valueColor.includes("green")
    ? "bg-green-100 text-green-600"
    : valueColor.includes("blue")
    ? "bg-blue-100 text-blue-600"
    : valueColor.includes("red")
    ? "bg-red-100 text-red-600"
    : valueColor.includes("purple")
    ? "bg-purple-100 text-purple-600"
    : "bg-gray-100 text-gray-600";

  const progressionColor =
    progression !== undefined
      ? progression >= 0
        ? "text-green-600 bg-green-50"
        : "text-red-600 bg-red-50"
      : "";

  return (
    <div className={`${bgColor} rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300`}>
      {/* Icône + Titre */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center text-lg`}>
          {title.includes("💰") || title.includes("Affaires") ? "💰" :
           title.includes("📈") || title.includes("Bénéfice") ? "📈" :
           title.includes("🚨") || title.includes("Rupture") ? "🚨" :
           title.includes("💵") || title.includes("USD") ? "💵" :
           title.includes("CDF") ? "💵" : "📊"}
        </div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title.replace(/[💰📈🚨💵📊]/g, "").trim()}
        </h3>
      </div>

      {/* Valeur principale + Sparkline */}
      <div className="flex items-end justify-between">
        <div>
          <p className={`text-3xl font-extrabold ${valueColor} leading-tight`}>
            {value}
          </p>
          {secondary && (
            <p className="text-sm font-medium text-gray-600 mt-1">
              {secondary}
            </p>
          )}
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <div className="ml-2">
            <Sparkline data={sparklineData} color={sparklineColor} />
          </div>
        )}
      </div>

      {/* Progression */}
      {progression !== undefined && (
        <div className={`inline-flex items-center gap-1 mt-3 px-2 py-1 rounded-full text-xs font-semibold ${progressionColor}`}>
          <span>{progression >= 0 ? "↑" : "↓"}</span>
          <span>{Math.abs(progression).toFixed(1)}%</span>
          <span className="font-normal text-gray-500 ml-1">vs J-1</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(DashboardKpi);