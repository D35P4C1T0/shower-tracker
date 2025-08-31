import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePWA } from '../usePWA'

describe('usePWA', () => {
  it('should initialize without crashing', () => {
    const { result } = renderHook(() => usePWA())
    expect(result.current).toBeDefined()
  })
})