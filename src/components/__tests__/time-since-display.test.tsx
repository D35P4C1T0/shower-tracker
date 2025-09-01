import { describe, it, expect } from 'vitest'
import { TimeSinceDisplay } from '../time-since-display'

describe('TimeSinceDisplay', () => {
  it('should be defined', () => {
    expect(TimeSinceDisplay).toBeDefined()
    expect(typeof TimeSinceDisplay).toBe('function')
  })
})