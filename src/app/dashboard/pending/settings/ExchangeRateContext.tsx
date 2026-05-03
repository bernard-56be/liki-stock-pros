'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

type ExchangeRateContextType = {
  rate: number | null;
  setRate: (rate: number) => Promise<void>;
  loading: boolean;
};

const ExchangeRateContext = createContext<ExchangeRateContextType | undefined>(undefined);

export const useExchangeRate = () => {
  const context = useContext(ExchangeRateContext);
  if (!context) throw new Error('useExchangeRate must be used within ExchangeRateProvider');
  return context;
};

export const ExchangeRateProvider = ({ children }: { children: ReactNode }) => {
  const [rate, setRateState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient(); //  déplacé à l'intérieur du composant

  useEffect(() => {
    const fetchRate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('shop_id')
        .eq('id', user.id)
        .single();

      if (profile?.shop_id) {
        const { data: shop } = await supabase
          .from('shops')
          .select('exchange_rate')
          .eq('id', profile.shop_id)
          .single();
        if (shop?.exchange_rate) setRateState(shop.exchange_rate);
      }
      setLoading(false);
    };
    fetchRate();
  }, [supabase]); //  on a ajouté supabase dans les dépendances

  const setRate = async (newRate: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('shop_id')
      .eq('id', user.id)
      .single();

    if (profile?.shop_id) {
      await supabase
        .from('shops')
        .update({ exchange_rate: newRate })
        .eq('id', profile.shop_id);
      setRateState(newRate);
    }
  };

  return (
    <ExchangeRateContext.Provider value={{ rate, setRate, loading }}>
      {children}
    </ExchangeRateContext.Provider>
  );
};