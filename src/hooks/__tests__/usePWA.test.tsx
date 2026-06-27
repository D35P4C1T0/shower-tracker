import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PWAProvider, usePWA } from '../usePWA'

const { pwaServiceMock } = vi.hoisted(() => ({
  pwaServiceMock: {
    registerServiceWorker: vi.fn(),
    cacheEssentialData: vi.fn(),
    onUpdateAvailable: vi.fn(),
    onNetworkStatusChange: vi.fn(),
    getInstallInfo: vi.fn(),
    getNetworkStatus: vi.fn(),
    requestNotificationPermission: vi.fn(),
    showNotification: vi.fn(),
    clearCaches: vi.fn(),
    checkForUpdates: vi.fn(),
    supportsNotifications: vi.fn(),
  },
}))

vi.mock('../../lib/pwa-service', () => ({
  pwaService: pwaServiceMock,
}))

describe('usePWA', () => {
  beforeEach(() => {
    pwaServiceMock.registerServiceWorker.mockReset()
    pwaServiceMock.cacheEssentialData.mockReset()
    pwaServiceMock.onUpdateAvailable.mockReset()
    pwaServiceMock.onNetworkStatusChange.mockReset()
    pwaServiceMock.getInstallInfo.mockReset()
    pwaServiceMock.getNetworkStatus.mockReset()
    pwaServiceMock.checkForUpdates.mockReset()
    pwaServiceMock.supportsNotifications.mockReset()

    pwaServiceMock.getInstallInfo.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      installApp: vi.fn(),
    })
    pwaServiceMock.getNetworkStatus.mockReturnValue({
      isOnline: true,
      isOfflineReady: false,
    })
    pwaServiceMock.supportsNotifications.mockReturnValue(true)
    pwaServiceMock.checkForUpdates.mockResolvedValue(false)
  })

  it('initializes pwa service and exposes state', () => {
    const wrapper = ({ children }: { children: ReactNode }) => <PWAProvider>{children}</PWAProvider>
    const { result } = renderHook(() => usePWA(), { wrapper })

    expect(pwaServiceMock.registerServiceWorker).toHaveBeenCalledTimes(1)
    expect(pwaServiceMock.cacheEssentialData).toHaveBeenCalledTimes(1)
    expect(result.current.isInstallable).toBe(true)
    expect(result.current.isInstalled).toBe(false)
    expect(result.current.isOnline).toBe(true)
    expect(result.current.supportsNotifications).toBe(true)
  })
})
