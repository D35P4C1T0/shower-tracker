// Application constants

// Notification timing constants
export const NOTIFICATION_CONSTANTS = {
  CHECK_INTERVAL_MS: 30 * 60 * 1000, // 30 minutes
  MIN_HOURS_BETWEEN_NOTIFICATIONS: 12,
  INITIAL_CHECK_DELAY_MS: 2000, // 2 seconds delay on startup
} as const;

// Calendar constants
export const CALENDAR_CONSTANTS = {
  DEBOUNCE_MS: 150, // Debounce time for rapid calendar navigation
} as const;

// Input validation constants
export const VALIDATION_CONSTANTS = {
  MAX_NOTES_LENGTH: 1000,
  MIN_DATE: new Date('1900-01-01'),
  MAX_DATE: new Date('2100-12-31'),
} as const;

// Storage constants
export const STORAGE_CONSTANTS = {
  MAX_ITEMS_WARNING: 10000, // Warn if approaching storage limits
} as const;

