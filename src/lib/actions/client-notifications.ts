// src/lib/actions/client-notifications.ts
// Ce fichier est pour les fonctions côté client uniquement

/**
 * Envoie une notification push dans le navigateur (client uniquement)
 * @param title Titre de la notification
 * @param body Corps du message
 */
export function sendBrowserNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications non supportées par ce navigateur.')
    return
  }

  if (Notification.permission !== 'granted') {
    console.warn('Permission de notification non accordée.')
    return
  }

  try {
    const options: NotificationOptions & { vibrate?: number[] } = {
      body,
      icon: '/logo.png',
      badge: '/badge.png',
      tag: 'liki-stock',
      vibrate: [200, 100, 200],
    }

    new Notification(title, options)
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error)
  }
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

/**
 * Demande l'autorisation d'envoyer des notifications push (client uniquement)
 * @returns true si l'utilisateur a accepté
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications non supportées par ce navigateur.')
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (error) {
    console.error('Erreur lors de la demande de permission:', error)
    return false
  }
}