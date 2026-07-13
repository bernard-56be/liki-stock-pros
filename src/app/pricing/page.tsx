'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { simulateMobileMoneyPayment } from '@/lib/actions/subscriptionActions';
import { toast } from 'sonner';
import { Sparkles, Check, ArrowLeft, Clock } from 'lucide-react';
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
    price: 'Gratuit',
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
    price: '???USD',
    active: false,
    features: ['2 Propriétaires', '10 Employés', 'Multi-boutiques', 'Support 24/7'],
    popular: false,
    icon: '🥇'
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [operator, setOperator] = useState('M-Pesa');

  const handlePayment = async (plan: string) => {
    setIsProcessing(true);
    const toastId = toast.loading('Traitement Mobile Money (3s)...');

    const result = await simulateMobileMoneyPayment(plan);

    setIsProcessing(false);
    toast.dismiss(toastId);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Bouton retour - style violet application */}
        <Button
          variant="outline"
          onClick={handleGoBack}
          className="mb-6 flex items-center gap-2 text-purple-700 border-purple-300 hover:bg-purple-700 hover:text-white hover:border-purple-700 transition-all duration-200 rounded-lg px-4 py-2.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Retour</span>
        </Button>

        {/* En-tête */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-xl">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Choisir votre offre</h1>
            <p className="text-sm text-gray-500">
              Découvrez nos offres et passez à l'étape supérieure
            </p>
          </div>
        </div>

        {/* Sélecteur d'opérateur - style violet */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm hover:shadow-md transition-shadow">
          <label htmlFor="operator-select" className="block mb-2 font-medium text-gray-700 text-sm">
            Choisir votre opérateur Mobile Money :
          </label>
          <select
            id="operator-select"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="border border-gray-300 p-2.5 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-gray-700 cursor-pointer hover:border-purple-400 transition-colors bg-white"
            aria-label="Choisir votre opérateur Mobile Money"
            style={{ accentColor: '#7C3AED' }}
          >
            <option value="M-Pesa">M-Pesa</option>
            <option value="Airtel">Airtel</option>
            <option value="Orange">Orange</option>
          </select>
        </div>

        {/* Cartes des offres */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                plan.popular ? 'border-purple-500 shadow-md bg-purple-50/20' : 'border-gray-200'
              } ${!plan.active ? 'opacity-75' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-2 -right-2 bg-purple-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  Populaire
                </span>
              )}
              {!plan.active && (
                <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Bientôt
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
                  onClick={() => handlePayment(plan.id)}
                  disabled={isProcessing || !plan.active}
                  className={`w-full transition-all duration-200 ${
                    plan.active
                      ? plan.popular
                        ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-sm hover:shadow-md'
                        : 'bg-gray-700 hover:bg-gray-800 text-white'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200'
                  }`}
                >
                  {plan.active ? 'Payer' : 'Bientôt disponible'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}