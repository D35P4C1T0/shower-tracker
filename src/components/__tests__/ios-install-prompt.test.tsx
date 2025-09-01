import { describe, it, expect } from 'vitest'
import { IOSInstallPrompt } from '../ios-install-prompt'

describe('IOSInstallPrompt', () => {
  it('should be defined', () => {
    expect(IOSInstallPrompt).toBeDefined()
    expect(typeof IOSInstallPrompt).toBe('function')
  })
})