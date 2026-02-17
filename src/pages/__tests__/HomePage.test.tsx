import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePage } from '../HomePage'

const {
  useShowersMock,
  useToastMock,
} = vi.hoisted(() => ({
  useShowersMock: vi.fn(),
  useToastMock: vi.fn(),
}))

vi.mock('@/hooks/useShowers', () => ({
  useShowers: useShowersMock,
}))

vi.mock('@/components/toast', () => ({
  useToast: useToastMock,
}))

vi.mock('@/components/notification-banner', () => ({
  NotificationBanner: () => <div data-testid="notification-banner" />,
}))

vi.mock('@/components/time-since-display', () => ({
  TimeSinceDisplay: ({ formatTime }: { formatTime: () => string }) => <div>{formatTime()}</div>,
}))

describe('HomePage', () => {
  beforeEach(() => {
    useShowersMock.mockReset()
    useToastMock.mockReset()
  })

  it('records a shower when pressing the main action', async () => {
    const addShower = vi.fn().mockResolvedValue(undefined)
    const success = vi.fn()
    useShowersMock.mockReturnValue({
      addShower,
      formatTimeSinceLastShower: () => '1 day ago',
      getLastShower: () => null,
      isLoading: false,
      error: null,
    })
    useToastMock.mockReturnValue({
      success,
      error: vi.fn(),
    })

    render(<HomePage />)
    fireEvent.click(screen.getByRole('button', { name: 'Record it' }))

    await waitFor(() => {
      expect(addShower).toHaveBeenCalledTimes(1)
      expect(success).toHaveBeenCalledWith(
        'Shower recorded!',
        'Your shower has been successfully logged.'
      )
    })
  })
})
