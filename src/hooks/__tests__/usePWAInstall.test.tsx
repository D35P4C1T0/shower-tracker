import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePWAInstall } from '../usePWAInstall'

const { detectPlatformMock, installPWAMock } = vi.hoisted(() => ({
  detectPlatformMock: vi.fn(),
  installPWAMock: vi.fn(),
}))

vi.mock('../../lib/platform-utils', () => ({
  detectPlatform: detectPlatformMock,
}))

vi.mock('../usePWA', () => ({
  usePWA: () => ({
    isInstallable: true,
    isInstalled: false,
    installApp: installPWAMock,
  }),
}))

describe('usePWAInstall', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    detectPlatformMock.mockReset()
    installPWAMock.mockReset()
    installPWAMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows iOS prompt after delay when install is supported', () => {
    detectPlatformMock.mockReturnValue({
      isIOS: true,
      isAndroid: false,
      isStandalone: false,
      canInstall: true,
    })

    const { result } = renderHook(() => usePWAInstall())
    expect(result.current.showIOSPrompt).toBe(false)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.showIOSPrompt).toBe(true)
  })

  it('shows android prompt when shared pwa install is available', () => {
    detectPlatformMock.mockReturnValue({
      isIOS: false,
      isAndroid: true,
      isStandalone: false,
      canInstall: true,
    })

    const { result } = renderHook(() => usePWAInstall())

    expect(result.current.showAndroidPrompt).toBe(true)
  })
})
