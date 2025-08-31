import { describe, it, expect } from 'vitest';
import {
  getFirstDayOfMonth,
  getLastDayOfMonth,
  getDaysInMonth,
  getFirstDayOfWeek,
  generateCalendarGrid,
  getMonthName,
  getYear,
  getPreviousMonth,
  getNextMonth,
  isSameDay,
  isToday,
  formatDate,
  getDayNames
} from '../calendar-utils';

describe('calendar-utils', () => {
  const testDate = new Date(2024, 0, 15); // January 15, 2024

  describe('getFirstDayOfMonth', () => {
    it('should return the first day of the month', () => {
      const result = getFirstDayOfMonth(testDate);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2024);
    });
  });

  describe('getLastDayOfMonth', () => {
    it('should return the last day of the month', () => {
      const result = getLastDayOfMonth(testDate);
      expect(result.getDate()).toBe(31);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2024);
    });

    it('should handle February in leap year', () => {
      const febDate = new Date(2024, 1, 15); // February 2024 (leap year)
      const result = getLastDayOfMonth(febDate);
      expect(result.getDate()).toBe(29);
    });

    it('should handle February in non-leap year', () => {
      const febDate = new Date(2023, 1, 15); // February 2023 (non-leap year)
      const result = getLastDayOfMonth(febDate);
      expect(result.getDate()).toBe(28);
    });
  });

  describe('getDaysInMonth', () => {
    it('should return correct number of days for January', () => {
      expect(getDaysInMonth(testDate)).toBe(31);
    });

    it('should return correct number of days for February in leap year', () => {
      const febDate = new Date(2024, 1, 15);
      expect(getDaysInMonth(febDate)).toBe(29);
    });

    it('should return correct number of days for February in non-leap year', () => {
      const febDate = new Date(2023, 1, 15);
      expect(getDaysInMonth(febDate)).toBe(28);
    });
  });

  describe('getFirstDayOfWeek', () => {
    it('should return the day of week for first day of month', () => {
      // January 1, 2024 was a Monday (1)
      const result = getFirstDayOfWeek(testDate);
      expect(result).toBe(1);
    });
  });

  describe('generateCalendarGrid', () => {
    it('should generate a 42-cell grid', () => {
      const grid = generateCalendarGrid(testDate);
      expect(grid).toHaveLength(42);
    });

    it('should start with correct number of null cells for Sunday start', () => {
      const grid = generateCalendarGrid(testDate, 0); // Sunday start
      // January 1, 2024 is Monday, so we need 1 null cell at start for Sunday start
      expect(grid[0]).toBeNull();
      expect(grid[1]).toEqual(new Date(2024, 0, 1));
    });

    it('should start with correct number of null cells for Monday start', () => {
      const grid = generateCalendarGrid(testDate, 1); // Monday start
      // January 1, 2024 is Monday, so no null cells needed at start
      expect(grid[0]).toEqual(new Date(2024, 0, 1));
    });

    it('should contain all days of the month', () => {
      const grid = generateCalendarGrid(testDate);
      const datesInGrid = grid.filter(date => date !== null) as Date[];
      const daysInMonth = getDaysInMonth(testDate);
      
      // Should have exactly the number of days in the month
      const monthDates = datesInGrid.filter(date => date.getMonth() === testDate.getMonth());
      expect(monthDates).toHaveLength(daysInMonth);
    });
  });

  describe('getMonthName', () => {
    it('should return correct month name', () => {
      expect(getMonthName(testDate)).toBe('January');
      expect(getMonthName(new Date(2024, 5, 15))).toBe('June');
    });
  });

  describe('getYear', () => {
    it('should return correct year', () => {
      expect(getYear(testDate)).toBe(2024);
    });
  });

  describe('getPreviousMonth', () => {
    it('should return previous month', () => {
      const result = getPreviousMonth(testDate);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getFullYear()).toBe(2023);
    });

    it('should handle year boundary', () => {
      const janDate = new Date(2024, 0, 15);
      const result = getPreviousMonth(janDate);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getFullYear()).toBe(2023);
    });
  });

  describe('getNextMonth', () => {
    it('should return next month', () => {
      const result = getNextMonth(testDate);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getFullYear()).toBe(2024);
    });

    it('should handle year boundary', () => {
      const decDate = new Date(2024, 11, 15);
      const result = getNextMonth(decDate);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2025);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date(2024, 0, 15, 10, 30);
      const date2 = new Date(2024, 0, 15, 14, 45);
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 0, 16);
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('should return false for different day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const result = formatDate(testDate);
      expect(result).toContain('Monday');
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('getDayNames', () => {
    it('should return day names starting with Sunday', () => {
      const dayNames = getDayNames(0);
      expect(dayNames).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    });

    it('should return day names starting with Monday', () => {
      const dayNames = getDayNames(1);
      expect(dayNames).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    });
  });
});