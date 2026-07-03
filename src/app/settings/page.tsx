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
  let exchangeRate = 0;
  let shopCode: string | null = null;

  if (role === 'owner' && profile?.boutique_id) {
    const { data: boutique } = await supabase
      .from('boutiques')
      .select('name, subscription, max_owners, max_employees, exchange_rate, boutique_code')
      .eq('id', profile.boutique_id)
      .single();

    boutiqueName = boutique?.name || '';
    subscription = boutique?.subscription || 'BRONZE';
    max_owners = boutique?.max_owners || 1;
    max_employees = boutique?.max_employees || 1;
    exchangeRate = boutique?.exchange_rate ?? exchangeRate;
    shopCode = boutique?.boutique_code || null;
  }

  return (
    <DashboardClientLayout
      role={role}
      userName={userName}
      userAvatar={avatar}
      currentRate={exchangeRate}
      shopCode={shopCode}
    >
      <div className="p-4 md:p-6 lg:p-8">
        <SettingsClient
          role={role}
          initialName={userName}
          initialBoutique={boutiqueName}
          initialRate={exchangeRate}
          initialCurrency={defaultCurrency}
        />
      </div>
    </DashboardClientLayout>
  );
}