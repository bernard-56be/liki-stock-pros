import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClientLayout } from '@/app/dashboard/(shell)/DashboardClientLayout';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
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
    <DashboardClientLayout
      role={role}
      userName={userName}
      userAvatar={avatar}
    >
      <ProfileClient 
        role={role} 
        initialName={userName} 
        initialBoutique={boutiqueName} 
      />
    </DashboardClientLayout>
  );
}