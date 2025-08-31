import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSettings } from '../useSettings'

describe('useSettings', () => {
  it('should initialize without crashing', () => {
    const { result } = renderHook(() => useSettings())
    expect(result.current).toBeDefined()
  })
})