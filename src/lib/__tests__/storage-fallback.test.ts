import {
  FallbackShowerService,
  FallbackSettingsService,
  FallbackMetadataService,
  StorageChecker
} from '../storage-fallback';
import type { UserSettings } from '../../types';

import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock indexedDB
Object.defineProperty(window, 'indexedDB', {
  value: {
    open: vi.fn(),
    deleteDatabase: vi.fn(),
  },
});

describe('StorageChecker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('detects localStorage availability', () => {
    expect(StorageChecker.isLocalStorageAvailable()).toBe(true);
  });

  it('detects when localStorage is not available', () => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn(() => {
      throw new Error('localStorage not available');
    });

    expect(StorageChecker.isLocalStorageAvailable()).toBe(false);

    localStorage.setItem = originalSetItem;
  });

  it('returns correct storage type when localStorage is available', async () => {
    const storage = await StorageChecker.getAvailableStorage();
    expect(['indexeddb', 'localstorage']).toContain(storage);
  });
});

describe('FallbackShowerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('adds a shower entry', async () => {
    const timestamp = new Date('2023-01-01T10:00:00Z');
    const notes = 'Test shower';

    const shower = await FallbackShowerService.addShower(timestamp, notes);

    expect(shower).toMatchObject({
      timestamp,
      notes,
    });
    expect(shower.id).toBeDefined();
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('rejects shower entries in the future', async () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);

    await expect(FallbackShowerService.addShower(futureDate)).rejects.toThrow(
      'Cannot record a shower in the future'
    );
  });

  it('gets all showers', async () => {
    await FallbackShowerService.addShower(new Date('2023-01-01T10:00:00Z'));
    await FallbackShowerService.addShower(new Date('2023-01-02T10:00:00Z'));

    const showers = await FallbackShowerService.getAllShowers();

    expect(showers).toHaveLength(2);
    expect(showers[0].timestamp).toEqual(new Date('2023-01-02T10:00:00Z')); // Most recent first
    expect(showers[1].timestamp).toEqual(new Date('2023-01-01T10:00:00Z'));
  });

  it('gets showers by date range', async () => {
    await FallbackShowerService.addShower(new Date('2023-01-01T10:00:00Z'));
    await FallbackShowerService.addShower(new Date('2023-01-15T10:00:00Z'));
    await FallbackShowerService.addShower(new Date('2023-02-01T10:00:00Z'));

    const showers = await FallbackShowerService.getShowersByDateRange(
      new Date('2023-01-01T00:00:00Z'),
      new Date('2023-01-31T23:59:59Z')
    );

    expect(showers).toHaveLength(2);
  });

  it('gets last shower', async () => {
    await FallbackShowerService.addShower(new Date('2023-01-01T10:00:00Z'));
    const lastShower = await FallbackShowerService.addShower(new Date('2023-01-02T10:00:00Z'));

    const result = await FallbackShowerService.getLastShower();

    expect(result?.id).toBe(lastShower.id);
  });

  it('returns null when no showers exist', async () => {
    const result = await FallbackShowerService.getLastShower();
    expect(result).toBeNull();
  });

  it('deletes a shower', async () => {
    const shower = await FallbackShowerService.addShower(new Date());
    
    await FallbackShowerService.deleteShower(shower.id);
    
    const showers = await FallbackShowerService.getAllShowers();
    expect(showers).toHaveLength(0);
  });

  it('updates a shower', async () => {
    const shower = await FallbackShowerService.addShower(new Date());
    const newNotes = 'Updated notes';
    
    await FallbackShowerService.updateShower(shower.id, { notes: newNotes });
    
    const showers = await FallbackShowerService.getAllShowers();
    expect(showers[0].notes).toBe(newNotes);
  });

  it('rejects updating a shower into the future', async () => {
    const shower = await FallbackShowerService.addShower(new Date());
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);

    await expect(FallbackShowerService.updateShower(shower.id, { timestamp: futureDate })).rejects.toThrow(
      'Cannot record a shower in the future'
    );
  });

  it('clears all showers', async () => {
    await FallbackShowerService.addShower(new Date());
    await FallbackShowerService.clearAllShowers();

    const showers = await FallbackShowerService.getAllShowers();
    expect(showers).toEqual([]);
  });

  it('handles corrupted data gracefully', async () => {
    localStorageMock.setItem('shower-tracker-showers', 'invalid json');
    
    const showers = await FallbackShowerService.getAllShowers();
    expect(showers).toEqual([]);
  });
});

describe('FallbackSettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('returns default settings when none exist', async () => {
    const settings = await FallbackSettingsService.getSettings();
    
    expect(settings.theme).toBe('system');
    expect(settings.firstDayOfWeek).toBe(0);
    expect(settings.notificationsEnabled).toBe(false);
  });

  it('saves and retrieves settings', async () => {
    const newSettings: UserSettings = {
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

    await FallbackSettingsService.saveSettings(newSettings);
    const retrieved = await FallbackSettingsService.getSettings();

    expect(retrieved).toEqual(newSettings);
  });

  it('updates a single setting', async () => {
    await FallbackSettingsService.updateSetting('theme', 'dark');
    
    const settings = await FallbackSettingsService.getSettings();
    expect(settings.theme).toBe('dark');
  });

  it('clears saved settings', async () => {
    await FallbackSettingsService.saveSettings({
      theme: 'dark',
      firstDayOfWeek: 1,
      notificationsEnabled: true,
      notificationThresholdDays: 7,
      showerGoals: {
        weekly: 7,
        monthly: 28
      },
      projectInfo: {
        githubRepo: 'https://github.com/test/repo',
        author: 'Test Author'
      }
    });

    await FallbackSettingsService.clearSettings();
    const settings = await FallbackSettingsService.getSettings();
    expect(settings.theme).toBe('system');
  });

  it('handles corrupted settings data', async () => {
    localStorageMock.setItem('shower-tracker-settings', 'invalid json');
    
    const settings = await FallbackSettingsService.getSettings();
    expect(settings.theme).toBe('system'); // Should return defaults
  });

  it('normalizes legacy project info values', async () => {
    localStorageMock.setItem('shower-tracker-settings', JSON.stringify({
      theme: 'system',
      firstDayOfWeek: 0,
      notificationsEnabled: false,
      notificationThresholdDays: 3,
      projectInfo: {
        githubRepo: 'https://github.com/user/shower-tracker',
        author: 'Shower Tracker App'
      }
    }));

    const settings = await FallbackSettingsService.getSettings();
    expect(settings.projectInfo).toEqual({
      githubRepo: 'https://github.com/D35P4C1T0/shower-tracker',
      author: 'D35P4C1T0'
    });
  });
});

describe('FallbackMetadataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('sets and gets metadata', async () => {
    await FallbackMetadataService.setMetadata('testKey', 'testValue');
    
    const value = await FallbackMetadataService.getMetadata('testKey');
    expect(value).toBe('testValue');
  });

  it('returns null for non-existent metadata', async () => {
    const value = await FallbackMetadataService.getMetadata('nonExistent');
    expect(value).toBeNull();
  });

  it('deletes metadata', async () => {
    await FallbackMetadataService.setMetadata('testKey', 'testValue');
    await FallbackMetadataService.deleteMetadata('testKey');
    
    const value = await FallbackMetadataService.getMetadata('testKey');
    expect(value).toBeNull();
  });

  it('handles notification check dates', async () => {
    const testDate = new Date('2023-01-01T10:00:00Z');
    
    await FallbackMetadataService.setLastNotificationCheck(testDate);
    const retrieved = await FallbackMetadataService.getLastNotificationCheck();
    
    expect(retrieved).toEqual(testDate);
  });

  it('returns null for non-existent notification check', async () => {
    const result = await FallbackMetadataService.getLastNotificationCheck();
    expect(result).toBeNull();
  });

  it('returns all metadata values', async () => {
    await FallbackMetadataService.setMetadata('a', '1');
    await FallbackMetadataService.setMetadata('b', '2');

    const metadata = await FallbackMetadataService.getAllMetadata();
    expect(metadata).toEqual({ a: '1', b: '2' });
  });

  it('clears metadata', async () => {
    await FallbackMetadataService.setMetadata('testKey', 'testValue');
    await FallbackMetadataService.clearAllMetadata();

    const metadata = await FallbackMetadataService.getAllMetadata();
    expect(metadata).toEqual({});
  });

  it('handles corrupted metadata', async () => {
    localStorageMock.setItem('shower-tracker-metadata', 'invalid json');
    
    const value = await FallbackMetadataService.getMetadata('testKey');
    expect(value).toBeNull();
  });
});
