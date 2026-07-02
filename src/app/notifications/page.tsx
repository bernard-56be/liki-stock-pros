import { createClient } from '@/lib/supabase/server';
import { DashboardClientLayout } from '@/app/dashboard/(shell)/DashboardClientLayout';
import NotificationsList from '@/components/NotificationsList';
import { Bell } from 'lucide-react';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, exchange_rate')
    .eq('id', user?.id)
    .single();

  const role = (profile?.role as 'owner' | 'employee') || 'employee';
  const userName = profile?.full_name || 'Utilisateur';
  const currentRate = profile?.exchange_rate ?? 2850.00;

  return (
    <DashboardClientLayout
      role={role}
      userName={userName}
      userAvatar={null}
      currentRate={currentRate}  // ← AJOUTÉ
    >
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* En-tête */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500">
                Restez informé des alertes et activités de votre boutique
              </p>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <NotificationsList />
          </div>
        </div>
      </div>
    </DashboardClientLayout>
  );
}