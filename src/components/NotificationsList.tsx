'use client'

import { useState, useEffect } from 'react'
import { getUnreadNotifications, markAllNotificationsAsRead } from '@/lib/actions/notifications'
import { requestNotificationPermission, sendBrowserNotification } from '@/lib/actions/client-notifications'

type Notification = {
  id: string
  title: string
  message: string
  read: boolean
  created_at: string
  type: 'danger' | 'warning' | 'info' | 'success'
}

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
    requestNotificationPermission()
  }, [])

  const loadNotifications = async () => {
    try {
      const data = await getUnreadNotifications()
      setNotifications(data || [])
    } catch (error) {
      console.error('Erreur de chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
      setNotifications([])
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleSendTestNotification = () => {
    sendBrowserNotification('Test', 'Ceci est une notification de test')
  }

  if (loading) return <div className="p-4 text-gray-500">Chargement...</div>

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Notifications</h2>
        <div className="flex gap-2">
          <button
            onClick={handleSendTestNotification}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            🔔 Tester
          </button>
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Tout marquer comme lu
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Aucune notification</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-3 rounded-lg border ${
                notif.type === 'danger' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
              }`}
            >
              <p className="font-medium">{notif.title}</p>
              <p className="text-sm text-gray-600">{notif.message}</p>
              <p className="text-xs text-gray-400">
                {new Date(notif.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}