import { describe, it, expect } from 'vitest'
import { useShowers } from '../useShowers'

describe('useShowers', () => {
  it('should be defined', () => {
    expect(useShowers).toBeDefined()
    expect(typeof useShowers).toBe('function')
  })
})