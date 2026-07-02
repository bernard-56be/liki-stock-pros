'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Building, AlertCircle, CheckCircle } from 'lucide-react';

type SubscriptionInfo = {
  plan: string;
  max_owners: number;
  max_employees: number;
  current_owners: number;
  current_employees: number;
  shop_name: string;
};

const planLabels: Record<string, { label: string; color: string }> = {
  BRONZE: { label: 'Bronze - Essai Gratuit', color: 'bg-amber-500' },
  SILVER: { label: 'Partenaires / Associés', color: 'bg-blue-500' },
  GOLD: { label: 'PME', color: 'bg-purple-500' },
  PME: { label: 'Multi-boutiques', color: 'bg-indigo-500' },
};

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchSubscription = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Non authentifié');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('boutique_id')
        .eq('id', user.id)
        .single();

      if (!profile?.boutique_id) {
        setError('Aucune boutique associée');
        setLoading(false);
        return;
      }

      const { data: shop } = await supabase
        .from('boutiques')
        .select('id, name, subscription, max_owners, max_employees')
        .eq('id', profile.boutique_id)
        .single();

      if (!shop) {
        setError('Boutique non trouvée');
        setLoading(false);
        return;
      }

      const { count: ownersCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('boutique_id', shop.id)
        .in('role', ['owner', 'associe'])
        .eq('status', 'active');

      const { count: employeesCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('boutique_id', shop.id)
        .eq('role', 'employee')
        .eq('status', 'active');

      setSubscription({
        plan: shop.subscription || 'BRONZE',
        max_owners: shop.max_owners || 1,
        max_employees: shop.max_employees || 1,
        current_owners: ownersCount || 0,
        current_employees: employeesCount || 0,
        shop_name: shop.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <p className="text-gray-500">Chargement de l'abonnement...</p>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <p className="text-red-500">{error || 'Erreur de chargement'}</p>
      </div>
    );
  }

  const planInfo = planLabels[subscription.plan] || planLabels.BRONZE;
  const ownerPercentage = (subscription.current_owners / subscription.max_owners) * 100;
  const employeePercentage = (subscription.current_employees / subscription.max_employees) * 100;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
          <Building className="h-5 w-5 text-gray-600" />
          Mon Abonnement
        </h3>
        <Badge className={`${planInfo.color} text-white border-0`}>
          <CheckCircle className="h-3 w-3 mr-1" />
          {planInfo.label}
        </Badge>
      </div>

      <p className="text-sm text-gray-500 mb-4">{subscription.shop_name}</p>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Propriétaires / Associés</span>
            <span className="font-medium text-gray-800">
              {subscription.current_owners} / {subscription.max_owners === Infinity ? '∞' : subscription.max_owners}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(ownerPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Employés</span>
            <span className="font-medium text-gray-800">
              {subscription.current_employees} / {subscription.max_employees === Infinity ? '∞' : subscription.max_employees}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(employeePercentage, 100)}%` }}
            />
          </div>
        </div>

        {subscription.current_employees >= subscription.max_employees && subscription.max_employees !== Infinity && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Limite d'employés atteinte. Passez à l'offre supérieure.</span>
          </div>
        )}

        {subscription.current_owners >= subscription.max_owners && subscription.max_owners !== Infinity && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Limite de propriétaires atteinte. Passez à l'offre supérieure.</span>
          </div>
        )}
      </div>
    </div>
  );
}