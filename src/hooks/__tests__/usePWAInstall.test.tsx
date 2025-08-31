import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePWAInstall } from '../usePWAInstall'

describe('usePWAInstall', () => {
  it('should initialize without crashing', () => {
    const { result } = renderHook(() => usePWAInstall())
    expect(result.current).toBeDefined()
  })
})