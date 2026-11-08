import { useRef, useState, useEffect, type ChangeEvent } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
import { Github, User, Bell, BellOff, AlertCircle, Tag, Download, Upload, Moon, CalendarDays, Clock3, Send, Database, ChevronRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAX_IMPORT_BYTES = 2 * 1024 * 1024

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

  const handleExportCsv = async () => {
    setIsExportingData(true)
    try {
      const data = await DatabaseService.exportData()
      const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
      const rows = ['timestamp,notes', ...data.showers.map(shower => `${escape(new Date(shower.timestamp).toISOString())},${escape(shower.notes)}`)]
      const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `shower-tracker-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      showError('Failed to export data', 'Could not create CSV export.')
    } finally {
      setIsExportingData(false)
    }
  }

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > MAX_IMPORT_BYTES) {
      showError('Import file too large', 'Choose a JSON export smaller than 2 MB.')
      event.target.value = ''
      return
    }

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
    return <SettingsSkeleton />
  }

  const settingRowClass = 'grid min-h-20 grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-border/60 px-4 py-4 last:border-b-0'
  const controlClass = 'flex w-24 min-w-0 items-center justify-end gap-2'
  const iconClass = 'flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary'
  const headingClass = 'px-4 text-xs font-medium uppercase tracking-widest text-muted-foreground'
  const descriptionClass = 'mt-1 text-xs leading-relaxed text-muted-foreground'
  const notificationsSupported = isSupported()

  return (
    <div className="space-y-6" data-testid="settings-page" data-layout="grouped">
      <h2 className="px-1 text-2xl font-semibold tracking-tight">Settings</h2>
      {error && <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}

      <section className="space-y-2" aria-labelledby="theme-settings-heading">
        <h3 id="theme-settings-heading" className={headingClass}>Theme</h3>
        <Card className="overflow-hidden app-fade-up app-fade-up-delay-1">
          <CardContent className="p-0 sm:p-0">
            <div className={settingRowClass}>
              <span className={iconClass}><Moon className="h-4 w-4" aria-hidden="true" /></span>
              <div className="min-w-0">
                <Label className="font-medium">Appearance</Label>
                <p className={descriptionClass}>Light, dark, or your device setting.</p>
              </div>
              <div className={controlClass}>
                <span className="text-xs capitalize text-muted-foreground">{settings.theme}</span>
                <ThemeSwitcher />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2" aria-labelledby="calendar-settings-heading">
        <h3 id="calendar-settings-heading" className={headingClass}>Calendar</h3>
        <Card className="overflow-hidden app-fade-up app-fade-up-delay-1">
          <CardContent className="p-0 sm:p-0">
            <div className={settingRowClass}>
              <span className={iconClass}><CalendarDays className="h-4 w-4" aria-hidden="true" /></span>
              <div className="min-w-0">
                <Label htmlFor="first-day-of-week" className="font-medium">First day of week</Label>
                <p className={descriptionClass}>Where your calendar week begins.</p>
              </div>
              <Select value={settings.firstDayOfWeek.toString()} onValueChange={handleFirstDayOfWeekChange}>
                <SelectTrigger id="first-day-of-week" className="h-11 w-24 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2" aria-labelledby="notification-settings-heading">
        <h3 id="notification-settings-heading" className={headingClass}>Notifications</h3>
        <Card className="overflow-hidden app-fade-up app-fade-up-delay-2">
          <CardContent className="p-0 sm:p-0">
            {notificationsSupported && (
              <div className={settingRowClass}>
                <span className={iconClass}><Bell className="h-4 w-4" aria-hidden="true" /></span>
                <div className="min-w-0">
                  <Label className="font-medium">Browser permission</Label>
                  <p className={descriptionClass}>{getPermissionStatusMessage()}</p>
                </div>
                <div className={controlClass}>
                  {hasPermission ? (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Granted</span>
                  ) : getPermissionStatus() === 'denied' ? (
                    <span className="flex items-center gap-1 text-sm text-destructive"><BellOff className="h-4 w-4" aria-hidden="true" />Denied</span>
                  ) : (
                    <Button onClick={handleRequestPermission} variant="outline" className="h-11 rounded-lg">Enable</Button>
                  )}
                </div>
              </div>
            )}
            <div className={settingRowClass}>
              <span className={iconClass}><Bell className="h-4 w-4" aria-hidden="true" /></span>
              <div className="min-w-0">
                <Label htmlFor="notifications-enabled" className="font-medium">Enable notifications</Label>
                <p className={descriptionClass}>A nudge when it’s been a while.</p>
              </div>
              <div className={controlClass}>
                <span className="text-xs text-muted-foreground">{settings.notificationsEnabled ? 'On' : 'Off'}</span>
                <Switch
                  id="notifications-enabled"
                  data-testid="notification-toggle"
                  checked={settings.notificationsEnabled}
                  onCheckedChange={handleNotificationsToggle}
                  disabled={!notificationsSupported || (!hasPermission && !settings.notificationsEnabled)}
                />
              </div>
            </div>
            {settings.notificationsEnabled && (
              <div className={settingRowClass}>
                <span className={iconClass}><Clock3 className="h-4 w-4" aria-hidden="true" /></span>
                <div className="min-w-0">
                  <Label htmlFor="notification-threshold" className="font-medium">Reminder threshold (days)</Label>
                  <p className={descriptionClass}>Days since your last shower.</p>
                </div>
                <div className={controlClass}>
                  <Input
                    id="notification-threshold"
                    type="number"
                    min="1"
                    max="30"
                    value={notificationThreshold}
                    onBlur={(e) => handleNotificationThresholdChange(e.target.value)}
                    onChange={(e) => setNotificationThreshold(e.target.value)}
                    className="h-11 w-20 rounded-lg text-center text-base"
                  />
                </div>
              </div>
            )}
            {hasPermission && (
              <div className={settingRowClass}>
                <span className={iconClass}><Send className="h-4 w-4" aria-hidden="true" /></span>
                <div className="min-w-0">
                  <Label className="font-medium">Test notification</Label>
                  <p className={descriptionClass}>Try a reminder on this device.</p>
                </div>
                <div className={controlClass}>
                  <Button onClick={handleTestNotification} variant="outline" className="h-11 rounded-lg" aria-label="Test Notification">Send</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <p className="px-4 text-xs leading-relaxed text-muted-foreground">
          Reminders work while the app is open. Closed-app reminders require Web Push and are not available yet.
        </p>
        {!notificationsSupported && (
          <p className="flex items-start gap-2 px-4 text-xs leading-relaxed text-muted-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Notifications are not supported in this browser.
          </p>
        )}
        {settings.notificationsEnabled && !hasPermission && fallbackMessage && (
          <p className="px-4 text-xs leading-relaxed text-muted-foreground">{fallbackMessage}</p>
        )}
      </section>

      <section className="space-y-2" aria-labelledby="data-settings-heading">
        <h3 id="data-settings-heading" className={headingClass}>Your data</h3>
        <Card className="overflow-hidden app-fade-up app-fade-up-delay-2">
          <CardContent className="p-0 sm:p-0">
            <Button
              variant="ghost"
              className={cn(settingRowClass, 'h-auto w-full whitespace-normal rounded-xl text-left')}
              onClick={() => setIsDataDialogOpen(true)}
              aria-label="Export / Import Data"
            >
              <span className={iconClass}><Download className="h-4 w-4" aria-hidden="true" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">Export / Import Data</span>
                <span className={cn(descriptionClass, 'block font-normal')}>Back up or restore your history.</span>
              </span>
              <span className={controlClass}><ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" /></span>
            </Button>
            <div className={settingRowClass}>
              <span className={iconClass}><Database className="h-4 w-4" aria-hidden="true" /></span>
              <div className="min-w-0">
                <span className="text-sm font-medium">Storage</span>
                <p className={descriptionClass}>Saved locally on this device.</p>
              </div>
              <span className={cn(controlClass, 'text-right text-xs font-medium')} data-testid="storage-type">
                {DatabaseService.getStorageType?.() ?? 'initializing'}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-2" aria-labelledby="about-settings-heading">
        <h3 id="about-settings-heading" className={headingClass}>App information</h3>
        <Card className="overflow-hidden app-fade-up app-fade-up-delay-2">
          <CardContent className="p-0 sm:p-0">
            <div className={settingRowClass}>
              <span className={iconClass}><Github className="h-4 w-4" aria-hidden="true" /></span>
              <span className="text-sm font-medium">Repository</span>
              <a href={repoUrl} target="_blank" rel="noopener noreferrer" aria-label={repoDisplay} className={cn(controlClass, 'min-h-11 text-sm text-primary hover:underline')}>
                GitHub <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
            <div className={settingRowClass}>
              <span className={iconClass}><User className="h-4 w-4" aria-hidden="true" /></span>
              <span className="text-sm font-medium">Creator</span>
              <a href={authorProfileUrl} target="_blank" rel="noopener noreferrer" className={cn(controlClass, 'min-h-11 break-all text-right text-xs text-primary hover:underline')}>
                {authorHandle}
              </a>
            </div>
            <div className={settingRowClass}>
              <span className={iconClass}><Tag className="h-4 w-4" aria-hidden="true" /></span>
              <span className="text-sm font-medium">Version</span>
              <span className={cn(controlClass, 'break-all text-right font-mono text-xs text-muted-foreground')} data-testid="app-version">{formatAppVersion()}</span>
            </div>
          </CardContent>
        </Card>
      </section>

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
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={isExportingData || isImportingData}
              data-testid="export-csv"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
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
