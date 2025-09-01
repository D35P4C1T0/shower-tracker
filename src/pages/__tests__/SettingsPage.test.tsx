import { describe, it, expect } from 'vitest'
import { SettingsPage } from '../SettingsPage'

describe('SettingsPage', () => {
  it('should be defined', () => {
    expect(SettingsPage).toBeDefined()
    expect(typeof SettingsPage).toBe('function')
  })
})