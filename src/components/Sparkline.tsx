"use client";

import React from "react";

interface SparklineProps {
  data: number[];
  color: string;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color }) => {
  // Protection : données vides ou invalides
  if (!data || data.length === 0) return null;

  const validData = data.filter(d => typeof d === 'number' && !isNaN(d));
  if (validData.length === 0) return null;

  const width = 100;
  const height = 40;
  const padding = 2;
  const max = Math.max(...validData, 1);
  const min = Math.min(...validData, 0);

  const pointArray = validData.map((value, index) => {
    const x = padding + (index / (validData.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / (max - min || 1)) * (height - padding * 2);
    return { x, y };
  });

  const pathLine = pointArray.map((p) => `${p.x},${p.y}`).join(" ");
  const firstX = pointArray[0]?.x ?? 0;
  const lastX = pointArray[pointArray.length - 1]?.x ?? 0;
  const pathFill = `${firstX},${height} ${pathLine} ${lastX},${height}`;
  const lastPoint = pointArray[pointArray.length - 1];

  return (
    <svg width={width} height={height} className="shrink-0">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={pathFill} fill={`url(#grad-${color.replace("#", "")})`} />
      <polyline
        points={pathLine}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {lastPoint && !isNaN(lastPoint.x) && !isNaN(lastPoint.y) && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="3"
          fill="white"
          stroke={color}
          strokeWidth="2"
        />
      )}
    </svg>
  );
};

export default React.memo(Sparkline);