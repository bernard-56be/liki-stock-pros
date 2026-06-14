'use server';

import { createClient } from '@/lib/supabase/server';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'success' | 'danger'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Insertion dans la table notifications
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Erreur création notification:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}