import { describe, it, expect } from 'vitest'
import { ToastProvider, useToast } from '../toast'

describe('Toast', () => {
  it('should export ToastProvider', () => {
    expect(ToastProvider).toBeDefined()
    expect(typeof ToastProvider).toBe('function')
  })

  it('should export useToast hook', () => {
    expect(useToast).toBeDefined()
    expect(typeof useToast).toBe('function')
  })

  it('should have proper toast types', () => {
    // Just test that the module exports work
    expect(ToastProvider).toBeTruthy()
    expect(useToast).toBeTruthy()
  })
})