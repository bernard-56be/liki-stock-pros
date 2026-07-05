'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { simulateMobileMoneyPayment } from '@/lib/actions/subscriptionActions';
import { toast } from 'sonner';
import { Sparkles, Check, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SubscriptionPlans from '@/app/pricing/SubscriptionPlans';

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

export default function PricingPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [operator, setOperator] = useState('M-Pesa');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('boutique_id')
          .eq('id', user.id)
          .single();

        if (profile?.boutique_id) {
          const { data: shop } = await supabase
            .from('boutiques')
            .select('exchange_rate')
            .eq('id', profile.boutique_id)
            .single();

          if (shop?.exchange_rate) {
            setExchangeRate(shop.exchange_rate);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du taux:', error);
      }
    };

    fetchExchangeRate();
  }, []);

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
        {/* Bouton retour */}
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Retour</span>
        </button>

        {/* En-tête avec taux */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-3">
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
          {exchangeRate && (
            <div className="mt-2 md:mt-0 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
              💱 Taux actuel : <span className="font-semibold text-gray-800">1 USD = {exchangeRate.toLocaleString()} FC</span>
            </div>
          )}
        </div>

        {/* Sélecteur d'opérateur */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <label htmlFor="operator-select" className="block mb-2 font-medium text-gray-700 text-sm">
            Choisir votre opérateur Mobile Money :
          </label>
          <select
            id="operator-select"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="border border-gray-300 p-2 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-700"
            aria-label="Choisir votre opérateur Mobile Money"
          >
            <option value="M-Pesa">M-Pesa</option>
            <option value="Airtel">Airtel</option>
            <option value="Orange">Orange</option>
          </select>
        </div>

        {/* Cartes des offres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative border transition-all duration-200 hover:shadow-lg ${
                plan.popular ? 'border-purple-500 shadow-md bg-purple-50/20' : 'border-gray-200'
              }`}
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
                  onClick={() => handlePayment(plan.id)}
                  disabled={isProcessing || !plan.active}
                  className={`w-full transition-colors ${
                    plan.active
                      ? plan.popular
                        ? 'bg-purple-700 hover:bg-purple-800 text-white'
                        : 'bg-gray-700 hover:bg-gray-800 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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