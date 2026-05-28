'use client';

import { useCurrencyDisplay } from '@/contexts/currencyDisplayContext';
import { useExchangeRate } from '@/contexts/exchangeRateContext';

interface FormattedPriceProps {
  usd: number;        // prix en USD (stocké en base)
  className?: string;
}

export const FormattedPrice = ({ usd, className = '' }: FormattedPriceProps) => {
  const { currency } = useCurrencyDisplay();
  const { rate } = useExchangeRate();

  if (currency === 'USD') {
    return <span className={className}>{usd.toLocaleString()} USD</span>;
  } else {
    const cdf = rate ? usd * rate : 0;
    return <span className={className}>{Math.round(cdf).toLocaleString()} FC</span>;
  }
};