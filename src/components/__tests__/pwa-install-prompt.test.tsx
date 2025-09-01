import { describe, it, expect } from 'vitest'
import { PWAInstallPrompt } from '../pwa-install-prompt'

describe('PWAInstallPrompt', () => {
  it('should be defined', () => {
    expect(PWAInstallPrompt).toBeDefined()
    expect(typeof PWAInstallPrompt).toBe('function')
  })
})