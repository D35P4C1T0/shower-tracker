import { describe, it, expect } from 'vitest'
import { HomePage } from '../HomePage'

describe('HomePage', () => {
  it('should be defined', () => {
    expect(HomePage).toBeDefined()
    expect(typeof HomePage).toBe('function')
  })
})