/**
 * Calendar utility functions for the shower tracker
 */

/**
 * Get the first day of the month
 */
export function getFirstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the last day of the month
 */
export function getLastDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(date: Date): number {
  return getLastDayOfMonth(date).getDate();
}

/**
 * Get the day of the week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
 */
export function getFirstDayOfWeek(date: Date): number {
  return getFirstDayOfMonth(date).getDay();
}

/**
 * Generate calendar grid for a given month
 * @param date - Date in the month to generate calendar for
 * @param firstDayOfWeek - 0 for Sunday, 1 for Monday
 */
export function generateCalendarGrid(date: Date, firstDayOfWeek: 0 | 1 = 0): (Date | null)[] {
  const daysInMonth = getDaysInMonth(date);
  const startDayOfWeek = getFirstDayOfWeek(date);
  
  // Calculate how many empty cells we need at the beginning
  let emptyCellsAtStart = startDayOfWeek - firstDayOfWeek;
  if (emptyCellsAtStart < 0) {
    emptyCellsAtStart += 7;
  }
  
  const grid: (Date | null)[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < emptyCellsAtStart; i++) {
    grid.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    grid.push(new Date(date.getFullYear(), date.getMonth(), day));
  }
  
  // Fill remaining cells to complete the grid (6 rows × 7 days = 42 cells)
  while (grid.length < 42) {
    grid.push(null);
  }
  
  return grid;
}

/**
 * Get month name
 */
export function getMonthName(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long' });
}

/**
 * Get year
 */
export function getYear(date: Date): number {
  return date.getFullYear();
}

/**
 * Navigate to previous month
 */
export function getPreviousMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

/**
 * Navigate to next month
 */
export function getNextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get day names based on first day of week preference
 */
export function getDayNames(firstDayOfWeek: 0 | 1 = 0): string[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  if (firstDayOfWeek === 1) {
    // Move Sunday to the end
    return [...dayNames.slice(1), dayNames[0]];
  }
  
  return dayNames;
}