import { describe, it, expect } from 'vitest'
import { AndroidInstallPrompt } from '../android-install-prompt'

describe('AndroidInstallPrompt', () => {
  it('should be defined', () => {
    expect(AndroidInstallPrompt).toBeDefined()
    expect(typeof AndroidInstallPrompt).toBe('function')
  })
})