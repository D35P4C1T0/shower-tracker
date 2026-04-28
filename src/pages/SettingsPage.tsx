import { useRef, useState, useEffect, type ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { SettingsSkeleton } from '@/components/loading-skeleton'
import { useSettings } from '@/hooks/useSettings'
import { useNotifications } from '@/hooks/useNotifications'
import { useToast } from '@/components/toast'
import { DEFAULT_SETTINGS } from '@/lib/database-services/default-settings'
import { formatAppVersion } from '@/lib/app-version'
import { DatabaseService } from '@/lib/database-service'
import { Github, User, Bell, BellOff, AlertCircle, Tag, Download, Upload } from 'lucide-react'

export function SettingsPage() {
  const {
    settings,
    updateFirstDayOfWeek,
    toggleNotifications,
    updateNotificationThreshold,
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
  const [isDataDialogOpen, setIsDataDialogOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importFileName, setImportFileName] = useState('')
  const [isExportingData, setIsExportingData] = useState(false)
  const [isImportingData, setIsImportingData] = useState(false)
  const importFileInputRef = useRef<HTMLInputElement | null>(null)
  const fallbackMessage = getFallbackMessage()
  const projectInfo = settings.projectInfo ?? DEFAULT_SETTINGS.projectInfo
  const repoUrl = projectInfo.githubRepo || DEFAULT_SETTINGS.projectInfo.githubRepo
  const repoDisplay = (() => {
    try {
      const url = new URL(repoUrl)
      const value = url.pathname.replace(/^\/|\/$/g, '')
      return value || repoUrl
    } catch {
      return repoUrl
    }
  })()
  const authorValue = projectInfo.author || DEFAULT_SETTINGS.projectInfo.author
  const authorHandle = authorValue.startsWith('@')
    ? authorValue
    : `@${authorValue}`
  const authorProfileUrl = `https://github.com/${authorHandle.replace(/^@/, '')}`

  // Update local state when settings change
  useEffect(() => {
    setNotificationThreshold(settings.notificationThresholdDays.toString())
  }, [settings])

  const handleFirstDayOfWeekChange = async (value: string) => {
    try {
      const firstDayOfWeek = value === '1' ? 1 : 0
      await updateFirstDayOfWeek(firstDayOfWeek)
      success('Settings saved', 'First day of week updated successfully.')
    } catch {
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
    } catch {
      showError('Failed to save setting', 'Could not update notification preferences. Please try again.')
    }
  }

  const handleRequestPermission = async () => {
    const permission = await requestPermission()

    if (permission === 'granted') {
      success('Notifications enabled', 'Browser permission granted and reminders enabled.')
      return
    }

    showError('Permission denied', 'Please allow notifications in browser settings.')
  }

  const handleTestNotification = async () => {
    await testNotification()
  }

  const handleNotificationThresholdChange = async (value: string) => {
    const threshold = parseInt(value, 10)
    if (isNaN(threshold) || threshold < 1) {
      showError('Invalid threshold', 'Please enter a valid number of days (1 or more).')
      return
    }

    try {
      await updateNotificationThreshold(threshold)
      setNotificationThreshold(value)
      success('Settings saved', 'Notification threshold updated successfully.')
    } catch (error) {
      console.error('Failed to save notification threshold:', error)
      showError('Failed to save setting', 'Could not update notification threshold. Please try again.')
    }
  }

  const handleExportData = async () => {
    setIsExportingData(true)
    try {
      const data = await DatabaseService.exportData()
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
      link.href = url
      link.download = `shower-tracker-export-${timestamp}.json`
      link.click()
      URL.revokeObjectURL(url)
      success('Data exported', 'Your shower data export has been created.')
    } catch {
      showError('Failed to export data', 'Could not create an export file. Please try again.')
    } finally {
      setIsExportingData(false)
    }
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportText(await file.text())
    setImportFileName(file.name)
    event.target.value = ''
  }

  const handleImportData = async () => {
    if (!importText.trim()) {
      showError('Import data required', 'Choose a JSON file or paste export data first.')
      return
    }

    setIsImportingData(true)
    try {
      const result = await DatabaseService.importData(importText)
      success('Data imported', `Imported ${result.showersImported} shower${result.showersImported === 1 ? '' : 's'}.`)
      setIsDataDialogOpen(false)
      setImportText('')
      setImportFileName('')
      window.location.reload()
    } catch (error) {
      showError('Failed to import data', error instanceof Error ? error.message : 'The selected data could not be imported.')
    } finally {
      setIsImportingData(false)
    }
  }


  if (isLoading) {
    return <div className="app-fade-in"><SettingsSkeleton /></div>
  }

  return (
    <div className="space-y-5 app-fade-in" data-testid="settings-page">
      <Card className="app-fade-up app-fade-up-delay-1">
        <CardHeader className="pb-4">
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {/* Theme Settings */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Theme</Label>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0 space-y-1">
                <Label>Appearance</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme
                </p>
              </div>
              <div className="justify-self-start sm:justify-self-end">
                <ThemeSwitcher />
              </div>
            </div>
          </div>

          {/* Calendar Settings */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Calendar</Label>
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0 space-y-1">
                  <Label htmlFor="first-day-of-week">First day of week</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose which day starts your week
                  </p>
                </div>
                <Select
                  value={settings.firstDayOfWeek.toString()}
                  onValueChange={handleFirstDayOfWeekChange}
                >
                  <SelectTrigger className="w-full sm:w-[110px]">
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
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Notifications</Label>
            <div className="space-y-5">
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
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0 space-y-1">
                      <Label>Notification Permission</Label>
                      <p className="text-sm text-muted-foreground">
                        {getPermissionStatusMessage()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 justify-self-start sm:justify-self-end">
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
                    <div className="flex justify-start sm:justify-end">
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
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0 space-y-1">
                  <Label htmlFor="notifications-enabled">Enable notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders when it's time to shower
                  </p>
                </div>
                <Switch
                  id="notifications-enabled"
                  data-testid="notification-toggle"
                  checked={settings.notificationsEnabled}
                  onCheckedChange={handleNotificationsToggle}
                  disabled={!isSupported() || (!hasPermission && !settings.notificationsEnabled)}
                  className="justify-self-start sm:justify-self-end"
                />
              </div>

              {/* Threshold Setting */}
              {settings.notificationsEnabled && (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0 space-y-1">
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
                    onBlur={(e) => handleNotificationThresholdChange(e.target.value)}
                    onChange={(e) => setNotificationThreshold(e.target.value)}
                    className="w-full sm:w-20"
                  />
                </div>
              )}

              {/* Fallback Message */}
              {settings.notificationsEnabled && !hasPermission && fallbackMessage && (
                <div className="p-3 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-md dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-800">
                  {fallbackMessage}
                </div>
              )}
            </div>
          </div>


        </CardContent>
      </Card>

      <Card className="app-fade-up app-fade-up-delay-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Advanced</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setIsDataDialogOpen(true)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export / Import Data
          </Button>
        </CardContent>
      </Card>

      {/* App Information - Read Only */}
      <Card className="app-fade-up app-fade-up-delay-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">App Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <Github className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Repository</span>
            </div>
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline font-mono text-right"
            >
              {repoDisplay}
            </a>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Creator</span>
            </div>
            <a
              href={authorProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline font-mono text-right"
            >
              {authorHandle}
            </a>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Version</span>
            </div>
            <span className="text-sm font-mono text-muted-foreground text-right" data-testid="app-version">
              {formatAppVersion()}
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDataDialogOpen} onOpenChange={setIsDataDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm gap-3 p-4">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base">Export / Import Data</DialogTitle>
            <DialogDescription className="text-xs">
              Import replaces all local shower data on this device.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={isExportingData || isImportingData}
              data-testid="export-data"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExportingData ? 'Exporting...' : 'Export JSON'}
            </Button>

            <div className="grid gap-2">
              <Label htmlFor="import-data-file">Import JSON</Label>
              <Input
                ref={importFileInputRef}
                id="import-data-file"
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                disabled={isImportingData}
                className="sr-only"
                data-testid="import-data-file"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => importFileInputRef.current?.click()}
                disabled={isImportingData}
                className="w-full justify-center text-center"
                data-testid="choose-import-file"
              >
                <span className="truncate">
                  {importFileName || 'Choose JSON file'}
                </span>
              </Button>
              <textarea
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Paste exported JSON"
                disabled={isImportingData}
                data-testid="import-data-text"
              />
            </div>
          </div>

          <DialogFooter className="grid grid-cols-2 gap-2 space-x-0 sm:space-x-0">
            <Button
              variant="outline"
              onClick={() => setIsDataDialogOpen(false)}
              disabled={isImportingData}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportData}
              disabled={isImportingData || !importText.trim()}
              data-testid="import-data"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isImportingData ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
