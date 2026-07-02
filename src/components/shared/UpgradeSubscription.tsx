'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Users, Building, Sparkles, Check, ArrowRight } from 'lucide-react';

type Plan = {
  id: string;
  name: string;
  label: string;
  max_owners: number;
  max_employees: number;
  price: number;
  features: string[];
  popular?: boolean;
  comingSoon?: boolean;
};

const PLANS: Plan[] = [
  {
    id: 'BRONZE',
    name: 'Bronze',
    label: 'Essai Gratuit',
    max_owners: 1,
    max_employees: 1,
    price: 0,
    features: ['1 Propriétaire', '1 Employé', 'Gestion de stock', 'Tableau de bord'],
  },
  {
    id: 'SILVER',
    name: 'Silver',
    label: 'Partenaires / Associés',
    max_owners: 2,
    max_employees: 4,
    price: 15000,
    features: ['2 Propriétaires', '4 Employés', 'Tout Bronze', 'Rapports PDF', 'Support prioritaire'],
    popular: true,
  },
  {
    id: 'GOLD',
    name: 'Gold',
    label: 'PME',
    max_owners: 2,
    max_employees: 10,
    price: 30000,
    features: ['2 Propriétaires', '10 Employés', 'Tout Silver', 'Multi-boutiques', 'Support 24/7'],
  },
  {
    id: 'PME',
    name: 'PME',
    label: 'Multi-boutiques',
    max_owners: 5,
    max_employees: 50,
    price: 50000,
    features: ['5 Propriétaires', '50 Employés', 'Gestion multi-boutiques', 'API personnalisée'],
    comingSoon: true,
  },
];

export default function UpgradeSubscription() {
  const [currentPlan, setCurrentPlan] = useState<string>('BRONZE');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
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
        .select('subscription')
        .eq('id', profile.boutique_id)
        .single();

      setCurrentPlan(shop?.subscription || 'BRONZE');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === 'PME') {
      setError('Offre Multi-boutiques bientôt disponible');
      return;
    }

    setUpgrading(planId);
    setError(null);
    setSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: profile } = await supabase
        .from('profiles')
        .select('boutique_id')
        .eq('id', user.id)
        .single();

      if (!profile?.boutique_id) throw new Error('Aucune boutique associée');

      // Mettre à jour la boutique
      const { error: updateError } = await supabase
        .from('boutiques')
        .update({ 
          subscription: planId,
          // Ajouter les colonnes si elles existent
          // max_owners: PLANS.find(p => p.id === planId)?.max_owners,
          // max_employees: PLANS.find(p => p.id === planId)?.max_employees,
        })
        .eq('id', profile.boutique_id);

      if (updateError) throw updateError;

      setCurrentPlan(planId);
      setSuccess(`Passage à l'offre ${planId} effectué avec succès !`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upgrade');
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Chargement des offres...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-300 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isUpgrading = upgrading === plan.id;

          return (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''} ${isCurrent ? 'border-green-500' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Populaire
                </span>
              )}
              {plan.comingSoon && (
                <Badge className="absolute -top-2 -right-2 bg-gray-500 text-white">
                  Bientôt
                </Badge>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {isCurrent && (
                    <Badge className="bg-green-500 text-white">
                      <Check className="h-3 w-3 mr-1" /> Actif
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">{plan.label}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">
                  {plan.price === 0 ? (
                    'Gratuit'
                  ) : (
                    `${plan.price.toLocaleString()} FC`
                  )}
                  {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/mois</span>}
                </div>

                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{plan.max_owners} Propriétaire{plan.max_owners > 1 ? 's' : ''}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span>{plan.max_employees} Employé{plan.max_employees > 1 ? 's' : ''}</span>
                  </li>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-gray-600">
                      <Check className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || isUpgrading || plan.comingSoon}
                  className={`w-full ${plan.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isCurrent ? (
                    'Actuel'
                  ) : isUpgrading ? (
                    'Chargement...'
                  ) : plan.comingSoon ? (
                    'Bientôt disponible'
                  ) : (
                    <>
                      Passer à {plan.name} <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}