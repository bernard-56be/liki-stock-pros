import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClientLayout } from '@/app/dashboard/(shell)/DashboardClientLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, Store, CreditCard } from 'lucide-react';
import SettingsClient from './SettingsClient';
import SubscriptionStatus from '@/components/shared/SubscriptionStatus';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const role = user.user_metadata?.role || profile?.role || 'employee';
  const userName = profile?.full_name || 'Utilisateur';
  const avatar = profile?.avatar_url || null;
  const exchangeRate = profile?.exchange_rate ?? 2200.00;
  const defaultCurrency = profile?.default_currency ?? 'USD';

  let boutiqueName = '';
  let subscription = 'BRONZE';
  let max_owners = 1;
  let max_employees = 1;

  if (role === 'owner' && profile?.boutique_id) {
    const { data: boutique } = await supabase
      .from('boutiques')
      .select('name, subscription, max_owners, max_employees')
      .eq('id', profile.boutique_id)
      .single();

    boutiqueName = boutique?.name || '';
    subscription = boutique?.subscription || 'BRONZE';
    max_owners = boutique?.max_owners || 1;
    max_employees = boutique?.max_employees || 1;
  }

  const isOwner = role === 'owner';

  return (
    <DashboardClientLayout
      role={role}
      userName={userName}
      userAvatar={avatar}
      currentRate={exchangeRate}
    >
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">⚙️ Paramètres</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez votre compte et vos préférences
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            {/* 1. Informations personnelles (tous) */}
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>

            {/* 2. Mon Abonnement (propriétaire uniquement) */}
            {isOwner && (
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Abonnement</span>
              </TabsTrigger>
            )}

            {/* 3. Configuration boutique (propriétaire uniquement) */}
            {isOwner && (
              <TabsTrigger value="boutique" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Boutique</span>
              </TabsTrigger>
            )}

            {/* 4. Sécurité & mot de passe (tous) */}
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Sécurité</span>
            </TabsTrigger>
          </TabsList>

          {/* --- Onglet Profil --- */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>
                  Gérez vos informations personnelles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SettingsClient
                  role={role}
                  initialName={userName}
                  initialBoutique={boutiqueName}
                  initialRate={exchangeRate}
                  initialCurrency={defaultCurrency}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- Onglet Mon Abonnement --- */}
          {isOwner && (
            <TabsContent value="subscription">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Mon Abonnement
                  </CardTitle>
                  <CardDescription>
                    Consultez votre forfait actuel et découvrez les offres disponibles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SubscriptionStatus />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* --- Onglet Configuration boutique --- */}
          {isOwner && (
            <TabsContent value="boutique">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-purple-600" />
                    Configuration boutique
                  </CardTitle>
                  <CardDescription>
                    Gérez les paramètres de votre boutique
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-500">Nom de la boutique</p>
                      <p className="font-medium text-gray-900">{boutiqueName || 'Non définie'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-500">Plan actuel</p>
                      <p className="font-medium text-gray-900">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          subscription === 'BRONZE' ? 'bg-amber-100 text-amber-800' :
                          subscription === 'SILVER' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {subscription}
                        </span>
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-500">Propriétaires / Associés</p>
                      <p className="font-medium text-gray-900">1 / {max_owners}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-500">Employés</p>
                      <p className="font-medium text-gray-900">0 / {max_employees}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* --- Onglet Sécurité & mot de passe --- */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Sécurité & mot de passe
                </CardTitle>
                <CardDescription>
                  Gérez la sécurité de votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    🔐 Changez votre mot de passe régulièrement pour sécuriser votre compte.
                  </p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    ⚠️ Suppression de compte (bientôt disponible)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardClientLayout>
  );
}