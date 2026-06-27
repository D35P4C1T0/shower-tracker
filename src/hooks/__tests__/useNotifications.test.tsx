import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotifications } from '../useNotifications'

type MockState = {
  settings: {
    notificationsEnabled: boolean
    notificationThresholdDays: number
    theme: 'light' | 'dark' | 'system'
    firstDayOfWeek: 0 | 1
    projectInfo: {
      githubRepo: string
      author: string
    }
  }
  showers: Array<{ id: string; timestamp: Date }>
  lastNotificationCheck: Date | null
  isLoading: boolean
  error: string | null
}

const {
  dispatch,
  notificationServiceMock,
  metadataServiceMock,
  settingsServiceMock,
} = vi.hoisted(() => ({
  dispatch: vi.fn(),
  notificationServiceMock: {
    requestPermission: vi.fn(),
    shouldSendNotification: vi.fn(),
    showShowerReminder: vi.fn(),
    getPermission: vi.fn(),
    isSupported: vi.fn(),
    getPermissionStatusMessage: vi.fn(),
    getFallbackMessage: vi.fn(),
    showNotification: vi.fn(),
  },
  metadataServiceMock: {
    setLastNotificationCheck: vi.fn(),
  },
  settingsServiceMock: {
    updateSetting: vi.fn(),
  },
}))

let mockState: MockState

vi.mock('../../stores/AppContext', () => ({
  useAppContext: () => ({ state: mockState, dispatch }),
  useAppState: () => mockState,
  useAppDispatch: () => dispatch,
}))

vi.mock('../../lib/notification-service', () => ({
  NotificationService: notificationServiceMock,
}))

vi.mock('../../lib/database-service', () => ({
  MetadataService: metadataServiceMock,
  SettingsService: settingsServiceMock,
}))

describe('useNotifications', () => {
  beforeEach(() => {
    mockState = {
      settings: {
        notificationsEnabled: true,
        notificationThresholdDays: 3,
        theme: 'system',
        firstDayOfWeek: 0,
        projectInfo: {
          githubRepo: 'https://github.com/D35P4C1T0/shower-tracker',
          author: 'D35P4C1T0',
        },
      },
      showers: [{ id: '1', timestamp: new Date('2025-01-01T00:00:00.000Z') }],
      lastNotificationCheck: null,
      isLoading: true,
      error: null,
    }

    dispatch.mockReset()
    notificationServiceMock.requestPermission.mockReset()
    notificationServiceMock.shouldSendNotification.mockReset()
    notificationServiceMock.showShowerReminder.mockReset()
    notificationServiceMock.getPermission.mockReset()
    notificationServiceMock.isSupported.mockReset()
    notificationServiceMock.getPermissionStatusMessage.mockReset()
    notificationServiceMock.getFallbackMessage.mockReset()
    notificationServiceMock.showNotification.mockReset()
    metadataServiceMock.setLastNotificationCheck.mockReset()
    settingsServiceMock.updateSetting.mockReset()

    notificationServiceMock.requestPermission.mockResolvedValue('default')
    notificationServiceMock.shouldSendNotification.mockReturnValue(false)
    notificationServiceMock.showShowerReminder.mockResolvedValue(false)
    notificationServiceMock.getPermission.mockReturnValue('granted')
    notificationServiceMock.isSupported.mockReturnValue(true)
    notificationServiceMock.getPermissionStatusMessage.mockReturnValue('ok')
    notificationServiceMock.getFallbackMessage.mockReturnValue('fallback')
    notificationServiceMock.showNotification.mockResolvedValue(true)
    settingsServiceMock.updateSetting.mockResolvedValue(undefined)
    metadataServiceMock.setLastNotificationCheck.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not start scheduler in consumer mode', () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval')

    renderHook(() => useNotifications())

    expect(setIntervalSpy).not.toHaveBeenCalled()
  })

  it('starts scheduler only when explicitly enabled', () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval').mockReturnValue(123 as unknown as ReturnType<typeof setInterval>)

    const controller = renderHook(() => useNotifications({ enableScheduler: true }))
    const consumer = renderHook(() => useNotifications())

    expect(setIntervalSpy).toHaveBeenCalledTimes(1)

    controller.unmount()
    consumer.unmount()
  })

  it('persists notification-enabled setting when permission is granted', async () => {
    notificationServiceMock.requestPermission.mockResolvedValue('granted')
    const { result } = renderHook(() => useNotifications())

    await act(async () => {
      const permission = await result.current.requestPermission()
      expect(permission).toBe('granted')
    })

    expect(settingsServiceMock.updateSetting).toHaveBeenCalledWith('notificationsEnabled', true)
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_SETTING',
      payload: { key: 'notificationsEnabled', value: true },
    })
  })
})
