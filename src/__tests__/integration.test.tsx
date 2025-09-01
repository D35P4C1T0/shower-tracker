import { describe, it, expect } from 'vitest'
import App from '../App'

describe('Integration Tests', () => {
  it('App component should be defined', () => {
    expect(App).toBeDefined()
    expect(typeof App).toBe('function')
  })
})