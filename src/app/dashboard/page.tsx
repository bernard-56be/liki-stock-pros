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

  const role = user.user_metadata?.role;

  if (role === 'owner') {
    redirect('/dashboard/owner/inventaire');
  }

  if (role === 'employee') {
    // Pour l'employé, on doit vérifier le statut dans la DB
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single();

    if (profile?.status !== 'active') {
      redirect('/dashboard/pending');
    }
    redirect('/dashboard/employee/ventes');
  }

  // Fallback si pas de métadonnées
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'owner') {
    redirect('/dashboard/owner/inventaire');
  } else if (profile?.role === 'employee') {
    if (profile.status !== 'active') {
      redirect('/dashboard/pending');
    }
    redirect('/dashboard/employee/ventes');
  }

  redirect('/auth/login');
}
