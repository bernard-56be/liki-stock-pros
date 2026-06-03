'use client'

import { useEffect, useState } from 'react'
import { getUserNotifications, markAllNotificationsAsRead, type Notification } from '../lib/actions/services/notificationService'

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const data = await getUserNotifications()
      setNotifications(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead()
      load()
    } catch (err: unknown) {
      console.error(err)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'danger': return '🔴'
      case 'warning': return '🟠'
      case 'success': return '🟢'
      case 'info': return '🔵'
      default: return '⚪'
    }
  }

  if (loading) return <p className="text-gray-600 p-6">Chargement des notifications...</p>
  if (error) return <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">🔔 Notifications</h2>
        {notifications.some(n => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-600">Aucune notification pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`bg-white rounded-xl p-4 border shadow-sm flex items-start gap-3 ${
                notif.is_read ? 'opacity-60' : ''
              }`}
            >
              <span className="text-xl">{getIcon(notif.type)}</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{notif.title}</p>
                <p className="text-sm text-gray-600">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notif.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
              {!notif.is_read && (
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}