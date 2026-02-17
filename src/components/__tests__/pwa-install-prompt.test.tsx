import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PWAInstallPrompt } from '../pwa-install-prompt'

const { usePWAInstallMock } = vi.hoisted(() => ({
  usePWAInstallMock: vi.fn(),
}))

vi.mock('../../hooks/usePWAInstall', () => ({
  usePWAInstall: usePWAInstallMock,
}))

vi.mock('../android-install-prompt', () => ({
  AndroidInstallPrompt: () => <div data-testid="android-prompt" />,
}))

vi.mock('../ios-install-prompt', () => ({
  IOSInstallPrompt: () => <div data-testid="ios-prompt" />,
}))

describe('PWAInstallPrompt', () => {
  beforeEach(() => {
    usePWAInstallMock.mockReset()
  })

  it('renders android prompt when installable on android', () => {
    usePWAInstallMock.mockReturnValue({
      platform: {
        isStandalone: false,
        canInstall: true,
        isAndroid: true,
        isIOS: false,
      },
      showAndroidPrompt: true,
      showIOSPrompt: false,
      isInstalling: false,
      installApp: vi.fn(),
      dismissAndroidPrompt: vi.fn(),
      dismissIOSPrompt: vi.fn(),
    })

    render(<PWAInstallPrompt />)
    expect(screen.getByTestId('android-prompt')).toBeInTheDocument()
  })

  it('renders nothing when app is already standalone', () => {
    usePWAInstallMock.mockReturnValue({
      platform: {
        isStandalone: true,
        canInstall: true,
        isAndroid: true,
        isIOS: false,
      },
      showAndroidPrompt: true,
      showIOSPrompt: false,
      isInstalling: false,
      installApp: vi.fn(),
      dismissAndroidPrompt: vi.fn(),
      dismissIOSPrompt: vi.fn(),
    })

    const { container } = render(<PWAInstallPrompt />)
    expect(container).toBeEmptyDOMElement()
  })
})
