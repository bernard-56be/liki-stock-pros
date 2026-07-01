// lib/actions/employee-actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ─── Types ─────────────────────────────────────────────
export interface Employee {
  id: string;
  full_name: string;
  role: 'employee' | 'associate' | 'owner';
}

export interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  limitReached?: boolean;
  currentCount?: number;
  maxAllowed?: number;
  subscription?: string;
}

const SUBSCRIPTION_LIMITS = {
  BRONZE: 1,
  SILVER: 3,
  GOLD: Infinity,
} as const;

// ─── 1. Approuver un employé ──────────────────────────
export async function approveEmployee(employeeId: string) {
  const supabase = await createClient();

  // Vérifier l'utilisateur connecté
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Non authentifié');

  // Récupérer le profil du propriétaire (boutique_id et rôle)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('boutique_id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.boutique_id) {
    throw new Error('Aucune boutique associée à ce compte');
  }
  if (profile.role !== 'owner') {
    throw new Error('Seul le propriétaire peut approuver des employés');
  }

  // Récupérer l'abonnement de la boutique
  const { data: boutique, error: shopError } = await supabase
    .from('boutiques')
    .select('subscription')
    .eq('id', profile.boutique_id)
    .single();

  if (shopError) throw new Error('Impossible de récupérer l\'abonnement');

  const subscription = boutique.subscription || 'BRONZE';
  const maxEmployees = SUBSCRIPTION_LIMITS[subscription as keyof typeof SUBSCRIPTION_LIMITS];

  // Compter les employés actifs
  const { count, error: countError } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('boutique_id', profile.boutique_id)
    .eq('role', 'employee')
    .eq('status', 'active');

  if (countError) throw new Error('Erreur lors du comptage des employés');

  // Vérifier la limite
  if (count !== null && count >= maxEmployees) {
    const subName = subscription.charAt(0) + subscription.slice(1).toLowerCase();
    return {
      success: false,
      error: `Limite atteinte pour l'offre ${subName} (${count}/${maxEmployees === Infinity ? '∞' : maxEmployees} employés actifs).`,
      limitReached: true,
      currentCount: count,
      maxAllowed: maxEmployees,
      subscription,
    };
  }

  // Approuver l'employé
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', employeeId)
    .eq('boutique_id', profile.boutique_id);

  if (updateError) throw new Error('Erreur lors de l\'approbation');

  revalidatePath('/dashboard/owner/validation');
  return { success: true, message: 'Employé approuvé avec succès' };
}

// ─── 2. Récupérer les employés en attente ─────────────
export async function getPendingEmployees() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('boutique_id')
    .eq('id', user.id)
    .single();

  if (!profile?.boutique_id) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, created_at')
    .eq('boutique_id', profile.boutique_id)
    .eq('role', 'employee')
    .eq('status', 'pending');

  if (error) throw new Error(error.message);
  return data || [];
}

// ─── 3. Récupérer tous les employés actifs ────────────
export async function getEmployeesFromDatabase(): Promise<Employee[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('boutique_id')
    .eq('id', user.id)
    .single();

  if (!profile?.boutique_id) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('boutique_id', profile.boutique_id)
    .eq('status', 'active');

  if (error) throw new Error(error.message);
  return (data as Employee[]) || [];
}

// ─── 4. Mettre à jour le rôle d’un employé ────────────
export async function updateEmployeeRole(
  employeeId: string,
  newRole: 'employee' | 'associate' | 'owner'
): Promise<ActionResponse> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { success: false, error: 'Non authentifié' };
  }

  const { data: currentUserProfile, error: profileError } = await supabase
    .from('profiles')
    .select('boutique_id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !currentUserProfile?.boutique_id) {
    return { success: false, error: 'Boutique introuvable' };
  }

  if (currentUserProfile.role !== 'owner') {
    return { success: false, error: 'Seul un propriétaire peut modifier les rôles' };
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', employeeId)
    .eq('boutique_id', currentUserProfile.boutique_id);

  if (updateError) {
    console.error('Erreur updateEmployeeRole:', updateError);
    return { success: false, error: 'Erreur lors de la mise à jour du rôle' };
  }

  revalidatePath('/dashboard/manage-employees');
  return { success: true, message: 'Rôle mis à jour avec succès' };
}

// ─── 5. Refuser un employé (suppression définitive) ──
export async function rejectEmployee(employeeId: string) {
  const supabase = await createClient();

  // Vérifier l'utilisateur connecté
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Non authentifié' };
  }

  // Récupérer la boutique de l'employé
  const { data: employee, error: employeeError } = await supabase
    .from('profiles')
    .select('boutique_id')
    .eq('id', employeeId)
    .single();

  if (employeeError || !employee?.boutique_id) {
    return { success: false, error: 'Employé introuvable' };
  }

  // Vérifier que l'utilisateur est propriétaire de cette boutique
  const { data: boutique, error: boutiqueError } = await supabase
    .from('boutiques')
    .select('owner_id')
    .eq('id', employee.boutique_id)
    .single();

  if (boutiqueError || boutique?.owner_id !== user.id) {
    return { success: false, error: 'Action non autorisée' };
  }

  // Supprimer définitivement le profil
  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', employeeId);

  if (deleteError) {
    console.error('Erreur rejectEmployee:', deleteError);
    return { success: false, error: 'Erreur lors de la suppression' };
  }

  revalidatePath('/dashboard/owner/validation');
  return { success: true, message: 'Employé refusé et supprimé' };
}