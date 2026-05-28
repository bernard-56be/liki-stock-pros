'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type DisplayCurrency = 'USD' | 'CDF';

type CurrencyDisplayContextType = {
  currency: DisplayCurrency;
  setCurrency: (currency: DisplayCurrency) => void;
};

const CurrencyDisplayContext = createContext<CurrencyDisplayContextType | undefined>(undefined);

export const useCurrencyDisplay = () => {
  const context = useContext(CurrencyDisplayContext);
  if (!context) throw new Error('useCurrencyDisplay must be used within CurrencyDisplayProvider');
  return context;
};

export const CurrencyDisplayProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<DisplayCurrency>('USD');
  return (
    <CurrencyDisplayContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyDisplayContext.Provider>
  );
};