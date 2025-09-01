import { describe, it, expect } from 'vitest'
import { ShowerDetails } from '../ShowerDetails'

describe('ShowerDetails', () => {
  it('should be defined', () => {
    expect(ShowerDetails).toBeDefined()
    expect(typeof ShowerDetails).toBe('function')
  })
})