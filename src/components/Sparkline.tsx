"use client";

import React from "react";

interface SparklineProps {
  data: number[];
  color: string;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color }) => {
  if (!data || data.length === 0) return null;

  const width = 80;
  const height = 30;
  const padding = 2;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / (max - min)) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Point final */}
      {data.length > 0 && (
        <circle
          cx={points.split(" ")[data.length - 1]?.split(",")[0]}
          cy={points.split(" ")[data.length - 1]?.split(",")[1]}
          r="2.5"
          fill={color}
        />
      )}
    </svg>
  );
};

export default React.memo(Sparkline);