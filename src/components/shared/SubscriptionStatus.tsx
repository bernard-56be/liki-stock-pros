'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, AlertCircle, CheckCircle, Users, Sparkles } from 'lucide-react';

type SubscriptionInfo = {
  plan: string;
  max_owners: number;
  max_employees: number;
  current_owners: number;
  current_employees: number;
  shop_name: string;
};

const planLabels: Record<string, { label: string; color: string; icon: string; description: string }> = {
  BRONZE: {
    label: 'Bronze - Essai Gratuit',
    color: 'bg-amber-500',
    icon: '🥉',
    description: 'Forfait de base pour démarrer votre activité'
  },
  SILVER: {
    label: 'Partenaires / Associés',
    color: 'bg-blue-500',
    icon: '🥈',
    description: 'Idéal pour les structures à deux associés'
  },
  GOLD: {
    label: 'PME',
    color: 'bg-purple-500',
    icon: '🥇',
    description: 'Pour les entreprises en pleine croissance'
  },
};

const planFeatures: Record<string, { included: string[]; notIncluded: string[] }> = {
  BRONZE: {
    included: ['1 Propriétaire', '1 Employé', 'Gestion de stock', 'Tableau de bord'],
    notIncluded: ['Rapports PDF', 'Support prioritaire', 'Multi-boutiques']
  },
  SILVER: {
    included: ['2 Propriétaires', '4 Employés', 'Rapports PDF', 'Support prioritaire'],
    notIncluded: ['Multi-boutiques']
  },
  GOLD: {
    included: ['2 Propriétaires', '10 Employés', 'Multi-boutiques', 'Support prioritaire', 'Rapports PDF'],
    notIncluded: []
  },
};

export default function SubscriptionStatus() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Non authentifié');

        const { data: profile } = await supabase
          .from('profiles')
          .select('boutique_id')
          .eq('id', user.id)
          .single();

        if (!profile?.boutique_id) throw new Error('Aucune boutique associée');

        const { data: shop } = await supabase
          .from('boutiques')
          .select('id, name, subscription, max_owners, max_employees')
          .eq('id', profile.boutique_id)
          .single();

        if (!shop) throw new Error('Boutique non trouvée');

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
    };

    fetchSubscription();
  }, []);

  const handleViewOffers = () => {
    router.push('/dashboard/settings?tab=subscription');
  };

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
  const features = planFeatures[subscription.plan] || planFeatures.BRONZE;
  const ownerPercentage = (subscription.current_owners / subscription.max_owners) * 100;
  const employeePercentage = (subscription.current_employees / subscription.max_employees) * 100;

  return (
    <div className="space-y-5">
      {/* En-tête avec icône et badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{planInfo.icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Forfait {subscription.plan}
            </h3>
            <Badge className={`${planInfo.color} text-white border-0`}>
              {planInfo.label}
            </Badge>
          </div>
        </div>
        <Button
          onClick={handleViewOffers}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          size="sm"
        >
          <Sparkles className="h-4 w-4" />
          Voir les offres
        </Button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">
        {planInfo.description}
      </p>

      {/* Limites */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 flex items-center gap-1">
              <Users className="h-4 w-4" /> Propriétaires / Associés
            </span>
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
            <span className="text-gray-600 flex items-center gap-1">
              <Building className="h-4 w-4" /> Employés
            </span>
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
      </div>

      {/* Avantages et Inconvénients */}
      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Avantages */}
          <div>
            <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Avantages inclus
            </p>
            <ul className="space-y-1">
              {features.included.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Inconvénients */}
          {features.notIncluded.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> Non inclus
              </p>
              <ul className="space-y-1">
                {features.notIncluded.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-500">
                    <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Alertes */}
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
  );
}