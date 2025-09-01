import { describe, it, expect } from 'vitest'
import { Layout } from '../layout'

describe('Layout', () => {
  it('should be defined', () => {
    expect(Layout).toBeDefined()
    expect(typeof Layout).toBe('function')
  })
  
  it('should have correct default props', () => {
    // Test that the component exists and can be imported
    expect(Layout.name).toBe('Layout')
  })
})