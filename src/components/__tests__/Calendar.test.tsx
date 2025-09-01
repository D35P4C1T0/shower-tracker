import { describe, it, expect } from 'vitest'
import { Calendar } from '../Calendar'

describe('Calendar', () => {
  it('should be defined', () => {
    expect(Calendar).toBeDefined()
    expect(typeof Calendar).toBe('function')
  })
})