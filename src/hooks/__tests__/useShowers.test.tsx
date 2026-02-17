import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useShowers } from '../useShowers'

const {
  dispatch,
  showerServiceMock,
} = vi.hoisted(() => ({
  dispatch: vi.fn(),
  showerServiceMock: {
    addShower: vi.fn(),
    updateShower: vi.fn(),
    deleteShower: vi.fn(),
    getShowersByDateRange: vi.fn(),
    getAllShowers: vi.fn(),
  },
}))

const mockState = {
  showers: [],
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
}

vi.mock('../../stores/AppContext', () => ({
  useAppContext: () => ({ state: mockState, dispatch }),
}))

vi.mock('../../lib/database-service', () => ({
  ShowerService: showerServiceMock,
}))

describe('useShowers', () => {
  beforeEach(() => {
    dispatch.mockReset()
    showerServiceMock.addShower.mockReset()
    showerServiceMock.addShower.mockResolvedValue({
      id: '1',
      timestamp: new Date('2025-01-01T00:00:00.000Z'),
    })
  })

  it('adds a shower through service and dispatch', async () => {
    const { result } = renderHook(() => useShowers())

    await act(async () => {
      await result.current.addShower()
    })

    expect(showerServiceMock.addShower).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ADD_SHOWER',
      })
    )
  })
})
