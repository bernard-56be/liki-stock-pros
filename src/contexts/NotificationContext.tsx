'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUnreadNotifications, markAllNotificationsAsRead } from '@/lib/actions/notifications'
import { requestNotificationPermission } from '@/lib/actions/client-notifications'

type Notification = {
  id: string
  shop_id: string
  user_id: string
  type: 'danger' | 'warning' | 'info' | 'success'
  title: string
  message: string
  read: boolean
  created_at: string
  data: any
}

type NotificationContextType = {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
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
    loadNotifications()
    
    requestNotificationPermission()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotification.id)) return prev
            return [newNotification, ...prev]
          })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [supabase])

  const markAllAsRead = async () => {
    await markAllNotificationsAsRead()
    setNotifications([])
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
        loading,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}