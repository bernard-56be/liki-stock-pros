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

  const role = user.user_metadata?.role || 'employee';
  const userName = profile?.full_name || 'Utilisateur';
  const boutiqueName = profile?.boutique_name || '';
  const avatar = profile?.avatar_url || null;

  return (
    // C'est ici que la magie de Next.js opère : on enveloppe la page Paramètres 
    // dans le Layout global. Ainsi, l'UI est 100% identique partout !
    <DashboardClientLayout
      role={role}
      userName={userName}
      userAvatar={avatar}
    >
      <div className="p-4 md:p-6 lg:p-8">
        <SettingsClient 
          role={role} 
          initialName={userName} 
          initialBoutique={boutiqueName} 
        />
      </div>
    </DashboardClientLayout>
  );
}