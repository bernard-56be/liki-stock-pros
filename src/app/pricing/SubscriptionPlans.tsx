// src/components/pricing/SubscriptionPlans.tsx

const plans = [
  { id: 'trial', name: 'Essai', duration: '14 jours', price: 'Gratuit', active: true },
  { id: 'associates', name: 'Associés', duration: 'Mensuel', price: '15$', active: true },
  { id: 'pme', name: 'PME', duration: 'Mensuel', price: '40$', active: true },
  { id: 'multi', name: 'Multi-boutique', duration: 'À venir', price: '---', active: false }
];

export default function SubscriptionPlans() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
      {plans.map((plan) => (
        <div key={plan.id} className={`border rounded-lg p-6 shadow-sm ${!plan.active ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
          <h3 className="text-xl font-bold">{plan.name}</h3>
          <p className="text-sm text-gray-500">{plan.duration}</p>
          <div className="text-2xl font-bold my-4">{plan.price}</div>
          <button 
            disabled={!plan.active}
            className="w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400"
          >
            {plan.active ? 'Choisir cette offre' : 'Bientôt disponible'}
          </button>
        </div>
      ))}
    </div>
  );
}