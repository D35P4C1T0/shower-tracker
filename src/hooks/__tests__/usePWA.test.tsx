import { describe, it, expect } from 'vitest'
import { usePWA } from '../usePWA'

describe('usePWA', () => {
  it('should be defined', () => {
    expect(usePWA).toBeDefined()
    expect(typeof usePWA).toBe('function')
  })
})