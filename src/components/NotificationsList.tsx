'use client'

import { useState, useEffect } from 'react'
import { getUnreadNotifications, markAllNotificationsAsRead } from '@/lib/actions/notifications'
import { requestNotificationPermission } from '@/lib/actions/client-notifications'
import { Bell, CheckCheck, AlertCircle, AlertTriangle, CheckCircle, Info, BellOff } from 'lucide-react'

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

  const getIcon = (type: string) => {
    const className = "w-5 h-5 flex-shrink-0"
    switch (type) {
      case 'danger': return <AlertCircle className={`${className} text-red-500`} />
      case 'warning': return <AlertTriangle className={`${className} text-amber-500`} />
      case 'success': return <CheckCircle className={`${className} text-green-500`} />
      default: return <Info className={`${className} text-blue-500`} />
    }
  }

  const getCardStyle = (type: string) => {
    switch (type) {
      case 'danger': return 'border-l-4 border-l-red-500 bg-red-50/50 hover:bg-red-50/70'
      case 'warning': return 'border-l-4 border-l-amber-500 bg-amber-50/50 hover:bg-amber-50/70'
      case 'success': return 'border-l-4 border-l-green-500 bg-green-50/50 hover:bg-green-50/70'
      default: return 'border-l-4 border-l-blue-500 bg-blue-50/50 hover:bg-blue-50/70'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            <p className="text-xs text-gray-400">
              {notifications.length} notification{notifications.length > 1 ? 's' : ''} non lue{notifications.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
          >
            <CheckCheck className="w-4 h-4" />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Contenu */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
            <BellOff className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">Tout est calme</h3>
          <p className="text-sm text-gray-500">
            Aucune nouvelle notification pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-xl p-4 transition-all duration-200 ${getCardStyle(notif.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    {new Date(notif.created_at).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}