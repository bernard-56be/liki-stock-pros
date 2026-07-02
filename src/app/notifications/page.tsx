import { createClient } from '@/lib/supabase/server'
import { DashboardClientLayout } from '@/app/dashboard/(shell)/DashboardClientLayout'
import NotificationsList from '@/components/NotificationsList'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Modification : ajout de boutique_id dans la sélection
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, boutique_id')
    .eq('id', user?.id)
    .single()

  const role = (profile?.role as 'owner' | 'employee') || 'employee'
  const userName = profile?.full_name || 'Utilisateur'

  // Récupération dynamique du taux de change depuis la table 'boutiques'
  let exchangeRate = 0;

  if (profile?.boutique_id) {
    const { data: boutique } = await supabase
      .from('boutiques')
      .select('exchange_rate')
      .eq('id', profile.boutique_id)
      .maybeSingle();
    
    exchangeRate = boutique?.exchange_rate || 0;
  } else if (role === 'owner' && user?.id) {
    const { data: boutique } = await supabase
      .from('boutiques')
      .select('exchange_rate')
      .eq('owner_id', user.id)
      .maybeSingle();
      
    exchangeRate = boutique?.exchange_rate || 0;
  }

  return (
    <DashboardClientLayout 
      role={role} 
      userName={userName} 
      userAvatar={null} 
      currentRate={exchangeRate} // <-- Injection de la propriété pour corriger l'erreur TypeScript
    >
      <div className="p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <NotificationsList />
        </div>
      </div>
    </DashboardClientLayout>
  )
}