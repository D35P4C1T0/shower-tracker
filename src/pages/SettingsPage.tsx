import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { SettingsSkeleton } from '@/components/loading-skeleton'
import { useSettings } from '@/hooks/useSettings'
import { useNotifications } from '@/hooks/useNotifications'
import { useToast } from '@/components/toast'
import { Github, User, Bell, BellOff, AlertCircle } from 'lucide-react'

export function SettingsPage() {
  const {
    settings,
    updateFirstDayOfWeek,
    toggleNotifications,
    updateNotificationThreshold,
    updateProjectInfo,
    isLoading,
    error
  } = useSettings()

  const {
    requestPermission,
    getPermissionStatus,
    getPermissionStatusMessage,
    isSupported,
    testNotification,
    getFallbackMessage,
    hasPermission
  } = useNotifications()

  const { success, error: showError } = useToast()

  const [notificationThreshold, setNotificationThreshold] = useState(settings.notificationThresholdDays.toString())
  const [githubRepo, setGithubRepo] = useState(settings.projectInfo.githubRepo)
  const [author, setAuthor] = useState(settings.projectInfo.author)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Update local state when settings change
  useEffect(() => {
    setNotificationThreshold(settings.notificationThresholdDays.toString())
    setGithubRepo(settings.projectInfo.githubRepo)
    setAuthor(settings.projectInfo.author)
    setHasUnsavedChanges(false)
  }, [settings])

  const handleFirstDayOfWeekChange = async (value: string) => {
    try {
      const firstDayOfWeek = value === '1' ? 1 : 0
      await updateFirstDayOfWeek(firstDayOfWeek)
      success('Settings saved', 'First day of week updated successfully.')
    } catch (error) {
      showError('Failed to save setting', 'Could not update first day of week. Please try again.')
    }
  }

  const handleNotificationsToggle = async (enabled: boolean) => {
    try {
      if (enabled && !hasPermission) {
        // Request permission first
        const permission = await requestPermission()
        if (permission !== 'granted') {
          showError('Permission denied', 'Notifications cannot be enabled without permission.')
          return
        }
      }
      await toggleNotifications(enabled)
      success(
        enabled ? 'Notifications enabled' : 'Notifications disabled',
        enabled ? 'You will receive shower reminders.' : 'Shower reminders have been turned off.'
      )
    } catch (error) {
      showError('Failed to save setting', 'Could not update notification preferences. Please try again.')
    }
  }

  const handleRequestPermission = async () => {
    await requestPermission()
  }

  const handleTestNotification = async () => {
    await testNotification()
  }

  const handleNotificationThresholdChange = (value: string) => {
    setNotificationThreshold(value)
    setHasUnsavedChanges(true)
  }

  const handleGithubRepoChange = (value: string) => {
    setGithubRepo(value)
    setHasUnsavedChanges(true)
  }

  const handleAuthorChange = (value: string) => {
    setAuthor(value)
    setHasUnsavedChanges(true)
  }

  const handleSaveProjectInfo = async () => {
    const threshold = parseInt(notificationThreshold, 10)
    if (isNaN(threshold) || threshold < 1) {
      showError('Invalid threshold', 'Please enter a valid number of days (1 or more).')
      return
    }

    try {
      await Promise.all([
        updateNotificationThreshold(threshold),
        updateProjectInfo({
          githubRepo,
          author
        })
      ])
      setHasUnsavedChanges(false)
      success('Settings saved', 'Your preferences have been updated successfully.')
    } catch (error) {
      console.error('Failed to save settings:', error)
      showError('Failed to save settings', 'Could not save your changes. Please try again.')
    }
  }

  const isThresholdValid = () => {
    const threshold = parseInt(notificationThreshold, 10)
    return !isNaN(threshold) && threshold >= 1
  }

  if (isLoading) {
    return <SettingsSkeleton />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Customize your shower tracking experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {/* Theme Settings */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Theme</Label>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Appearance</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme
                </p>
              </div>
              <ThemeSwitcher />
            </div>
          </div>

          {/* Calendar Settings */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Calendar</Label>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="first-day-of-week">First day of week</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose which day starts your week
                  </p>
                </div>
                <Select
                  value={settings.firstDayOfWeek.toString()}
                  onValueChange={handleFirstDayOfWeekChange}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Notifications</Label>
            <div className="space-y-4">
              {/* Browser Support Check */}
              {!isSupported() && (
                <div className="flex items-center gap-2 p-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Notifications are not supported in this browser.</span>
                </div>
              )}

              {/* Permission Status */}
              {isSupported() && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Notification Permission</Label>
                      <p className="text-sm text-muted-foreground">
                        {getPermissionStatusMessage()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasPermission ? (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <Bell className="h-4 w-4" />
                          <span className="text-sm">Granted</span>
                        </div>
                      ) : getPermissionStatus() === 'denied' ? (
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <BellOff className="h-4 w-4" />
                          <span className="text-sm">Denied</span>
                        </div>
                      ) : (
                        <Button
                          onClick={handleRequestPermission}
                          size="sm"
                          variant="outline"
                        >
                          <Bell className="h-4 w-4 mr-1" />
                          Enable
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Test Notification Button */}
                  {hasPermission && (
                    <div className="flex justify-end">
                      <Button
                        onClick={handleTestNotification}
                        size="sm"
                        variant="outline"
                      >
                        Test Notification
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notifications-enabled">Enable notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders when it's time to shower
                  </p>
                </div>
                <Switch
                  id="notifications-enabled"
                  checked={settings.notificationsEnabled}
                  onCheckedChange={handleNotificationsToggle}
                  disabled={!isSupported() || (!hasPermission && !settings.notificationsEnabled)}
                />
              </div>

              {/* Threshold Setting */}
              {settings.notificationsEnabled && (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="notification-threshold">Reminder threshold (days)</Label>
                    <p className="text-sm text-muted-foreground">
                      Send reminder after this many days
                    </p>
                  </div>
                  <Input
                    id="notification-threshold"
                    type="number"
                    min="1"
                    max="30"
                    value={notificationThreshold}
                    onChange={(e) => handleNotificationThresholdChange(e.target.value)}
                    className="w-20"
                  />
                </div>
              )}

              {/* Fallback Message */}
              {settings.notificationsEnabled && !hasPermission && getFallbackMessage() && (
                <div className="p-3 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-800">
                  {getFallbackMessage()}
                </div>
              )}
            </div>
          </div>

          {/* Project Information */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Project Information</Label>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-repo" className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub Repository
                </Label>
                <Input
                  id="github-repo"
                  type="url"
                  placeholder="https://github.com/username/repo"
                  value={githubRepo}
                  onChange={(e) => handleGithubRepoChange(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Link to the project's GitHub repository
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="author" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Author
                </Label>
                <Input
                  id="author"
                  type="text"
                  placeholder="Your name"
                  value={author}
                  onChange={(e) => handleAuthorChange(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Author or maintainer of this app
                </p>
              </div>

              {hasUnsavedChanges && (
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={handleSaveProjectInfo}
                    disabled={!isThresholdValid()}
                    size="sm"
                  >
                    Save Changes
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    You have unsaved changes
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Information - Read Only */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">App Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <Github className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Repository</span>
            </div>
            <a
              href="https://github.com/D35P4C1T0/shower-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline font-mono"
            >
              D35P4C1T0/shower-tracker
            </a>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Creator</span>
            </div>
            <a
              href="https://github.com/D35P4C1T0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline font-mono"
            >
              @D35P4C1T0
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}