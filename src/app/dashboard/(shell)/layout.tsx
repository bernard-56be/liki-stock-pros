import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClientLayout } from './DashboardClientLayout';
import { Toaster } from 'react-hot-toast'

export const dynamic = 'force-dynamic';

export default async function DashboardShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  let role = user.user_metadata?.role;
  if (!role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    role = profile?.role;
  }

  if (role !== 'owner' && role !== 'employee') redirect('/auth/login');

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';
  const userAvatar = user.user_metadata?.avatar_url || null;

  return (
    <>
      <DashboardClientLayout
        role={role}
        userName={userName}
        userAvatar={userAvatar}
      >
        {children}
      </DashboardClientLayout>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
    </>
  );
}