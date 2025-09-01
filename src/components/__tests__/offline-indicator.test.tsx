import { describe, it, expect } from 'vitest'
import { OfflineIndicator } from '../offline-indicator'

describe('OfflineIndicator', () => {
  it('should be defined', () => {
    expect(OfflineIndicator).toBeDefined()
    expect(typeof OfflineIndicator).toBe('function')
  })
})