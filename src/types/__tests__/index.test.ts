import { describe, it, expect } from 'vitest';
import type { ShowerEntry, UserSettings, AppState, Theme } from '../index';

describe('Type Definitions', () => {
  describe('ShowerEntry', () => {
    it('should have correct structure', () => {
      const showerEntry: ShowerEntry = {
        id: '1',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        notes: 'Morning shower'
      };

      expect(showerEntry.id).toBe('1');
      expect(showerEntry.timestamp).toBeInstanceOf(Date);
      expect(showerEntry.notes).toBe('Morning shower');
    });

    it('should allow optional notes', () => {
      const showerEntry: ShowerEntry = {
        id: '2',
        timestamp: new Date()
      };

      expect(showerEntry.notes).toBeUndefined();
    });
  });

  describe('UserSettings', () => {
    it('should have correct structure', () => {
      const settings: UserSettings = {
        theme: 'dark',
        firstDayOfWeek: 1,
        notificationsEnabled: true,
        notificationThresholdDays: 5,
        projectInfo: {
          githubRepo: 'https://github.com/test/repo',
          author: 'Test Author'
        }
      };

      expect(settings.theme).toBe('dark');
      expect(settings.firstDayOfWeek).toBe(1);
      expect(settings.notificationsEnabled).toBe(true);
      expect(settings.notificationThresholdDays).toBe(5);
      expect(settings.projectInfo.githubRepo).toBe('https://github.com/test/repo');
      expect(settings.projectInfo.author).toBe('Test Author');
    });

    it('should enforce theme type constraints', () => {
      const lightTheme: UserSettings['theme'] = 'light';
      const darkTheme: UserSettings['theme'] = 'dark';
      const systemTheme: UserSettings['theme'] = 'system';

      expect(['light', 'dark', 'system']).toContain(lightTheme);
      expect(['light', 'dark', 'system']).toContain(darkTheme);
      expect(['light', 'dark', 'system']).toContain(systemTheme);
    });

    it('should enforce firstDayOfWeek constraints', () => {
      const sunday: UserSettings['firstDayOfWeek'] = 0;
      const monday: UserSettings['firstDayOfWeek'] = 1;

      expect([0, 1]).toContain(sunday);
      expect([0, 1]).toContain(monday);
    });
  });

  describe('AppState', () => {
    it('should have correct structure', () => {
      const appState: AppState = {
        showers: [
          {
            id: '1',
            timestamp: new Date('2024-01-15T10:30:00Z'),
            notes: 'Test shower'
          }
        ],
        settings: {
          theme: 'system',
          firstDayOfWeek: 0,
          notificationsEnabled: false,
          notificationThresholdDays: 3,
          projectInfo: {
            githubRepo: 'https://github.com/test/repo',
            author: 'Test Author'
          }
        },
        lastNotificationCheck: new Date('2024-01-14T10:00:00Z')
      };

      expect(appState.showers).toHaveLength(1);
      expect(appState.settings.theme).toBe('system');
      expect(appState.lastNotificationCheck).toBeInstanceOf(Date);
    });

    it('should allow null lastNotificationCheck', () => {
      const appState: AppState = {
        showers: [],
        settings: {
          theme: 'system',
          firstDayOfWeek: 0,
          notificationsEnabled: false,
          notificationThresholdDays: 3,
          projectInfo: {
            githubRepo: 'https://github.com/test/repo',
            author: 'Test Author'
          }
        },
        lastNotificationCheck: null
      };

      expect(appState.lastNotificationCheck).toBeNull();
    });
  });

  describe('Theme', () => {
    it('should be a valid theme type', () => {
      const lightTheme: Theme = 'light';
      const darkTheme: Theme = 'dark';
      const systemTheme: Theme = 'system';

      expect(['light', 'dark', 'system']).toContain(lightTheme);
      expect(['light', 'dark', 'system']).toContain(darkTheme);
      expect(['light', 'dark', 'system']).toContain(systemTheme);
    });
  });
});