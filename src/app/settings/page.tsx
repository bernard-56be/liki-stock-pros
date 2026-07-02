import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClientLayout } from '@/app/dashboard/(shell)/DashboardClientLayout';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Récupérer le profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const role = user.user_metadata?.role || profile?.role || 'employee';
  const userName = profile?.full_name || 'Utilisateur';
  const avatar = profile?.avatar_url || null;
  
  // Valeurs par défaut sécurisées pour la devise
  const defaultCurrency = profile?.default_currency ?? 'USD';
  
  let boutiqueName = '';
  // Modification : On va chercher dynamiquement la boutique et son taux de change réel
  let exchangeRate = 2850.00;

  // On cherche la boutique soit par son ID (si l'utilisateur y est rattaché) soit par l'owner_id (pour le propriétaire EXAUCE)
  const { data: boutiqueData } = await supabase
    .from('boutiques')
    .select('id, name, exchange_rate')
    .or(`id.eq.${profile?.boutique_id},owner_id.eq.${user.id}`)
    .maybeSingle();

  if (boutiqueData) {
    exchangeRate = boutiqueData.exchange_rate ?? 2850.00;
    
    // Si c'est un propriétaire, on récupère le vrai nom de sa boutique
    if (role === 'owner') {
      boutiqueName = boutiqueData.name || '';
    }
  }

  return (
    <DashboardClientLayout
      role={role}
      userName={userName}
      userAvatar={avatar}
      currentRate={exchangeRate}
    >
      <div className="p-4 md:p-6 lg:p-8">
        <SettingsClient 
          role={role} 
          initialName={userName} 
          initialBoutique={boutiqueName} 
          initialRate={exchangeRate} 
          initialCurrency={defaultCurrency} 
        />
      </div>
    </DashboardClientLayout>
  );
}