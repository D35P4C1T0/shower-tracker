import { describe, it, expect } from 'vitest'
import { NotificationBanner } from '../notification-banner'

describe('NotificationBanner', () => {
  it('should be defined', () => {
    expect(NotificationBanner).toBeDefined()
    expect(typeof NotificationBanner).toBe('function')
  })
})