import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClientLayout } from './DashboardClientLayout';

// Force Next.js à ne JAMAIS mettre cette page en cache (Rendu 100% dynamique)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  // Récupération du taux de change
  const { data: boutique } = await supabase
    .from('boutiques')
    .select('exchange_rate')
    .eq('owner_id', user.id)
    .maybeSingle();

  let exchangeRate = 2850;
  if (boutique?.exchange_rate) {
    exchangeRate = boutique.exchange_rate;
  } else {
    const { data: profile } = await supabase
      .from('profiles')
      .select('boutique_id')
      .eq('id', user.id)
      .single();

    if (profile?.boutique_id) {
      const { data: empBoutique } = await supabase
        .from('boutiques')
        .select('exchange_rate')
        .eq('id', profile.boutique_id)
        .maybeSingle();
      
      if (empBoutique?.exchange_rate) {
        exchangeRate = empBoutique.exchange_rate;
      }
    }
  }

  return (
    <DashboardClientLayout
      role={role}
      userName={userName}
      userAvatar={userAvatar}
      currentRate={exchangeRate}
    >
      {children}
    </DashboardClientLayout>
  );
}