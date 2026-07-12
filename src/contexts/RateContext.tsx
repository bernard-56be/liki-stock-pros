'use client';
import { createContext, useContext, ReactNode } from 'react';

const RateContext = createContext<number>(2200); // Valeur par défaut

export const RateProvider = ({ children, rate }: { children: ReactNode; rate: number }) => (
  <RateContext.Provider value={rate}>
    {children}
  </RateContext.Provider>
);

export const useRate = () => useContext(RateContext);