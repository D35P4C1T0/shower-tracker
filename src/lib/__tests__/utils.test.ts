import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getTimeDifference, formatTimeDifference, formatTimeSince } from '../utils'

describe('Time Utilities', () => {
  describe('getTimeDifference', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.restoreAllMocks()
    })
    it('should calculate time difference correctly', () => {
      const from = new Date('2024-01-01T10:00:00Z')
      const to = new Date('2024-01-01T11:00:00Z')
      
      const diff = getTimeDifference(from, to)
      expect(diff).toBe(60 * 60 * 1000) // 1 hour in milliseconds
    })

    it('should use current time as default "to" parameter', () => {
      const from = new Date('2024-01-01T10:00:00Z')
      const mockNow = new Date('2024-01-01T11:00:00Z')
      
      vi.setSystemTime(mockNow)

      const diff = getTimeDifference(from)
      expect(diff).toBe(60 * 60 * 1000) // 1 hour in milliseconds
    })
  })

  describe('formatTimeDifference', () => {
    it('should format seconds correctly', () => {
      expect(formatTimeDifference(1000)).toBe('1 second')
      expect(formatTimeDifference(30000)).toBe('30 seconds')
    })

    it('should format minutes correctly', () => {
      expect(formatTimeDifference(60 * 1000)).toBe('1 minute')
      expect(formatTimeDifference(5 * 60 * 1000)).toBe('5 minutes')
    })

    it('should format hours correctly', () => {
      expect(formatTimeDifference(60 * 60 * 1000)).toBe('1 hour')
      expect(formatTimeDifference(2 * 60 * 60 * 1000)).toBe('2 hours')
    })

    it('should format days correctly', () => {
      expect(formatTimeDifference(24 * 60 * 60 * 1000)).toBe('1 day')
      expect(formatTimeDifference(3 * 24 * 60 * 60 * 1000)).toBe('3 days')
    })

    it('should format weeks correctly', () => {
      expect(formatTimeDifference(7 * 24 * 60 * 60 * 1000)).toBe('1 week')
      expect(formatTimeDifference(2 * 7 * 24 * 60 * 60 * 1000)).toBe('2 weeks')
    })

    it('should prioritize larger units', () => {
      // 1 week + 1 day should show as "1 week"
      expect(formatTimeDifference(8 * 24 * 60 * 60 * 1000)).toBe('1 week')
      
      // 1 day + 1 hour should show as "1 day"
      expect(formatTimeDifference(25 * 60 * 60 * 1000)).toBe('1 day')
      
      // 1 hour + 1 minute should show as "1 hour"
      expect(formatTimeDifference(61 * 60 * 1000)).toBe('1 hour')
      
      // 1 minute + 1 second should show as "1 minute"
      expect(formatTimeDifference(61 * 1000)).toBe('1 minute')
    })

    it('should handle zero and negative values', () => {
      expect(formatTimeDifference(0)).toBe('0 seconds')
      expect(formatTimeDifference(-1000)).toBe('-1 second')
    })
  })

  describe('formatTimeSince', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    it('should format time since a date correctly', () => {
      const mockNow = new Date('2024-01-01T11:00:00Z')
      const pastDate = new Date('2024-01-01T10:00:00Z')
      
      vi.setSystemTime(mockNow)

      const result = formatTimeSince(pastDate)
      expect(result).toBe('1 hour ago')
    })

    it('should handle various time differences', () => {
      const testCases = [
        { mockTime: '2024-01-01T10:00:30Z', pastTime: '2024-01-01T10:00:00Z', expected: '30 seconds ago' },
        { mockTime: '2024-01-01T10:05:00Z', pastTime: '2024-01-01T10:00:00Z', expected: '5 minutes ago' },
        { mockTime: '2024-01-01T12:00:00Z', pastTime: '2024-01-01T10:00:00Z', expected: '2 hours ago' },
        { mockTime: '2024-01-03T10:00:00Z', pastTime: '2024-01-01T10:00:00Z', expected: '2 days ago' },
        { mockTime: '2024-01-15T10:00:00Z', pastTime: '2024-01-01T10:00:00Z', expected: '2 weeks ago' }
      ]

      for (const testCase of testCases) {
        const mockNow = new Date(testCase.mockTime)
        const pastDate = new Date(testCase.pastTime)
        
        vi.setSystemTime(mockNow)
        
        const result = formatTimeSince(pastDate)
        expect(result).toBe(testCase.expected)
      }
    })
  })
})