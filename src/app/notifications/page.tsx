import { createClient } from '@/lib/supabase/server'
import { DashboardClientLayout } from '@/app/dashboard/(shell)/DashboardClientLayout'
import NotificationsList from '@/components/NotificationsList'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, exchange_rate')
    .eq('id', user?.id)
    .single()

  const role = (profile?.role as 'owner' | 'employee') || 'employee'
  const userName = profile?.full_name || 'Utilisateur'
  const currentRate = profile?.exchange_rate ?? 2200.00

  return (
    <DashboardClientLayout 
      role={role} 
      userName={userName} 
      userAvatar={null}
      currentRate={currentRate}
    >
      <div className="p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <NotificationsList />
        </div>
      </div>
    </DashboardClientLayout>
  )
}