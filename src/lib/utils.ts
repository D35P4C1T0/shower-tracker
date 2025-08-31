import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate the time difference in milliseconds between two dates
 */
export function getTimeDifference(from: Date, to: Date = new Date()): number {
  return to.getTime() - from.getTime()
}

/**
 * Format a time difference in milliseconds to a human-readable string
 */
export function formatTimeDifference(milliseconds: number): string {
  const isNegative = milliseconds < 0
  const absMilliseconds = Math.abs(milliseconds)
  
  const seconds = Math.floor(absMilliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)

  let result = ''
  if (weeks > 0) {
    result = `${weeks} week${weeks > 1 ? 's' : ''}`
  } else if (days > 0) {
    result = `${days} day${days > 1 ? 's' : ''}`
  } else if (hours > 0) {
    result = `${hours} hour${hours > 1 ? 's' : ''}`
  } else if (minutes > 0) {
    result = `${minutes} minute${minutes > 1 ? 's' : ''}`
  } else {
    result = `${seconds} second${seconds !== 1 ? 's' : ''}`
  }

  return isNegative ? `-${result}` : result
}

/**
 * Format time since a specific date to a human-readable string
 */
export function formatTimeSince(date: Date): string {
  const timeDiff = getTimeDifference(date)
  return `${formatTimeDifference(timeDiff)} ago`
}