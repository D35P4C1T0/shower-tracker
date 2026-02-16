import { describe, expect, it } from 'vitest'
import { getPageForSwipe } from '../page-navigation'

describe('page navigation', () => {
  it('moves forward when swiping left', () => {
    expect(getPageForSwipe('home', 'left')).toBe('calendar')
    expect(getPageForSwipe('calendar', 'left')).toBe('settings')
  })

  it('moves backward when swiping right', () => {
    expect(getPageForSwipe('settings', 'right')).toBe('calendar')
    expect(getPageForSwipe('calendar', 'right')).toBe('home')
  })

  it('stops at edges', () => {
    expect(getPageForSwipe('home', 'right')).toBeNull()
    expect(getPageForSwipe('settings', 'left')).toBeNull()
  })
})
