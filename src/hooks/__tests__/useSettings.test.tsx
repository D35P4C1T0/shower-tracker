import { describe, it, expect } from 'vitest'
import { useSettings } from '../useSettings'

describe('useSettings', () => {
  it('should be defined', () => {
    expect(useSettings).toBeDefined()
    expect(typeof useSettings).toBe('function')
  })
})