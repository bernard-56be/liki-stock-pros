import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClientLayout } from './DashboardClientLayout';
import { Toaster } from 'react-hot-toast';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  let role = user.user_metadata?.role || 'employee';
  let exchangeRate = 2850;
  let shopCode: string | null = null;
  let shopName: string | null = null; 

  // 1. Récupération directe depuis la table boutiques (propriétaire)
  const { data: boutique, error: boutiqueError } = await supabase
    .from('boutiques')
    .select('id, exchange_rate, boutique_code, name') // ← ajout de name
    .eq('owner_id', user.id)
    .maybeSingle();

  if (boutique) {
    exchangeRate = boutique.exchange_rate || 2850;
    shopCode = boutique.boutique_code || null;
    shopName = boutique.name || null;
  } else {
    // 2. Cas employé : passer par le profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, boutique_id')
      .eq('id', user.id)
      .maybeSingle();

    role = profile?.role || 'employee';

    if (profile?.boutique_id) {
      const { data: empBoutique } = await supabase
        .from('boutiques')
        .select('exchange_rate, boutique_code, name') // ← ajout de name
        .eq('id', profile.boutique_id)
        .maybeSingle();

      if (empBoutique) {
        exchangeRate = empBoutique.exchange_rate || 2850;
        shopCode = empBoutique.boutique_code || null;
        shopName = empBoutique.name || null;
      }
    }
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur';
  const userAvatar = user.user_metadata?.avatar_url || null;

  return (
    <>
      <DashboardClientLayout
        currentRate={exchangeRate}
        role={role}
        shopCode={shopCode}
        shopName={shopName} 
        userAvatar={userAvatar}
        userName={userName}
      >
        {children}
      </DashboardClientLayout>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
    </>
  );
}