import NotificationsList from '@/components/NotificationsList'

export default function NotificationsPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Un petit titre propre pour la page si nécessaire */}
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
          Notifications
        </h2>
        
        <NotificationsList />
      </div>
    </div>
  )
}