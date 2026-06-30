// src/lib/actions/subscriptionActions.ts
'use server';

import { createClient } from '@/lib/supabase/server';


export async function simulateMobileMoneyPayment(plan: string) {
  const supabase = await createClient();
  // Récupération sécurisée de l'utilisateur et de sa boutique

  // Récupération sécurisée de l'utilisateur et de sa boutique
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  // On suppose que votre table 'boutiques' est liée à l'utilisateur par un 'user_id'
  const { data: boutique } = await supabase
    .from('boutiques')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!boutique) return { success: false, error: "Aucune boutique trouvée" };

  // Log after boutique is retrieved to avoid using the variable before declaration
  console.log("Boutique trouvée pour mise à jour :", boutique);

  // Simulation du délai de 3 secondes
   await new Promise((resolve) => setTimeout(resolve, 3000));

 const { error } = await supabase
    .from('boutiques')
    .update({ 
      subscription_plan: plan,      
      subscription_status: 'active' 
    })
    .eq('id', boutique.id);

  if (error) {
  console.error("Erreur Supabase :", error); // Vérifiez votre terminal VS Code
  return { success: false, error: error.message };
}

  return { success: true, message: `Forfait ${plan} activé !` };

}