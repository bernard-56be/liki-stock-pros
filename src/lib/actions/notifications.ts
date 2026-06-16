export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications non supportées par ce navigateur.')
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

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