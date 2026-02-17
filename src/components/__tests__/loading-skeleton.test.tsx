import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton, CardSkeleton, CalendarSkeleton, SettingsSkeleton, TimeSkeleton } from '../loading-skeleton'

describe('LoadingSkeleton', () => {
  it('renders base skeleton class', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstElementChild).toHaveClass('animate-pulse')
  })

  it('renders card skeleton blocks', () => {
    const { container } = render(<CardSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders calendar skeleton grid', () => {
    const { container } = render(<CalendarSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(40)
  })

  it('renders settings skeleton cards', () => {
    const { container } = render(<SettingsSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders time skeleton placeholder', () => {
    const { container } = render(<TimeSkeleton />)
    expect(container.querySelectorAll('.animate-pulse').length).toBe(2)
  })
})
