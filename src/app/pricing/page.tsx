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
  const [operator, setOperator] = useState('M-Pesa'); // Simulation choix opérateur

  const handlePayment = async (plan: string) => {
    setIsProcessing(true);
    
    // Le toast loading est déclenché avant l'appel
    const toastId = toast.loading("Traitement Mobile Money (3s)...");
    
    const result = await simulateMobileMoneyPayment(plan);
    
    setIsProcessing(false);
    
    // On ferme le toast de chargement et on affiche le résultat
    toast.dismiss(toastId);
    
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Choisir votre abonnement</h1>
      
      {/* Sélecteur d'opérateur */}
      <div className="mb-6">
        <label className="block mb-2">Choisir votre opérateur :</label>
        <select onChange={(e) => setOperator(e.target.value)} className="border p-2 rounded">
          <option>M-Pesa</option>
          <option>Airtel</option>
          <option>Orange</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="border p-4 rounded shadow">
            <h3 className="font-bold">{plan.name}</h3>
            <p>{plan.price}</p>
            <button 
              disabled={isProcessing || !plan.active}
              onClick={() => handlePayment(plan.id)}
              className="w-full bg-blue-600 text-white mt-4 p-2 rounded disabled:bg-gray-400"
            >
              {plan.active ? 'Payer' : 'Bientôt'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}