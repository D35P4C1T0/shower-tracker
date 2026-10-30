import type { ShowerEntry } from '@/types'

import { getCalendarDayNumber } from './calendar-utils'

export interface ShowerInsights {
  averageIntervalDays: number | null
  currentStreak: number
  longestStreak: number
  favoriteDay: string | null
}

export function calculateShowerInsights(showers: ShowerEntry[], now = new Date()): ShowerInsights {
  const dates = showers
    .map(shower => new Date(shower.timestamp))
    .filter(date => Number.isFinite(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())

  const uniqueDays = [...new Set(dates.map(getCalendarDayNumber))]

  const intervals = uniqueDays.slice(1).map((day, index) => day - uniqueDays[index])
  const averageIntervalDays = intervals.length
    ? intervals.reduce((sum, value) => sum + value, 0) / intervals.length
    : null

  let longestStreak = uniqueDays.length ? 1 : 0
  let running = longestStreak
  for (let index = 1; index < uniqueDays.length; index += 1) {
    running = uniqueDays[index] - uniqueDays[index - 1] === 1 ? running + 1 : 1
    longestStreak = Math.max(longestStreak, running)
  }

  let currentStreak = 0
  if (uniqueDays.length) {
    const gap = getCalendarDayNumber(now) - uniqueDays.at(-1)!
    if (gap <= 1) {
      currentStreak = 1
      for (let index = uniqueDays.length - 1; index > 0; index -= 1) {
        if (uniqueDays[index] - uniqueDays[index - 1] !== 1) break
        currentStreak += 1
      }
    }
  }

  const dayCounts = dates.reduce<number[]>((counts, date) => {
    counts[date.getDay()] += 1
    return counts
  }, Array(7).fill(0))
  const maxCount = Math.max(...dayCounts)
  const favoriteDay = maxCount > 0
    ? new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date(2024, 0, 7 + dayCounts.indexOf(maxCount)))
    : null

  return { averageIntervalDays, currentStreak, longestStreak, favoriteDay }
}
