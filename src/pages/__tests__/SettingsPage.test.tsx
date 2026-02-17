import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsPage } from '../SettingsPage'

const {
  useSettingsMock,
  useNotificationsMock,
  useToastMock,
} = vi.hoisted(() => ({
  useSettingsMock: vi.fn(),
  useNotificationsMock: vi.fn(),
  useToastMock: vi.fn(),
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

describe('SettingsPage', () => {
  beforeEach(() => {
    useSettingsMock.mockReset()
    useNotificationsMock.mockReset()
    useToastMock.mockReset()
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

    const repoLink = screen.getByRole('link', { name: 'example-org/example-repo' })
    const authorLink = screen.getByRole('link', { name: '@example-user' })

    expect(repoLink).toHaveAttribute('href', 'https://github.com/example-org/example-repo')
    expect(authorLink).toHaveAttribute('href', 'https://github.com/example-user')
  })
})
