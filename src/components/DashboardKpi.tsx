"use client";

import React from "react";
import Sparkline from "@/components/Sparkline";

interface DashboardKpiProps {
  title: string;
  value: string | number;
  secondary?: string;
  valueColor: string;
  sparklineData?: number[];
  sparklineColor?: string;
}

const DashboardKpi: React.FC<DashboardKpiProps> = ({
  title,
  value,
  secondary,
  valueColor,
  sparklineData,
  sparklineColor = "#3B82F6",
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-200 flex items-center justify-between">
      <div className="flex-1">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
          {title}
        </h3>
        <p className={`text-3xl font-extrabold ${valueColor} leading-tight`}>
          {value}
        </p>
        {secondary && (
          <p className="text-sm font-medium text-gray-700 mt-1">
            {secondary}
          </p>
        )}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
            Aujourd'hui
          </p>
        </div>
      </div>

      {/* Mini graphique sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="ml-3">
          <Sparkline data={sparklineData} color={sparklineColor} />
        </div>
      )}
    </div>
  );
};

export default React.memo(DashboardKpi);