'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================
// 1. NOTIFICATIONS EN BASE DE DONNÉES
// ============================================================

export async function getUnreadNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function getAllNotifications(limit = 20) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return data || []
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

// ============================================================
// 2. NOTIFICATIONS NAVIGATEUR (WEB PUSH)
// ============================================================

/**
 * Demande l'autorisation d'envoyer des notifications push
 * @returns true si l'utilisateur a accepté
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications non supportées par ce navigateur.')
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

/**
 * Envoie une notification push dans le navigateur
 * @param title Titre de la notification
 * @param body Corps du message
 */
export function sendBrowserNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return

  const options: NotificationOptions & { vibrate?: number[] } = {
    body,
    icon: '/logo.png',
    badge: '/badge.png',
    tag: 'liki-stock',
    vibrate: [200, 100, 200],
  }

  new Notification(title, options)
}

/**
 * Envoie une notification push pour une alerte "danger" (stock critique)
 */
export function sendStockAlertNotification(productName: string, stock: number): void {
  sendBrowserNotification(
    '⚠️ Stock critique',
    `Le produit "${productName}" est presque épuisé (${stock} unités restantes)`
  )
}

/**
 * Envoie une notification push pour une vente
 */
export function sendSaleNotification(employeeName: string, amount: number): void {
  sendBrowserNotification(
    '💰 Nouvelle vente',
    `${employeeName} a réalisé une vente de ${amount.toLocaleString()} FC`
  )
}