'use client';

import { useCurrencyDisplay } from '@/contexts/currencyDisplayContext';

export const CurrencySelector = () => {
  const { currency, setCurrency } = useCurrencyDisplay();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as 'USD' | 'CDF')}
      className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <option value="USD">USD</option>
      <option value="CDF">CDF</option>
    </select>
  );
};