import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePWAInstall } from '../usePWAInstall'

const { detectPlatformMock } = vi.hoisted(() => ({
  detectPlatformMock: vi.fn(),
}))

vi.mock('../../lib/platform-utils', () => ({
  detectPlatform: detectPlatformMock,
}))

describe('usePWAInstall', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    detectPlatformMock.mockReset()
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

  it('stores beforeinstallprompt event and shows android prompt', () => {
    detectPlatformMock.mockReturnValue({
      isIOS: false,
      isAndroid: true,
      isStandalone: false,
      canInstall: true,
    })

    const { result } = renderHook(() => usePWAInstall())

    const event = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
    }
    event.preventDefault = vi.fn()
    event.prompt = vi.fn().mockResolvedValue(undefined)
    event.userChoice = Promise.resolve({ outcome: 'accepted' })

    act(() => {
      window.dispatchEvent(event)
    })

    expect(result.current.showAndroidPrompt).toBe(true)
  })
})
