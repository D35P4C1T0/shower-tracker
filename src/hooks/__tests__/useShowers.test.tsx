import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useShowers } from '../useShowers'

describe('useShowers', () => {
  it('should initialize without crashing', () => {
    const { result } = renderHook(() => useShowers())
    expect(result.current).toBeDefined()
  })
})