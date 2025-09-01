import { describe, it, expect } from 'vitest'
import { ErrorBoundary } from '../error-boundary'

describe('ErrorBoundary', () => {
  it('should be defined', () => {
    expect(ErrorBoundary).toBeDefined()
    expect(typeof ErrorBoundary).toBe('function')
  })
})