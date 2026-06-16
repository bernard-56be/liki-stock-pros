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

  // Récupérer le profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const role = user.user_metadata?.role || profile?.role || 'employee';
  const userName = profile?.full_name || 'Utilisateur';
  const avatar = profile?.avatar_url || null;
  
  let boutiqueName = '';

  // Si c'est un propriétaire, on récupère le vrai nom de sa boutique depuis la table 'boutiques'
  if (role === 'owner' && profile?.boutique_id) {
    const { data: boutique } = await supabase
      .from('boutiques')
      .select('name')
      .eq('id', profile.boutique_id)
      .single();
      
    boutiqueName = boutique?.name || '';
  }

  return (
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