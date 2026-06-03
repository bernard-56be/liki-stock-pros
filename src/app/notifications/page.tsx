import { createClient } from '@/lib/supabase/server'
import { DashboardClientLayout } from '@/app/dashboard/(shell)/DashboardClientLayout'
import NotificationsList from '@/components/NotificationsList'

export default async function NotificationsPage() {
  const supabase = await createClient()

  // 1. Récupérer l'utilisateur connecté
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Récupérer son profil pour avoir le rôle, le nom, etc.
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user?.id)
    .single()

  const role = (profile?.role as 'owner' | 'employee') || 'employee'
  const userName = profile?.full_name || 'Utilisateur'
  const userAvatar = null // ou une URL si vous en avez une

  return (
    <DashboardClientLayout role={role} userName={userName} userAvatar={userAvatar}>
      <div className="p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <NotificationsList />
        </div>
      </div>
    </DashboardClientLayout>
  )
}


