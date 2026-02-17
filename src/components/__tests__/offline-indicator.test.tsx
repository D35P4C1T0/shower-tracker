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
      updateApp,
    })

    render(<OfflineIndicator />)

    expect(screen.getByTestId('offline-indicator')).toHaveTextContent('Offline.')
    fireEvent.click(screen.getByRole('button', { name: 'Update Now' }))
    expect(updateApp).toHaveBeenCalledTimes(1)
  })

  it('returns null when online and no update is available', () => {
    usePWAMock.mockReturnValue({
      isOnline: true,
      isOfflineReady: true,
      isUpdateAvailable: false,
      updateApp: vi.fn(),
    })

    const { container } = render(<OfflineIndicator />)
    expect(container).toBeEmptyDOMElement()
  })
})
