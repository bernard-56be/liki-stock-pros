import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClientLayout } from '@/app/dashboard/(shell)/DashboardClientLayout';
import SettingsClient from './SettingsClient';

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
  const defaultCurrency = profile?.default_currency ?? 'USD';

  let boutiqueName = '';
  let subscription = 'BRONZE';
  let max_owners = 1;
  let max_employees = 1;
  let exchangeRate = 2300;
  let shopCode: string | null = null;
  let currentOwners = 0;
  let currentEmployees = 0;

  // ✅ Récupérer les infos de la boutique pour TOUS les utilisateurs
  if (profile?.boutique_id) {
    const { data: boutique } = await supabase
      .from('boutiques')
      .select('name, subscription, max_owners, max_employees, exchange_rate, boutique_code')
      .eq('id', profile.boutique_id)
      .single();

    boutiqueName = boutique?.name || '';
    subscription = boutique?.subscription || 'BRONZE';
    max_owners = boutique?.max_owners || 1;
    max_employees = boutique?.max_employees || 1;
    exchangeRate = boutique?.exchange_rate ?? 2850;
    shopCode = boutique?.boutique_code || null;
  }

  // ✅ Si le profil n'a pas de boutique_id mais que l'utilisateur est owner
  if (!boutiqueName && role === 'owner') {
    const { data: boutique } = await supabase
      .from('boutiques')
      .select('name, subscription, max_owners, max_employees, exchange_rate, boutique_code')
      .eq('owner_id', user.id)
      .maybeSingle();

    boutiqueName = boutique?.name || '';
    subscription = boutique?.subscription || 'BRONZE';
    max_owners = boutique?.max_owners || 1;
    max_employees = boutique?.max_employees || 1;
    exchangeRate = boutique?.exchange_rate ?? 2850;
    shopCode = boutique?.boutique_code || null;
  }

  // ✅ Compter les propriétaires et employés actifs (pour le propriétaire uniquement)
  if (role === 'owner' && profile?.boutique_id) {
    const { count: ownersCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('boutique_id', profile.boutique_id)
      .in('role', ['owner', 'associe'])
      .eq('status', 'active');

    const { count: employeesCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('boutique_id', profile.boutique_id)
      .eq('role', 'employee')
      .eq('status', 'active');

    currentOwners = ownersCount || 0;
    currentEmployees = employeesCount || 0;
  }

  const isOwner = role === 'owner';

  return (
    <DashboardClientLayout
      role={role}
      userName={userName}
      userAvatar={avatar}
      currentRate={exchangeRate}
      shopCode={shopCode}
      shopName={boutiqueName}
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

        <SettingsClient
          role={role}
          initialName={userName}
          initialBoutique={isOwner ? boutiqueName : ''}
          shopCode={isOwner ? shopCode : null}
          initialRate={exchangeRate}
          initialCurrency={defaultCurrency}
          subscriptionInfo={isOwner ? {
            plan: subscription,
            max_owners: max_owners,
            max_employees: max_employees,
            current_owners: currentOwners,    // ✅ Compteur réel
            current_employees: currentEmployees, // ✅ Compteur réel
            shop_name: boutiqueName,
          } : undefined}
        />
      </div>
    </DashboardClientLayout>
  );
}