'use client';

import { DollarSign } from 'lucide-react';

interface RateBadgeProps {
  rate: number; // Le taux actuel récupéré depuis la base de données (ex: 2850)
}

export default function RateBadge({ rate }: RateBadgeProps) {
  // Formatage propre du taux (ex: 2 850)
  const formattedRate = new Intl.NumberFormat('fr-FR').format(rate);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-100 bg-purple-50/60 px-3 py-1 text-xs font-semibold text-purple-700 shadow-sm backdrop-blur-sm transition-all hover:bg-purple-50">
      {/* Petit indicateur visuel pulsant pour montrer que le taux est actif/en direct */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
      </span>
      
      <div className="flex items-center gap-0.5">
        <span>Taux :</span>
        <span className="font-bold text-purple-950">1 $</span>
        <span className="text-purple-400">=</span>
        <span className="font-bold text-purple-950">{formattedRate} FC</span>
      </div>
    </div>
  );
}