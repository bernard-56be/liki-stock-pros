import { createClient } from "@/lib/supabase/server";

export async function getExchangeRate() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return 0;

  // On récupère l'ID de la boutique via le profil, puis le taux dans la table boutiques
  const { data: profile } = await supabase
    .from('profiles')
    .select('boutique_id')
    .eq('id', user.id)
    .single();

  if (!profile?.boutique_id) return 0;

  const { data: boutique } = await supabase
    .from('boutiques')
    .select('exchange_rate')
    .eq('id', profile.boutique_id)
    .single();

  return boutique?.exchange_rate ?? 0;
}