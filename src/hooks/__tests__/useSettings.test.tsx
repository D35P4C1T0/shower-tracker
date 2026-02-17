import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSettings } from '../useSettings'

const {
  dispatch,
  settingsServiceMock,
  metadataServiceMock,
} = vi.hoisted(() => ({
  dispatch: vi.fn(),
  settingsServiceMock: {
    updateSetting: vi.fn(),
    saveSettings: vi.fn(),
    getSettings: vi.fn(),
  },
  metadataServiceMock: {
    setLastNotificationCheck: vi.fn(),
    getLastNotificationCheck: vi.fn(),
  },
}))

const mockState = {
  settings: {
    theme: 'system' as const,
    firstDayOfWeek: 0 as const,
    notificationsEnabled: false,
    notificationThresholdDays: 3,
    projectInfo: {
      githubRepo: 'https://github.com/D35P4C1T0/shower-tracker',
      author: 'D35P4C1T0',
    },
  },
  lastNotificationCheck: null,
  isLoading: false,
  error: null,
  showers: [],
}

vi.mock('../../stores/AppContext', () => ({
  useAppContext: () => ({ state: mockState, dispatch }),
}))

vi.mock('../../lib/database-service', () => ({
  SettingsService: settingsServiceMock,
  MetadataService: metadataServiceMock,
}))

describe('useSettings', () => {
  beforeEach(() => {
    dispatch.mockReset()
    settingsServiceMock.updateSetting.mockReset()
    settingsServiceMock.updateSetting.mockResolvedValue(undefined)
    metadataServiceMock.setLastNotificationCheck.mockReset()
    metadataServiceMock.setLastNotificationCheck.mockResolvedValue(undefined)
  })

  it('updates settings through service and dispatch', async () => {
    const { result } = renderHook(() => useSettings())

    await act(async () => {
      await result.current.updateTheme('dark')
    })

    expect(settingsServiceMock.updateSetting).toHaveBeenCalledWith('theme', 'dark')
    expect(dispatch).toHaveBeenCalledWith({
      type: 'UPDATE_SETTING',
      payload: { key: 'theme', value: 'dark' },
    })
  })
})
