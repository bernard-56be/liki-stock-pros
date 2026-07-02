import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClientLayout } from '@/app/dashboard/(shell)/DashboardClientLayout';
import SettingsClient from './SettingsClient';
import SubscriptionStatus from '@/components/shared/SubscriptionStatus';
import UpgradeSubscription from '@/components/shared/UpgradeSubscription';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Users, CreditCard, Shield, Bell, Palette } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Récupérer le profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const role = user.user_metadata?.role || profile?.role || 'employee';
  const userName = profile?.full_name || 'Utilisateur';
  const avatar = profile?.avatar_url || null;
  
  // Valeurs par défaut sécurisées pour la devise
  const defaultCurrency = profile?.default_currency ?? 'USD';

  let boutiqueName = '';
  // Modification : On va chercher dynamiquement la boutique et son taux de change réel
  let exchangeRate = 2850.00;
  
  // Initialisation des variables d'abonnement avec des valeurs par défaut pour TypeScript
  let subscription = 'BRONZE';
  let max_owners = 1;
  let max_employees = 2;

  // On cherche la boutique soit par son ID (si l'utilisateur y est rattaché) soit par l'owner_id (pour le propriétaire EXAUCE)
  // Ajout de la sélection des colonnes d'abonnement pour corriger les erreurs de l'image image_a51a40.png
  const { data: boutiqueData } = await supabase
    .from('boutiques')
    .select('id, name, exchange_rate, subscription, max_owners, max_employees')
    .or(`id.eq.${profile?.boutique_id},owner_id.eq.${user.id}`)
    .maybeSingle();

  if (boutiqueData) {
    exchangeRate = boutiqueData.exchange_rate ?? 2850.00;
    subscription = boutiqueData.subscription ?? 'BRONZE';
    max_owners = boutiqueData.max_owners ?? 1;
    max_employees = boutiqueData.max_employees ?? 2;
    
    // Si c'est un propriétaire, on récupère le vrai nom de sa boutique
    if (role === 'owner') {
      boutiqueName = boutiqueData.name || '';
    }
  }

  return (
    <DashboardClientLayout
      role={role}
      userName={userName}
      userAvatar={avatar}
      currentRate={exchangeRate}
    >
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">⚙️ Paramètres</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez votre compte, votre abonnement et les préférences de votre boutique
            </p>
          </div>
        </div>

        {/* Onglets principaux */}
        <Tabs defaultValue="subscription" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Abonnement</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="boutique" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Boutique</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Sécurité</span>
            </TabsTrigger>
          </TabsList>

          {/* --- Onglet Abonnement --- */}
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Mon Abonnement
                </CardTitle>
                <CardDescription>
                  Gérez votre forfait et vos limites d'utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionStatus />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Changer de forfait
                </CardTitle>
                <CardDescription>
                  Passez à un forfait supérieur pour débloquer plus de fonctionnalités
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UpgradeSubscription />
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- Onglet Profil --- */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Mon Profil
                </CardTitle>
                <CardDescription>
                  Grérez vos informations personnelles
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

          {/* --- Onglet Boutique --- */}
          <TabsContent value="boutique">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Informations de la Boutique
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

          {/* --- Onglet Sécurité --- */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Sécurité
                </CardTitle>
                <CardDescription>
                  Gérez la sécurité de votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    🔐 Zone de sécurité - Gestion du mot de passe et des sessions
                  </p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    ⚠️ Zone dangereuse - Suppression de compte (à implémenter)
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