import { describe, it, expect } from 'vitest'
import { ThemeProvider } from '../theme-provider'

describe('ThemeProvider', () => {
  it('should be defined', () => {
    expect(ThemeProvider).toBeDefined()
    expect(typeof ThemeProvider).toBe('function')
  })
})