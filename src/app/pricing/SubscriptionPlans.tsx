'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    id: 'BRONZE',
    name: 'Bronze',
    label: 'Essai Gratuit',
    duration: '14 jours',
    price: 'Gratuit',
    active: true,
    features: ['1 Propriétaire', '1 Employé', 'Gestion de stock', 'Tableau de bord'],
    popular: false,
    icon: '🥉'
  },
  {
    id: 'SILVER',
    name: 'Silver',
    label: 'Partenaires / Associés',
    duration: 'Mensuel',
    price: '15 000 FC',
    active: true,
    features: ['2 Propriétaires', '4 Employés', 'Rapports PDF', 'Support prioritaire'],
    popular: true,
    icon: '🥈'
  },
  {
    id: 'GOLD',
    name: 'Gold',
    label: 'PME',
    duration: 'Mensuel',
    price: '30 000 FC',
    active: true,
    features: ['2 Propriétaires', '10 Employés', 'Multi-boutiques', 'Support 24/7'],
    popular: false,
    icon: '🥇'
  },
];

export default function SubscriptionPlans() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPlan = (planId: string) => {
    setIsProcessing(true);
    const toastId = toast.loading('Traitement en cours...');

    // Simulation de traitement
    setTimeout(() => {
      setIsProcessing(false);
      toast.dismiss(toastId);
      toast.success(`Offre ${planId} sélectionnée avec succès !`);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-50 rounded-xl">
          <Sparkles className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nos offres</h2>
          <p className="text-sm text-gray-500">
            Choisissez l'offre qui correspond à vos besoins
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative border transition-all duration-200 hover:shadow-lg ${
              plan.popular ? 'border-purple-500 shadow-md bg-purple-50/20' : 'border-gray-200'
            } ${!plan.active ? 'opacity-60 bg-gray-50' : ''}`}
          >
            {plan.popular && (
              <span className="absolute -top-2 -right-2 bg-purple-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                Populaire
              </span>
            )}

            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{plan.icon}</span>
                <div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <Badge variant="outline" className="mt-1 text-xs font-normal text-gray-500 border-gray-300">
                    {plan.label}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-purple-700">{plan.price}</p>
                <p className="text-xs text-gray-400">{plan.duration}</p>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isProcessing || !plan.active}
                className={`w-full transition-colors ${
                  plan.active
                    ? plan.popular
                      ? 'bg-purple-700 hover:bg-purple-800 text-white'
                      : 'bg-gray-700 hover:bg-gray-800 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {plan.active ? 'Choisir cette offre' : 'Bientôt disponible'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}