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

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    redirect('/auth/login');
  }

  if (profile.role !== 'owner' && profile.role !== 'employee') {
    redirect('/auth/login');
  }

  const role = profile.role as DashboardRole;

  return (
    <div className="flex min-h-screen w-full flex-1 flex-col md:flex-row">
      <Sidebar role={role} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
