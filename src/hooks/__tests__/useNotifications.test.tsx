import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNotifications } from '../useNotifications'

describe('useNotifications', () => {
  it('should initialize without crashing', () => {
    const { result } = renderHook(() => useNotifications())
    expect(result.current).toBeDefined()
  })
})