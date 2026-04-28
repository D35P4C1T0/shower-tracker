import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OfflineIndicator } from '../offline-indicator'

const { usePWAMock } = vi.hoisted(() => ({
  usePWAMock: vi.fn(),
}))

vi.mock('../../hooks/usePWA', () => ({
  usePWA: usePWAMock,
}))

describe('OfflineIndicator', () => {
  beforeEach(() => {
    usePWAMock.mockReset()
  })

  it('renders offline status and update action when relevant', () => {
    const updateApp = vi.fn()
    usePWAMock.mockReturnValue({
      isOnline: false,
      isOfflineReady: true,
      isUpdateAvailable: true,
      latestVersion: '1.3.2',
      updateApp,
      checkForUpdates: vi.fn(),
    })

    render(<OfflineIndicator />)

    expect(screen.getByTestId('offline-indicator')).toHaveTextContent('Offline.')
    expect(screen.getByText('Version 1.3.2 is available!')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Update Now' }))
    expect(updateApp).toHaveBeenCalledTimes(1)
  })

  it('checks for updates when pulled down from the top', () => {
    const checkForUpdates = vi.fn()
    usePWAMock.mockReturnValue({
      isOnline: true,
      isOfflineReady: true,
      isUpdateAvailable: false,
      updateApp: vi.fn(),
      checkForUpdates,
    })

    render(<OfflineIndicator />)

    fireEvent.touchStart(window, { touches: [{ clientY: 20 }] })
    fireEvent.touchEnd(window, { changedTouches: [{ clientY: 120 }] })

    expect(checkForUpdates).toHaveBeenCalledTimes(1)
  })

  it('returns null when online and no update is available', () => {
    usePWAMock.mockReturnValue({
      isOnline: true,
      isOfflineReady: true,
      isUpdateAvailable: false,
      updateApp: vi.fn(),
      checkForUpdates: vi.fn(),
    })

    const { container } = render(<OfflineIndicator />)
    expect(container).toBeEmptyDOMElement()
  })
})
