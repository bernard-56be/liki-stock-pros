'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationContext'
import NotificationPanel from './NotificationPanel'

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount } = useNotifications()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[380px] max-h-[480px] overflow-hidden rounded-xl bg-white shadow-lg border border-gray-200 z-50">
          <NotificationPanel onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  )
}