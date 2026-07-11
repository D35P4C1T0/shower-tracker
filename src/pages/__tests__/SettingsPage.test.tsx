import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsPage } from '../SettingsPage'

const {
  useSettingsMock,
  useNotificationsMock,
  useToastMock,
  databaseServiceMock,
} = vi.hoisted(() => ({
  useSettingsMock: vi.fn(),
  useNotificationsMock: vi.fn(),
  useToastMock: vi.fn(),
  databaseServiceMock: {
    exportData: vi.fn(),
    importData: vi.fn(),
  },
}))

vi.mock('../../hooks/useSettings', () => ({
  useSettings: useSettingsMock,
}))

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: useNotificationsMock,
}))

vi.mock('../../components/toast', () => ({
  useToast: useToastMock,
}))

vi.mock('../../components/theme-switcher', () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher" />,
}))

vi.mock('../../lib/database-service', () => ({
  DatabaseService: databaseServiceMock,
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    useSettingsMock.mockReset()
    useNotificationsMock.mockReset()
    useToastMock.mockReset()
    databaseServiceMock.exportData.mockReset()
    databaseServiceMock.importData.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders app information from settings values', () => {
    useSettingsMock.mockReturnValue({
      settings: {
        theme: 'system',
        firstDayOfWeek: 0,
        notificationsEnabled: false,
        notificationThresholdDays: 3,
        projectInfo: {
          githubRepo: 'https://github.com/example-org/example-repo',
          author: 'example-user',
        },
      },
      updateFirstDayOfWeek: vi.fn(),
      toggleNotifications: vi.fn(),
      updateNotificationThreshold: vi.fn(),
      isLoading: false,
      error: null,
    })
    useNotificationsMock.mockReturnValue({
      requestPermission: vi.fn().mockResolvedValue('default'),
      getPermissionStatus: vi.fn().mockReturnValue('default'),
      getPermissionStatusMessage: vi.fn().mockReturnValue('Click to enable notifications for shower reminders.'),
      isSupported: vi.fn().mockReturnValue(true),
      testNotification: vi.fn().mockResolvedValue(true),
      getFallbackMessage: vi.fn().mockReturnValue(null),
      hasPermission: false,
    })
    useToastMock.mockReturnValue({
      success: vi.fn(),
      error: vi.fn(),
    })

    render(<SettingsPage />)

    expect(screen.queryByText('Customize your shower tracking experience')).not.toBeInTheDocument()
    expect(screen.getByText('Theme')).toHaveClass('uppercase')
    expect(screen.getByText('Calendar')).toHaveClass('uppercase')
    expect(screen.getByText('Notifications')).toHaveClass('uppercase')

    const repoLink = screen.getByRole('link', { name: 'example-org/example-repo' })
    const authorLink = screen.getByRole('link', { name: '@example-user' })

    expect(repoLink).toHaveAttribute('href', 'https://github.com/example-org/example-repo')
    expect(authorLink).toHaveAttribute('href', 'https://github.com/example-user')
    expect(screen.getByTestId('app-version')).toHaveTextContent('0.0.0-test (test)')
  })

  it('exports and imports data from the advanced dialog', async () => {
    const success = vi.fn()
    const createObjectURL = vi.fn().mockReturnValue('blob:export')
    const revokeObjectURL = vi.fn()
    const click = vi.fn()
    let exportLink: HTMLAnchorElement | null = null
    const originalCreateElement = document.createElement.bind(document)

    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    })
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: ElementCreationOptions) => {
      const element = originalCreateElement(tagName, options)
      if (tagName === 'a') {
        exportLink = element as HTMLAnchorElement
        element.click = click
      }
      return element
    })

    useSettingsMock.mockReturnValue({
      settings: {
        theme: 'system',
        firstDayOfWeek: 0,
        notificationsEnabled: false,
        notificationThresholdDays: 3,
        projectInfo: {
          githubRepo: 'https://github.com/example-org/example-repo',
          author: 'example-user',
        },
      },
      updateFirstDayOfWeek: vi.fn(),
      toggleNotifications: vi.fn(),
      updateNotificationThreshold: vi.fn(),
      isLoading: false,
      error: null,
    })
    useNotificationsMock.mockReturnValue({
      requestPermission: vi.fn().mockResolvedValue('default'),
      getPermissionStatus: vi.fn().mockReturnValue('default'),
      getPermissionStatusMessage: vi.fn().mockReturnValue('Click to enable notifications for shower reminders.'),
      isSupported: vi.fn().mockReturnValue(true),
      testNotification: vi.fn().mockResolvedValue(true),
      getFallbackMessage: vi.fn().mockReturnValue(null),
      hasPermission: false,
    })
    useToastMock.mockReturnValue({
      success,
      error: vi.fn(),
    })
    databaseServiceMock.exportData.mockResolvedValue({
      schemaVersion: 1,
      exportedAt: '2026-04-28T00:00:00.000Z',
      showers: [],
      settings: {},
      metadata: {},
    })
    databaseServiceMock.importData.mockResolvedValue({
      showersImported: 1,
      metadataImported: 0,
    })

    render(<SettingsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Export / Import Data' }))
    expect(screen.getByTestId('choose-import-file')).toHaveClass('justify-center', 'text-center')
    fireEvent.click(screen.getByTestId('export-data'))

    await waitFor(() => {
      expect(databaseServiceMock.exportData).toHaveBeenCalledTimes(1)
      expect(click).toHaveBeenCalledTimes(1)
      expect(exportLink?.download).toMatch(/^shower-tracker-export-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-\d{3}\.json$/)
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:export')
    })

    fireEvent.change(screen.getByTestId('import-data-text'), {
      target: { value: '{"showers":[]}' },
    })
    fireEvent.click(screen.getByTestId('import-data'))

    await waitFor(() => {
      expect(databaseServiceMock.importData).toHaveBeenCalledWith('{"showers":[]}')
      expect(success).toHaveBeenCalledWith('Data imported', 'Imported 1 shower.')
    })
  })

  it('shows import errors without closing the advanced dialog', async () => {
    const showError = vi.fn()

    useSettingsMock.mockReturnValue({
      settings: {
        theme: 'system',
        firstDayOfWeek: 0,
        notificationsEnabled: false,
        notificationThresholdDays: 3,
        projectInfo: {
          githubRepo: 'https://github.com/example-org/example-repo',
          author: 'example-user',
        },
      },
      updateFirstDayOfWeek: vi.fn(),
      toggleNotifications: vi.fn(),
      updateNotificationThreshold: vi.fn(),
      isLoading: false,
      error: null,
    })
    useNotificationsMock.mockReturnValue({
      requestPermission: vi.fn().mockResolvedValue('default'),
      getPermissionStatus: vi.fn().mockReturnValue('default'),
      getPermissionStatusMessage: vi.fn().mockReturnValue('Click to enable notifications for shower reminders.'),
      isSupported: vi.fn().mockReturnValue(true),
      testNotification: vi.fn().mockResolvedValue(true),
      getFallbackMessage: vi.fn().mockReturnValue(null),
      hasPermission: false,
    })
    useToastMock.mockReturnValue({
      success: vi.fn(),
      error: showError,
    })
    databaseServiceMock.importData.mockRejectedValue(new Error('Import file is not valid JSON'))

    render(<SettingsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Export / Import Data' }))
    fireEvent.change(screen.getByTestId('import-data-text'), {
      target: { value: 'not json' },
    })
    fireEvent.click(screen.getByTestId('import-data'))

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith('Failed to import data', 'Import file is not valid JSON')
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
