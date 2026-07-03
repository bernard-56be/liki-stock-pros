'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building, Check, ArrowRight, Sparkles } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  label: string;
  max_owners: number;
  max_employees: number;
  price: number;
  features: string[];
  popular?: boolean;
}

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
    features: ['2 Propriétaires', '4 Employés', 'Rapports PDF', 'Support prioritaire'],
    popular: true,
  },
  {
    id: 'GOLD',
    name: 'Gold',
    label: 'PME',
    max_owners: 2,
    max_employees: 10,
    price: 30000,
    features: ['2 Propriétaires', '10 Employés', 'Multi-boutiques', 'Support prioritaire', 'Rapports PDF'],
  },
];

export default function UpgradeSubscription() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<string>('BRONZE');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCounts, setCurrentCounts] = useState({ owners: 0, employees: 0 });
  const supabase = createClient();

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Utilisateur non authentifié');
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('boutique_id')
          .eq('id', user.id)
          .single();

        if (!profile?.boutique_id) {
          setError('Aucune boutique associée à votre compte');
          setLoading(false);
          return;
        }

        const { data: shop } = await supabase
          .from('boutiques')
          .select('subscription, max_owners, max_employees')
          .eq('id', profile.boutique_id)
          .single();

        // Si la boutique existe mais n'a pas les colonnes, on utilise les valeurs par défaut
        setCurrentPlan(shop?.subscription || 'BRONZE');

        // Compter les propriétaires et employés
        const { count: ownersCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('boutique_id', profile.boutique_id)
          .in('role', ['owner', 'associe'])
          .eq('status', 'active');

        const { count: employeesCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('boutique_id', profile.boutique_id)
          .eq('role', 'employee')
          .eq('status', 'active');

        setCurrentCounts({
          owners: ownersCount || 0,
          employees: employeesCount || 0,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement des offres');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentPlan();
  }, []);

  const handleUpgrade = (planId: string) => {
    router.push('/dashboard/settings?tab=subscription');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-purple-500 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Chargement des offres...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête de la section */}
      <div className="flex items-center gap-2 text-gray-600 text-sm">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <span>Choisissez l'offre qui correspond à vos besoins</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;

          return (
            <Card 
              key={plan.id} 
              className={`relative transition-all duration-200 hover:shadow-lg ${
                plan.popular ? 'border-purple-500 shadow-md' : ''
              } ${
                isCurrent ? 'border-green-500 bg-green-50/20' : ''
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-purple-700 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-sm">
                  Populaire
                </span>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {isCurrent && (
                    <Badge className="bg-green-500 text-white border-0">
                      <Check className="h-3 w-3 mr-1" /> Actif
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">{plan.label}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold text-gray-800">
                  {plan.price === 0 ? (
                    'Gratuit'
                  ) : (
                    `${plan.price.toLocaleString()} FC`
                  )}
                  {plan.price > 0 && (
                    <span className="text-sm font-normal text-gray-400">/mois</span>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-gray-400" /> Propriétaires
                    </span>
                    <span className="font-medium text-gray-700">
                      {isCurrent ? currentCounts.owners : 0} / {plan.max_owners}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Building className="h-3.5 w-3.5 text-gray-400" /> Employés
                    </span>
                    <span className="font-medium text-gray-700">
                      {isCurrent ? currentCounts.employees : 0} / {plan.max_employees}
                    </span>
                  </div>
                </div>

                <ul className="space-y-1.5 text-sm">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-600">
                      <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent}
                  className={`w-full transition-all ${
                    isCurrent 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : plan.popular 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {isCurrent ? (
                    '✅ Plan actuel'
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