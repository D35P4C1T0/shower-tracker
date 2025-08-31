import { useNotifications } from '@/hooks/useNotifications'
import { AlertCircle, Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function NotificationBanner() {
  const { 
    getFallbackMessage, 
    getPermissionStatus, 
    requestPermission, 
    isSupported,
    isEnabled 
  } = useNotifications()
  
  const [isDismissed, setIsDismissed] = useState(false)
  
  const fallbackMessage = getFallbackMessage()
  const permissionStatus = getPermissionStatus()
  
  // Don't show banner if dismissed or no message to show
  if (isDismissed || !isEnabled || !isSupported()) {
    return null
  }
  
  // Show fallback message if notifications can't be sent but should be
  if (fallbackMessage && permissionStatus !== 'granted') {
    return (
      <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/20 dark:border-amber-800">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Shower Reminder
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {fallbackMessage}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Enable notifications in settings to get automatic reminders.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }
  
  // Show permission request banner if notifications are enabled but permission not granted
  if (permissionStatus !== 'granted' && isEnabled) {
    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/20 dark:border-blue-800">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Enable Notifications
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You have notifications enabled but haven't granted browser permission yet. 
                Click below to enable shower reminders.
              </p>
              <Button
                onClick={requestPermission}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Bell className="h-4 w-4 mr-1" />
                Enable Notifications
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }
  
  return null
}