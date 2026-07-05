'use client';

import { useState, useTransition } from 'react';
import { User, Lock, Store, AlertTriangle, CheckCircle2, Coins, CreditCard, Users, Building, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { updateProfileInfo, updatePassword } from '@/lib/actions/profile';
import Link from 'next/link';

type Role = 'owner' | 'employee';
type Tab = 'info' | 'password' | 'boutique' | 'subscription';

interface SettingsClientProps {
  role: Role;
  initialName: string;
  initialBoutique?: string;
  shopCode?: string | null; 
  initialRate: number;
  initialCurrency: 'USD' | 'CDF';
  subscriptionInfo?: {
    plan: string;
    max_owners: number;
    max_employees: number;
    current_owners: number;
    current_employees: number;
    shop_name: string;
  };
}

export default function SettingsClient({
  role,
  initialName,
  initialBoutique,
  shopCode, 
  initialRate,
  initialCurrency,
  subscriptionInfo,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit =
    (action: (data: FormData) => Promise<{ success: boolean; message: string }>) =>
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setMessage(null);
      const formData = new FormData(e.currentTarget);

      startTransition(async () => {
        const result = await action(formData);
        setMessage({ type: result.success ? 'success' : 'error', text: result.message });
      });
    };

  const menuItems = [
    { id: 'info' as Tab, label: 'Informations personnelles', icon: User },
    ...(role === 'owner' ? [{ id: 'subscription' as Tab, label: 'Mon Abonnement', icon: CreditCard }] : []),
    ...(role === 'owner' ? [{ id: 'boutique' as Tab, label: 'Configuration Boutique', icon: Store }] : []),
    { id: 'password' as Tab, label: 'Sécurité & Mot de passe', icon: Lock },
  ];

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

  // ✅ PLAN FEATURES CORRIGÉES
  const planFeatures: Record<string, { included: string[]; notIncluded: string[] }> = {
    BRONZE: {
      included: ['1 Propriétaire', '1 Employé', 'Gestion de stock', 'Tableau de bord', 'Rapports PDF'],
      notIncluded: ['Support prioritaire', 'Multi-boutiques', 'Plus de 1 employé']
    },
    SILVER: {
      included: ['2 Propriétaires', '4 Employés', 'Rapports PDF', 'Support prioritaire'],
      notIncluded: ['Multi-boutiques']
    },
    GOLD: {
      included: ['2 Propriétaires', '10 Employés', 'Multi-boutiques', 'Support 24/7', 'Rapports PDF'],
      notIncluded: []
    },
  };

  const subInfo = subscriptionInfo || {
    plan: 'BRONZE',
    max_owners: 1,
    max_employees: 1,
    current_owners: 0,
    current_employees: 0,
    shop_name: initialBoutique || 'Ma boutique',
  };

  const currentPlanLabel = planLabels[subInfo.plan] || planLabels.BRONZE;
  const currentFeatures = planFeatures[subInfo.plan] || planFeatures.BRONZE;
  const ownerPercentage = (subInfo.current_owners / subInfo.max_owners) * 100;
  const employeePercentage = (subInfo.current_employees / subInfo.max_employees) * 100;

  return (
    <section className="mx-auto w-full max-w-6xl bg-gray-50 p-6 px-6 py-8 rounded-lg shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres généraux</h1>
        <p className="text-sm text-gray-500">Gérez vos informations personnelles et vos accès.</p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        <aside className="w-full shrink-0 md:w-56">
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as Tab);
                    setMessage(null);
                  }}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-white-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1">
          <Card className="border border-gray-100 bg-white/90 shadow-sm backdrop-blur-sm">
            <CardHeader className="flex flex-col gap-2 border-b border-gray-100/50 md:flex-row md:items-center md:justify-between">
              <CardTitle>
                {activeTab === 'info' && 'Profil Utilisateur'}
                {activeTab === 'subscription' && 'Mon Abonnement'}
                {activeTab === 'boutique' && 'Paramètres de la Boutique'}
                {activeTab === 'password' && 'Changer le mot de passe'}
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                {activeTab === 'info' && 'Mettez à jour vos informations de base enregistrées.'}
                {activeTab === 'subscription' && 'Consultez votre forfait actuel et découvrez les offres disponibles.'}
                {activeTab === 'boutique' &&
                  'Gérez les détails commerciaux et administratifs de votre établissement.'}
                {activeTab === 'password' &&
                  'Assurez-vous d’utiliser un mot de passe robuste pour protéger votre accès.'}
              </p>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              {message && (
                <div
                  className={`mb-6 flex items-center gap-2 rounded-lg border p-3 text-sm ${
                    message.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-green-200 bg-green-50 text-green-700'
                  }`}
                >
                  {message.type === 'error' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              {/* ==================== ONGLET INFO ==================== */}
              {activeTab === 'info' && (
                <form onSubmit={handleSubmit(updateProfileInfo)} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      defaultValue={initialName}
                      required
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {isPending ? 'Enregistrement...' : 'Sauvegarder les modifications'}
                    </Button>
                  </div>
                </form>
              )}

              {/* ==================== ONGLET MON ABONNEMENT ==================== */}
              {activeTab === 'subscription' && role === 'owner' && (
                <div className="space-y-6">
                  {/* En-tête du plan */}
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{currentPlanLabel.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Forfait {subInfo.plan}
                      </h3>
                      <Badge className={`${currentPlanLabel.color} text-white border-0`}>
                        {currentPlanLabel.label}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">
                    {currentPlanLabel.description}
                  </p>

                  <p className="text-sm text-gray-500">
                    Boutique : <span className="font-medium text-gray-700">{subInfo.shop_name}</span>
                  </p>

                  {/* Limites */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Users className="h-4 w-4" /> Propriétaires / Associés
                        </span>
                        <span className="font-medium text-gray-800">
                          {subInfo.current_owners} / {subInfo.max_owners === Infinity ? '∞' : subInfo.max_owners}
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
                          {subInfo.current_employees} / {subInfo.max_employees === Infinity ? '∞' : subInfo.max_employees}
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

                  {/* Avantages / Inconvénients corrigés */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                          ✅ Avantages inclus
                        </p>
                        <ul className="space-y-1">
                          {currentFeatures.included.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="text-green-500">✓</span> {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {currentFeatures.notIncluded.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                            ❌ Non inclus
                          </p>
                          <ul className="space-y-1">
                            {currentFeatures.notIncluded.map((feature, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm text-gray-500">
                                <span className="text-red-400">✗</span> {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alertes */}
                  {subInfo.current_employees >= subInfo.max_employees && subInfo.max_employees !== Infinity && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span>Limite d'employés atteinte. Passez à l'offre supérieure.</span>
                    </div>
                  )}

                  {subInfo.current_owners >= subInfo.max_owners && subInfo.max_owners !== Infinity && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span>Limite de propriétaires atteinte. Passez à l'offre supérieure.</span>
                    </div>
                  )}

                  {/* Bouton Voir les offres */}
                  <div className="pt-2 border-t border-gray-200">
                    <Link 
                      href="/pricing" 
                      className="w-full bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-semibold shadow-sm"
                    >
                      <CreditCard className="h-4 w-4" />
                      Voir les offres disponibles
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}

              {/* ==================== ONGLET BOUTIQUE ==================== */}
              {activeTab === 'boutique' && role === 'owner' && (
                <form onSubmit={handleSubmit(updateProfileInfo)} className="space-y-6">
                  <input type="hidden" name="fullName" value={initialName} />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="boutiqueName" className="text-sm font-medium text-gray-700">
                        Nom de la boutique
                      </label>
                      <input
                        type="text"
                        id="boutiqueName"
                        name="boutiqueName"
                        defaultValue={initialBoutique}
                        required
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    {shopCode && (
                      <div className="rounded-md bg-gray-50 p-3 text-sm">
                        <span className="font-medium text-gray-700">Code boutique :</span>
                        <span className="ml-2 font-mono text-gray-900">{shopCode}</span>
                      </div>
                    )}
                  </div>

                  <hr className="border-gray-100" />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Coins className="h-4 w-4 text-purple-600" />
                      <span>Gestion des Taux</span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="exchangeRate" className="text-sm font-medium text-gray-700">
                          Taux de la boutique (1 USD = x CDF)
                        </label>
                        <div className="relative rounded-md shadow-sm">
                          <input
                            type="number"
                            step="0.01"
                            id="exchangeRate"
                            name="exchangeRate"
                            defaultValue={initialRate}
                            placeholder="ex: 2850.00"
                            required
                            className="w-full rounded-md border border-gray-200 bg-white pl-3 pr-12 py-2 text-sm text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-400 text-xs font-semibold">FC</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {isPending ? 'Enregistrement...' : 'Mettre à jour la boutique'}
                    </Button>
                  </div>
                </form>
              )}

              {/* ==================== ONGLET SECURITE ==================== */}
              {activeTab === 'password' && (
                <form onSubmit={handleSubmit(updatePassword)} className="space-y-5 max-w-md">
                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-sm font-medium text-gray-600">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      required
                      minLength={6}
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      required
                      minLength={6}
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {isPending ? 'Mise à jour...' : 'Modifier le mot de passe'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}