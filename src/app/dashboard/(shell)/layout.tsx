import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Sidebar, type DashboardRole } from '@/components/layout/Sidebar';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DashboardShellLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Utiliser d'abord le rôle des métadonnées pour éviter les problèmes de RLS/latence
  let role = user.user_metadata?.role as DashboardRole;

  if (!role) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      redirect('/auth/login');
    }
    role = profile.role as DashboardRole;
  }

  if (role !== 'owner' && role !== 'employee') {
    redirect('/auth/login');
  }

  return (
    <div className="flex min-h-screen w-full flex-1 flex-col md:flex-row">
      <Sidebar role={role} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
