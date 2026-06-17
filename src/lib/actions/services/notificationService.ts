'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin' // Importation du client admin sécurisé

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'danger'
  is_read: boolean
  created_at: string
}

export async function getUserNotifications(): Promise<Notification[]> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Utilisateur non connecté')

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Utilisateur non connecté')

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) throw new Error(error.message)
}

// Fonction mise à jour avec le client Admin (Bypass la RLS)
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'warning' | 'success' | 'danger'
): Promise<void> {
  // On utilise le client Admin pour contourner la politique RLS lors de l'insertion automatique
  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from('notifications')
    .insert([
      {
        user_id: userId,
        title,
        message,
        type,
        is_read: false
      }
    ])

  if (error) {
    console.error("Erreur d'insertion de la notification via AdminClient:", error.message)
    throw new Error(error.message)
  }
}