import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ShowerService, SettingsService, MetadataService, DatabaseService } from '../database-service';
import { db } from '../database';
import type { UserSettings } from '../../types';
import { DEFAULT_SETTINGS } from '../database-services/default-settings';

// Mock console methods to avoid noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('DatabaseService', () => {
  beforeEach(async () => {
    await DatabaseService.initialize();
    await DatabaseService.clearAllData();
  });

  afterEach(async () => {
    await DatabaseService.clearAllData();
  });

  describe('ShowerService', () => {
    it('should add a new shower entry', async () => {
      const testDate = new Date('2024-01-15T10:30:00Z');
      const shower = await ShowerService.addShower(testDate, 'Morning shower');

      expect(shower).toMatchObject({
        id: expect.any(String),
        timestamp: testDate,
        notes: 'Morning shower'
      });
    });

    it('should add a shower with current timestamp when no date provided', async () => {
      const beforeAdd = new Date();
      const shower = await ShowerService.addShower();
      const afterAdd = new Date();

      expect(shower.timestamp.getTime()).toBeGreaterThanOrEqual(beforeAdd.getTime());
      expect(shower.timestamp.getTime()).toBeLessThanOrEqual(afterAdd.getTime());
      expect(shower.id).toBeDefined();
    });

    it('should reject shower entries in the future', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);

      await expect(ShowerService.addShower(futureDate)).rejects.toThrow('Cannot record a shower in the future');
    });

    it('should retrieve all showers in reverse chronological order', async () => {
      const date1 = new Date('2024-01-15T10:00:00Z');
      const date2 = new Date('2024-01-16T10:00:00Z');
      const date3 = new Date('2024-01-14T10:00:00Z');

      await ShowerService.addShower(date1, 'First');
      await ShowerService.addShower(date2, 'Second');
      await ShowerService.addShower(date3, 'Third');

      const showers = await ShowerService.getAllShowers();

      expect(showers).toHaveLength(3);
      expect(showers[0].timestamp).toEqual(date2); // Most recent first
      expect(showers[1].timestamp).toEqual(date1);
      expect(showers[2].timestamp).toEqual(date3); // Oldest last
    });

    it('should retrieve showers by date range', async () => {
      const date1 = new Date('2024-01-15T10:00:00Z');
      const date2 = new Date('2024-01-16T10:00:00Z');
      const date3 = new Date('2024-01-17T10:00:00Z');

      await ShowerService.addShower(date1);
      await ShowerService.addShower(date2);
      await ShowerService.addShower(date3);

      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-16T23:59:59Z');
      
      const showers = await ShowerService.getShowersByDateRange(startDate, endDate);

      expect(showers).toHaveLength(2);
      expect(showers.some(s => s.timestamp.getTime() === date1.getTime())).toBe(true);
      expect(showers.some(s => s.timestamp.getTime() === date2.getTime())).toBe(true);
      expect(showers.some(s => s.timestamp.getTime() === date3.getTime())).toBe(false);
    });

    it('should get the last shower entry', async () => {
      const date1 = new Date('2024-01-15T10:00:00Z');
      const date2 = new Date('2024-01-16T10:00:00Z');

      await ShowerService.addShower(date1, 'First');
      await ShowerService.addShower(date2, 'Last');

      const lastShower = await ShowerService.getLastShower();

      expect(lastShower).toMatchObject({
        timestamp: date2,
        notes: 'Last'
      });
    });

    it('should return null when no showers exist', async () => {
      const lastShower = await ShowerService.getLastShower();
      expect(lastShower).toBeNull();
    });

    it('should delete a shower entry', async () => {
      const shower = await ShowerService.addShower(new Date(), 'To be deleted');
      
      await ShowerService.deleteShower(shower.id);
      
      const allShowers = await ShowerService.getAllShowers();
      expect(allShowers).toHaveLength(0);
    });

    it('should update a shower entry', async () => {
      const originalDate = new Date('2024-01-15T10:00:00Z');
      const shower = await ShowerService.addShower(originalDate, 'Original');
      
      const newDate = new Date('2024-01-15T11:00:00Z');
      await ShowerService.updateShower(shower.id, {
        timestamp: newDate,
        notes: 'Updated'
      });

      const updatedShower = await ShowerService.getLastShower();
      expect(updatedShower).toMatchObject({
        id: shower.id,
        timestamp: newDate,
        notes: 'Updated'
      });
    });

    it('should reject updating a shower into the future', async () => {
      const shower = await ShowerService.addShower(new Date(), 'Original');
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);

      await expect(ShowerService.updateShower(shower.id, { timestamp: futureDate })).rejects.toThrow(
        'Cannot record a shower in the future'
      );
    });
  });

  describe('SettingsService', () => {
    it('should return default settings when none exist', async () => {
      const settings = await SettingsService.getSettings();

      expect(settings).toMatchObject({
        theme: 'system',
        firstDayOfWeek: 0,
        notificationsEnabled: false,
        notificationThresholdDays: 3,
        showerGoals: {
          weekly: 4,
          monthly: 16
        },
        projectInfo: {
          githubRepo: 'https://github.com/D35P4C1T0/shower-tracker',
          author: 'D35P4C1T0'
        }
      });
    });

    it('should save and retrieve custom settings', async () => {
      const customSettings: UserSettings = {
        theme: 'dark',
        firstDayOfWeek: 1,
        notificationsEnabled: true,
        notificationThresholdDays: 5,
        showerGoals: {
          weekly: 5,
          monthly: 20
        },
        projectInfo: {
          githubRepo: 'https://github.com/custom/repo',
          author: 'Custom Author'
        }
      };

      await SettingsService.saveSettings(customSettings);
      const retrievedSettings = await SettingsService.getSettings();

      expect(retrievedSettings).toEqual(customSettings);
    });

    it('should update individual settings', async () => {
      // First set some initial settings
      await SettingsService.saveSettings({
        theme: 'light',
        firstDayOfWeek: 0,
        notificationsEnabled: false,
        notificationThresholdDays: 3,
        showerGoals: {
          weekly: 4,
          monthly: 16
        },
        projectInfo: {
          githubRepo: 'https://github.com/test/repo',
          author: 'Test Author'
        }
      });

      // Update just the theme
      await SettingsService.updateSetting('theme', 'dark');

      const settings = await SettingsService.getSettings();
      expect(settings.theme).toBe('dark');
      expect(settings.firstDayOfWeek).toBe(0); // Should remain unchanged
    });

    it('should replace existing settings when saving new ones', async () => {
      const settings1: UserSettings = {
        theme: 'light',
        firstDayOfWeek: 0,
        notificationsEnabled: false,
        notificationThresholdDays: 3,
        showerGoals: {
          weekly: 4,
          monthly: 16
        },
        projectInfo: {
          githubRepo: 'https://github.com/first/repo',
          author: 'First Author'
        }
      };

      const settings2: UserSettings = {
        theme: 'dark',
        firstDayOfWeek: 1,
        notificationsEnabled: true,
        notificationThresholdDays: 7,
        showerGoals: {
          weekly: 7,
          monthly: 28
        },
        projectInfo: {
          githubRepo: 'https://github.com/second/repo',
          author: 'Second Author'
        }
      };

      await SettingsService.saveSettings(settings1);
      await SettingsService.saveSettings(settings2);

      const retrievedSettings = await SettingsService.getSettings();
      expect(retrievedSettings).toEqual(settings2);

      // Verify only one settings record exists
      const allSettings = await db.settings.toArray();
      expect(allSettings).toHaveLength(1);
    });

    it('normalizes legacy project info values', async () => {
      await db.settings.add({
        theme: 'system',
        firstDayOfWeek: 0,
        notificationsEnabled: false,
        notificationThresholdDays: 3,
        githubRepo: 'https://github.com/user/shower-tracker',
        author: 'Shower Tracker App'
      });

      const settings = await SettingsService.getSettings();

      expect(settings.projectInfo).toEqual({
        githubRepo: 'https://github.com/D35P4C1T0/shower-tracker',
        author: 'D35P4C1T0'
      });
    });
  });

  describe('MetadataService', () => {
    it('should set and get metadata', async () => {
      await MetadataService.setMetadata('testKey', 'testValue');
      
      const value = await MetadataService.getMetadata('testKey');
      expect(value).toBe('testValue');
    });

    it('should return null for non-existent metadata', async () => {
      const value = await MetadataService.getMetadata('nonExistentKey');
      expect(value).toBeNull();
    });

    it('should update existing metadata', async () => {
      await MetadataService.setMetadata('updateKey', 'originalValue');
      await MetadataService.setMetadata('updateKey', 'updatedValue');
      
      const value = await MetadataService.getMetadata('updateKey');
      expect(value).toBe('updatedValue');

      // Verify only one record exists for this key
      const allMetadata = await db.metadata.where('key').equals('updateKey').toArray();
      expect(allMetadata).toHaveLength(1);
    });

    it('should delete metadata', async () => {
      await MetadataService.setMetadata('deleteKey', 'valueToDelete');
      await MetadataService.deleteMetadata('deleteKey');
      
      const value = await MetadataService.getMetadata('deleteKey');
      expect(value).toBeNull();
    });

    it('should handle last notification check', async () => {
      const testDate = new Date('2024-01-15T10:30:00Z');
      
      await MetadataService.setLastNotificationCheck(testDate);
      const retrievedDate = await MetadataService.getLastNotificationCheck();
      
      expect(retrievedDate).toEqual(testDate);
    });

    it('should return all metadata as a key-value map', async () => {
      await MetadataService.setMetadata('first', '1');
      await MetadataService.setMetadata('second', '2');

      const metadata = await MetadataService.getAllMetadata();
      expect(metadata).toEqual({ first: '1', second: '2' });
    });

    it('should return null for last notification check when not set', async () => {
      const date = await MetadataService.getLastNotificationCheck();
      expect(date).toBeNull();
    });
  });

  describe('DatabaseService', () => {
    it('should initialize database successfully', async () => {
      // Database should already be initialized in beforeEach
      expect(db.isOpen()).toBe(true);
    });

    it('should clear all data', async () => {
      // Add some test data
      await ShowerService.addShower(new Date());
      await SettingsService.saveSettings({
        theme: 'dark',
        firstDayOfWeek: 1,
        notificationsEnabled: true,
        notificationThresholdDays: 5,
        showerGoals: {
          weekly: 5,
          monthly: 20
        },
        projectInfo: {
          githubRepo: 'test',
          author: 'test'
        }
      });
      await MetadataService.setMetadata('test', 'value');

      // Clear all data
      await DatabaseService.clearAllData();

      // Verify all tables are empty
      const showers = await ShowerService.getAllShowers();
      const metadata = await MetadataService.getMetadata('test');
      
      expect(showers).toHaveLength(0);
      expect(metadata).toBeNull();
      
      // Settings should return defaults after clearing
      const settings = await SettingsService.getSettings();
      expect(settings.theme).toBe('system'); // Default value
    });

    it('should export all data', async () => {
      // Add test data
      const testDate = new Date('2024-01-15T10:00:00Z');
      await ShowerService.addShower(testDate, 'Test shower');
      
      const testSettings: UserSettings = {
        theme: 'dark',
        firstDayOfWeek: 1,
        notificationsEnabled: true,
        notificationThresholdDays: 5,
        showerGoals: {
          weekly: 5,
          monthly: 20
        },
        projectInfo: {
          githubRepo: 'https://github.com/test/repo',
          author: 'Test Author'
        }
      };
      await SettingsService.saveSettings(testSettings);
      
      await MetadataService.setMetadata('testKey', 'testValue');

      // Export data
      const exportedData = await DatabaseService.exportData();

      expect(exportedData.schemaVersion).toBe(1);
      expect(new Date(exportedData.exportedAt).toString()).not.toBe('Invalid Date');
      expect(exportedData.showers).toHaveLength(1);
      expect(exportedData.showers[0]).toMatchObject({
        timestamp: testDate,
        notes: 'Test shower'
      });
      
      expect(exportedData.settings).toEqual({
        theme: testSettings.theme,
        firstDayOfWeek: testSettings.firstDayOfWeek,
        notificationsEnabled: testSettings.notificationsEnabled,
        notificationThresholdDays: testSettings.notificationThresholdDays,
        showerGoals: testSettings.showerGoals
      });
      expect(exportedData.settings).not.toHaveProperty('projectInfo');
      expect(exportedData.metadata.testKey).toBe('testValue');
    });

    it('should import exported shower data and replace existing data', async () => {
      await ShowerService.addShower(new Date('2024-01-01T10:00:00Z'), 'Old data');

      const result = await DatabaseService.importData({
        showers: [
          { timestamp: '2024-02-01T08:00:00.000Z', notes: 'Morning' },
          { timestamp: '2024-02-02T20:30:00.000Z' }
        ],
        settings: {
          theme: 'dark',
          firstDayOfWeek: 1,
          notificationsEnabled: true,
          notificationThresholdDays: 4,
          showerGoals: {
            weekly: 6,
            monthly: 24
          },
          projectInfo: {
            githubRepo: 'https://github.com/import/repo',
            author: 'Import Author'
          }
        },
        metadata: {
          testKey: 'imported'
        }
      });

      const showers = await ShowerService.getAllShowers();
      const settings = await SettingsService.getSettings();
      const metadata = await MetadataService.getAllMetadata();

      expect(result).toEqual({ showersImported: 2, metadataImported: 1 });
      expect(showers).toHaveLength(2);
      expect(showers[0].timestamp).toEqual(new Date('2024-02-02T20:30:00.000Z'));
      expect(showers[1]).toMatchObject({
        timestamp: new Date('2024-02-01T08:00:00.000Z'),
        notes: 'Morning'
      });
      expect(settings.theme).toBe('dark');
      expect(settings.showerGoals).toEqual({ weekly: 6, monthly: 24 });
      expect(settings.projectInfo).toEqual(DEFAULT_SETTINGS.projectInfo);
      expect(metadata.testKey).toBe('imported');
    });

    it('should reject invalid imports before clearing existing data', async () => {
      await ShowerService.addShower(new Date('2024-01-01T10:00:00Z'), 'Keep me');

      await expect(DatabaseService.importData({
        showers: [
          { timestamp: new Date(Date.now() + 60 * 60 * 1000).toISOString() }
        ],
        metadata: {}
      })).rejects.toThrow('Cannot record a shower in the future');

      const showers = await ShowerService.getAllShowers();
      expect(showers).toHaveLength(1);
      expect(showers[0].notes).toBe('Keep me');
    });

    it('should import data from a JSON string', async () => {
      await DatabaseService.importData(JSON.stringify({
        showers: [{ timestamp: '2024-03-01T12:00:00.000Z' }],
        metadata: {}
      }));

      const showers = await ShowerService.getAllShowers();
      expect(showers).toHaveLength(1);
      expect(showers[0].timestamp).toEqual(new Date('2024-03-01T12:00:00.000Z'));
    });
  });
});
