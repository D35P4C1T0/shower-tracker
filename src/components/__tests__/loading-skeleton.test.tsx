import { describe, it, expect } from 'vitest'
import { Skeleton, CardSkeleton, CalendarSkeleton, SettingsSkeleton, TimeSkeleton } from '../loading-skeleton'

describe('LoadingSkeleton', () => {
  it('should export Skeleton component', () => {
    expect(Skeleton).toBeDefined()
    expect(typeof Skeleton).toBe('function')
  })

  it('should export CardSkeleton component', () => {
    expect(CardSkeleton).toBeDefined()
    expect(typeof CardSkeleton).toBe('function')
  })

  it('should export CalendarSkeleton component', () => {
    expect(CalendarSkeleton).toBeDefined()
    expect(typeof CalendarSkeleton).toBe('function')
  })

  it('should export SettingsSkeleton component', () => {
    expect(SettingsSkeleton).toBeDefined()
    expect(typeof SettingsSkeleton).toBe('function')
  })

  it('should export TimeSkeleton component', () => {
    expect(TimeSkeleton).toBeDefined()
    expect(typeof TimeSkeleton).toBe('function')
  })
})