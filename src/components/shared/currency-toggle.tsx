'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const CurrencyToggle = () => {
  const [rate, setRate] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [tempRate, setTempRate] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, shop_id')
        .eq('id', user.id)
        .single();
      setIsOwner(profile?.role === 'owner');

      if (profile?.shop_id) {
        const { data: shop } = await supabase
          .from('shops')
          .select('exchange_rate')
          .eq('id', profile.shop_id)
          .single();
        if (shop?.exchange_rate) setRate(shop.exchange_rate);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    const newRate = parseFloat(tempRate);
    if (isNaN(newRate) || newRate <= 0) return;

    const supabase = createClient();
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
      setRate(newRate);
      setEditing(false);
    }
  };

  if (!rate) return null;

  return (
    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border">
      <span className="text-sm font-medium text-gray-600">Taux du jour :</span>
      {editing ? (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={tempRate}
            onChange={(e) => setTempRate(e.target.value)}
            className="w-28"
            placeholder="2850"
          />
          <Button size="sm" onClick={handleSave}>OK</Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Annuler</Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="font-bold text-blue-600">1 USD = {rate} CDF</span>
          {isOwner && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setTempRate(rate.toString());
                setEditing(true);
              }}
            >
              Modifier
            </Button>
          )}
        </div>
      )}
    </div>
  );
};