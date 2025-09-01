import { describe, it, expect } from 'vitest'
import { AppProvider } from '../AppContext'

describe('AppContext', () => {
  it('should be defined', () => {
    expect(AppProvider).toBeDefined()
    expect(typeof AppProvider).toBe('function')
  })
})