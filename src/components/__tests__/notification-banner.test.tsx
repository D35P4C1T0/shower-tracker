import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationBanner } from '../notification-banner'

const { useNotificationsMock } = vi.hoisted(() => ({
  useNotificationsMock: vi.fn(),
}))

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: useNotificationsMock,
}))

describe('NotificationBanner', () => {
  beforeEach(() => {
    useNotificationsMock.mockReset()
  })

  it('shows permission CTA and requests permission on click', () => {
    const requestPermission = vi.fn()
    useNotificationsMock.mockReturnValue({
      getFallbackMessage: vi.fn().mockReturnValue(null),
      getPermissionStatus: vi.fn().mockReturnValue('default'),
      requestPermission,
      isSupported: vi.fn().mockReturnValue(true),
      isEnabled: true,
    })

    render(<NotificationBanner />)

    fireEvent.click(screen.getByRole('button', { name: 'Enable Notifications' }))
    expect(requestPermission).toHaveBeenCalledTimes(1)
  })

  it('can be dismissed when fallback message is shown', () => {
    useNotificationsMock.mockReturnValue({
      getFallbackMessage: vi.fn().mockReturnValue('Reminder message'),
      getPermissionStatus: vi.fn().mockReturnValue('default'),
      requestPermission: vi.fn(),
      isSupported: vi.fn().mockReturnValue(true),
      isEnabled: true,
    })

    render(<NotificationBanner />)
    expect(screen.getByText('Reminder message')).toBeInTheDocument()

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[buttons.length - 1])
    expect(screen.queryByText('Reminder message')).not.toBeInTheDocument()
  })
})
