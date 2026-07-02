'use client';

import { useState } from 'react';
import { simulateMobileMoneyPayment } from '@/lib/actions/subscriptionActions';
import { toast } from 'sonner';

const plans = [
  { id: 'Essai', name: 'Essai', duration: '14 jours', price: 'Gratuit', active: true },
  { id: 'Associés', name: 'Associés', duration: 'Mensuel', price: '15$', active: true },
  { id: 'PME', name: 'PME', duration: 'Mensuel', price: '40$', active: true },
  { id: 'Multi-boutique', name: 'Multi-boutique', duration: 'À venir', price: '---', active: false }
];

export default function PricingPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [operator, setOperator] = useState('M-Pesa');

  const handlePayment = async (plan: string) => {
    setIsProcessing(true);
    const toastId = toast.loading("Traitement Mobile Money (3s)...");
    const result = await simulateMobileMoneyPayment(plan);
    setIsProcessing(false);
    toast.dismiss(toastId);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Choisir votre abonnement</h1>

      {/* Sélecteur d'opérateur avec label accessible */}
      <div className="mb-6">
        <label htmlFor="operator-select" className="block mb-2 font-medium text-gray-700">
          Choisir votre opérateur Mobile Money :
        </label>
        <select
          id="operator-select"
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
          className="border border-gray-300 p-2 rounded-lg w-full md:w-auto focus:ring-2 focus:ring-blue-500 focus:outline-none"
          aria-label="Choisir votre opérateur Mobile Money"
        >
          <option value="M-Pesa">M-Pesa</option>
          <option value="Airtel">Airtel</option>
          <option value="Orange">Orange</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="border p-4 rounded shadow hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-lg">{plan.name}</h3>
            <p className="text-gray-600">{plan.duration}</p>
            <p className="text-xl font-semibold text-blue-600 my-2">{plan.price}</p>
            <button
              disabled={isProcessing || !plan.active}
              onClick={() => handlePayment(plan.id)}
              className={`w-full mt-4 p-2 rounded text-white transition-colors ${
                plan.active
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {plan.active ? 'Payer' : 'Bientôt disponible'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}