'use client'

import { useNotifications } from '@/contexts/NotificationContext'
import { Check, AlertTriangle, Info, CheckCircle, XCircle, BellOff } from 'lucide-react'
import { markNotificationAsRead } from '@/lib/actions/notifications'

type NotificationPanelProps = {
  onClose: () => void
}

const typeIcons = {
  danger: <XCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
}

const typeBgColors = {
  danger: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info: 'bg-blue-50 border-blue-200',
  success: 'bg-green-50 border-green-200',
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, markAllAsRead } = useNotifications()

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id)
  }

  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <BellOff className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">Aucune notification</p>
        <p className="text-sm text-gray-400">Les alertes apparaîtront ici</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">
          Notifications {unreadCount > 0 && `(${unreadCount} non lues)`}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="overflow-y-auto max-h-[360px] p-2 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg border ${typeBgColors[notification.type]} ${
              notification.read ? 'opacity-60' : ''
            } transition-all`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {typeIcons[notification.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  {notification.title}
                </p>
                <p className="text-sm text-gray-600 break-words">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
              {!notification.read && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="flex-shrink-0 p-1 rounded hover:bg-gray-200 transition"
                  title="Marquer comme lu"
                >
                  <Check className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}