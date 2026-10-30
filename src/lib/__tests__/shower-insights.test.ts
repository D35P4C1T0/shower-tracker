import { describe, expect, it } from 'vitest'
import { calculateShowerInsights } from '../shower-insights'
import { getCalendarDayNumber } from '../calendar-utils'

describe('calendar day statistics', () => {
  it.each([[2, 29, 30], [9, 25, 26]])('keeps streaks across clock changes in month %i', (month, first, second) => {
    const showers = [first, second].map((day, index) => ({
      id: String(index), timestamp: new Date(2026, month, day, 12)
    }))
    const now = new Date(2026, month, second, 13)
    expect(new Date(2026, month, second).getTime() - new Date(2026, month, first).getTime()).not.toBe(86_400_000)
    expect(getCalendarDayNumber(now) - getCalendarDayNumber(showers[0].timestamp)).toBe(1)
    expect(calculateShowerInsights(showers, now)).toMatchObject({
      currentStreak: 2, longestStreak: 2, averageIntervalDays: 1
    })
    expect(calculateShowerInsights(showers, new Date(2026, month, second + 2, 12)).currentStreak).toBe(0)
  })
})
