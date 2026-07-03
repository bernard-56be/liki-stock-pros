'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { getUserNotifications, markAllNotificationsAsRead, type Notification } from '@/lib/actions/services/notificationService'

export default function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    setLoading(true)
    const data = await getUserNotifications()
    setNotifications(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) load()
  }, [isOpen])

  // Fermer si clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={async () => { await markAllNotificationsAsRead(); load() }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {loading ? (
            <p className="p-4 text-sm text-gray-500 text-center">Chargement...</p>
          ) : notifications.length === 0 ? (
            <p className="p-6 text-sm text-gray-400 text-center">Aucune notification</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.slice(0, 10).map(notif => (
                <div
                  key={notif.id}
                  className={`p-4 text-sm ${!notif.is_read ? 'bg-blue-50/40' : ''}`}
                >
                  <p className={`${!notif.is_read ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notif.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}

          <a
            href="/notifications"
            className="block text-center p-3 text-xs text-blue-600 hover:bg-gray-50 border-t border-gray-100 font-medium"
          >
            Voir toutes les notifications
          </a>
        </div>
      )}
    </div>
  )
}