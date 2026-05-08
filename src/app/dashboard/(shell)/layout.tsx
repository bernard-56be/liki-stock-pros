// app/dashboard/(shell)/layout.tsx
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Sidebar, type DashboardRole } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DashboardShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Source de vérité hybride : métadonnées JWT d'abord
  let role = user.user_metadata?.role as DashboardRole;

  if (!role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    role = profile?.role as DashboardRole;
  }

  if (role !== 'owner' && role !== 'employee') {
    redirect('/auth/login');
  }

  // Récupération des infos utilisateur pour le header
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';
  const userAvatar = user.user_metadata?.avatar_url || null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header userName={userName} userAvatar={userAvatar} />
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar role={role} />
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}