import { describe, it, expect } from 'vitest'
import { useNotifications } from '../useNotifications'

describe('useNotifications', () => {
  it('should be defined', () => {
    expect(useNotifications).toBeDefined()
    expect(typeof useNotifications).toBe('function')
  })
})