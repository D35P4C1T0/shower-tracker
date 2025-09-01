import { describe, it, expect } from 'vitest'
import { usePWAInstall } from '../usePWAInstall'

describe('usePWAInstall', () => {
  it('should be defined', () => {
    expect(usePWAInstall).toBeDefined()
    expect(typeof usePWAInstall).toBe('function')
  })
})