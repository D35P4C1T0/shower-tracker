import { VALIDATION_CONSTANTS } from './constants';

export function validateShowerTimestamp(timestamp: Date, now: Date = new Date()): void {
  if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
    throw new Error('Invalid timestamp provided');
  }

  if (timestamp < VALIDATION_CONSTANTS.MIN_DATE || timestamp > VALIDATION_CONSTANTS.MAX_DATE) {
    throw new Error('Timestamp is outside valid date range');
  }

  if (timestamp.getTime() > now.getTime()) {
    throw new Error('Cannot record a shower in the future');
  }
}

export function validateShowerNotes(notes?: string): void {
  if (notes !== undefined && notes.length > VALIDATION_CONSTANTS.MAX_NOTES_LENGTH) {
    throw new Error(`Notes exceed maximum length of ${VALIDATION_CONSTANTS.MAX_NOTES_LENGTH} characters`);
  }
}
