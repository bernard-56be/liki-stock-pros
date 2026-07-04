import { createClient } from '@/lib/supabase/server'
import { DashboardClientLayout } from '@/app/dashboard/(shell)/DashboardClientLayout'
import NotificationsList from '@/components/NotificationsList'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, exchange_rate, boutique_id')
    .eq('id', user?.id)
    .single()

  const role = (profile?.role as 'owner' | 'employee') || 'employee';
  const userName = profile?.full_name || 'Utilisateur';

  // Récupération dynamique du taux de change depuis la table 'boutiques'
  let exchangeRate = 0;
  let shopCode: string | null = null;
  let shopName: string | null = null; 

  if (profile?.boutique_id) {
    const { data: boutique } = await supabase
      .from('boutiques')
      .select('exchange_rate, boutique_code, name')
      .eq('id', profile.boutique_id)
      .maybeSingle();
    
    exchangeRate = boutique?.exchange_rate || 0;
    shopCode = boutique?.boutique_code || null;
    shopName = boutique?.name || null;
  } else if (role === 'owner' && user?.id) {
    const { data: boutique } = await supabase
      .from('boutiques')
      .select('exchange_rate, boutique_code, name')
      .eq('owner_id', user.id)
      .maybeSingle();
      
    exchangeRate = boutique?.exchange_rate || 0;
    shopCode = boutique?.boutique_code || null;
    shopName = boutique?.name || null;
  }

  return (
    <DashboardClientLayout 
      role={role} 
      userName={userName} 
      userAvatar={null}
      currentRate={exchangeRate}
      shopCode={shopCode}
      shopName={shopName}
    >
      <div className="p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <NotificationsList />
        </div>
      </div>
    </DashboardClientLayout>
  )
}