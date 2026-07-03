'use client';

import { useState, useTransition } from 'react';
import { User, Lock, Store, AlertTriangle, CheckCircle2, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { updateProfileInfo, updatePassword } from '@/lib/actions/profile';

type Role = 'owner' | 'employee';
type Tab = 'info' | 'password' | 'boutique';

interface SettingsClientProps {
  role: Role;
  initialName: string;
  initialBoutique?: string;
  shopCode?: string | null; 
  initialRate: number;
  initialCurrency: 'USD' | 'CDF';
}

export default function SettingsClient({
  role,
  initialName,
  initialBoutique,
  shopCode, 
  initialRate,
  initialCurrency,
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
    ...(role === 'owner' ? [{ id: 'boutique' as Tab, label: 'Configuration Boutique', icon: Store }] : []),
    { id: 'password' as Tab, label: 'Sécurité & Mot de passe', icon: Lock },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl bg-gray-50 p-6 px-6 py-8 rounded-lg shadow-sm">
      {/* En-tête de la page */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres généraux</h1>
        <p className="text-sm text-gray-500">Gérez vos informations personnelles et vos accès.</p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        {/* Navigation latérale interne gauche */}
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

        {/* Zone de contenu principale (Formulaires) */}
        <div className="flex-1">
          <Card className="border border-gray-100 bg-white/90 shadow-sm backdrop-blur-sm">
            <CardHeader className="flex flex-col gap-2 border-b border-gray-100/50 md:flex-row md:items-center md:justify-between">
              <CardTitle>
                {activeTab === 'info' && 'Profil Utilisateur'}
                {activeTab === 'boutique' && 'Paramètres de la Boutique'}
                {activeTab === 'password' && 'Changer le mot de passe'}
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                {activeTab === 'info' && 'Mettez à jour vos informations de base enregistrées.'}
                {activeTab === 'boutique' &&
                  'Gérez les détails commerciaux et administratifs de votre établissement.'}
                {activeTab === 'password' &&
                  'Assurez-vous d’utiliser un mot de passe robuste pour protéger votre accès.'}
              </p>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              {/* Alertes de retour d'expérience utilisateur */}
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

              {/* Onglet : Informations personnelles */}
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

              {/* Onglet : Configuration Boutique (Owner uniquement) */}
              {activeTab === 'boutique' && role === 'owner' && (
                <form onSubmit={handleSubmit(updateProfileInfo)} className="space-y-6">
                  <input type="hidden" name="fullName" value={initialName} />

                  {/* Section : Informations Générales */}
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

                  {/* Section : Devises & Taux de Change */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Coins className="h-4 w-4 text-purple-600" />
                      <span>Gestion des Taux</span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Taux de Change */}
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

              {/* Onglet : Sécurité & Mot de passe */}
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