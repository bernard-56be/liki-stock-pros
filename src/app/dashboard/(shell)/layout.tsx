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
  
  // 1. Récupération de la session de l'utilisateur
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // 2. Récupération directe depuis la table boutiques via l'owner_id de la session
  // Nous lisons directement la table boutiques pour l'utilisateur connecté !
  const { data: boutique, error: boutiqueError } = await supabase
    .from('boutiques')
    .select('id, exchange_rate, name')
    .eq('owner_id', user.id)
    .maybeSingle();

  let exchangeRate = 0;
  let role = user.user_metadata?.role || 'owner';

  if (boutique) {
    // Si une boutique correspond à cet ID, on extrait directement son taux
    exchangeRate = boutique.exchange_rate || 0;
  } else {
    // CAS SECONDAIRE : Si c'est un employé, on doit quand même passer par son profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, boutique_id')
      .eq('id', user.id)
      .maybeSingle();

    role = profile?.role || 'employee';

    if (profile?.boutique_id) {
      const { data: empBoutique } = await supabase
        .from('boutiques')
        .select('exchange_rate')
        .eq('id', profile.boutique_id)
        .maybeSingle();
      
      exchangeRate = empBoutique?.exchange_rate || 0;
    }
  }

  // Fallbacks d'affichage pour l'utilisateur
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