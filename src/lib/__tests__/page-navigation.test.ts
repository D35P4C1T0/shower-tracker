import { describe, expect, it } from 'vitest'
import { getPageForSwipe, getPageFromSearch, getUrlForPage } from '../page-navigation'

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

  it('reads valid pages from query params', () => {
    expect(getPageFromSearch('?page=calendar')).toBe('calendar')
    expect(getPageFromSearch('?page=settings')).toBe('settings')
    expect(getPageFromSearch('?page=missing')).toBe('home')
  })

  it('builds canonical URLs for pages', () => {
    expect(getUrlForPage('calendar', 'https://example.com/app?foo=bar#today')).toBe('/app?foo=bar&page=calendar#today')
    expect(getUrlForPage('home', 'https://example.com/app?foo=bar&page=settings#today')).toBe('/app?foo=bar#today')
  })
})
