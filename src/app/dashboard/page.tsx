import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    redirect('/auth/login');
  }

  if (profile.role === 'owner') {
    redirect('/dashboard/owner/inventaire');
  }

  if (profile.role === 'employee') {
    if (profile.status !== 'active') {
      redirect('/dashboard/pending');
    }
    redirect('/dashboard/employee/ventes');
  }

  redirect('/auth/login');
}
