import {
  FallbackShowerService,
  FallbackSettingsService,
  FallbackMetadataService,
  StorageChecker,
  replaceFallbackData
} from '../storage-fallback';
import type { UserSettings } from '../../types';

import { vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../database-services/default-settings';

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

beforeEach(() => {
  let queue = Promise.resolve();
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: {
      request: vi.fn((_name: string, operation: () => Promise<unknown>) => {
        const result = queue.then(operation);
        queue = result.then(() => undefined, () => undefined);
        return result;
      })
    }
  });
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
    const read = vi.spyOn(localStorage, 'getItem').mockImplementationOnce(() => {
      throw new Error('localStorage not available');
    });
    expect(StorageChecker.isLocalStorageAvailable()).toBe(false);
    read.mockRestore();
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

    expect(await FallbackShowerService.getAllShowers()).toEqual([]);
  });

  it.each([
    '{}',
    '[{"id":"1","timestamp":null}]',
    '[{"id":"1","timestamp":"invalid"}]',
    '[{"timestamp":"2024-01-01"}]',
    '[{"id":"1","timestamp":"2024-01-01","notes":{}}]'
  ])('preserves malformed stored entries and blocks writes: %s', async (data) => {
    localStorageMock.setItem('shower-tracker-showers', data);
    await expect(FallbackShowerService.addShower()).rejects.toThrow('recovery copy was preserved');
    expect(FallbackShowerService.getCorruptDataBackup()).toBe(data);
    expect(localStorageMock.getItem('shower-tracker-showers')).toBe(data);
  });

  it('handles corrupted data gracefully', async () => {
    localStorageMock.setItem('shower-tracker-showers', 'invalid json');
    
    await expect(FallbackShowerService.getAllShowers()).rejects.toThrow('recovery copy was preserved');
    expect(FallbackShowerService.getCorruptDataBackup()).toBe('invalid json');
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

describe('fallback storage safety', () => {
  beforeEach(() => localStorageMock.clear());

  it('keeps all overlapping additions and metadata updates', async () => {
    await Promise.all([
      FallbackShowerService.addShower(new Date('2024-01-01')),
      FallbackShowerService.addShower(new Date('2024-01-02')),
      FallbackMetadataService.setMetadata('a', '1'),
      FallbackMetadataService.setMetadata('b', '2'),
    ]);
    expect(await FallbackShowerService.getAllShowers()).toHaveLength(2);
    expect(await FallbackMetadataService.getAllMetadata()).toEqual({ a: '1', b: '2' });
    expect(navigator.locks.request).toHaveBeenCalledWith('shower-tracker-storage', expect.any(Function));
  });

  it('keeps the selected fallback store when IndexedDB becomes available again', async () => {
    await FallbackShowerService.addShower(new Date('2024-01-01'));
    const available = vi.spyOn(StorageChecker, 'isIndexedDBAvailable').mockResolvedValue(true);
    try {
      expect(await StorageChecker.getAvailableStorage()).toBe('localstorage');
      expect(available).not.toHaveBeenCalled();
    } finally { available.mockRestore(); }
  });

  it('reads existing history even when writes are full', async () => {
    await FallbackShowerService.addShower(new Date('2024-01-01'));
    const write = vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    try {
      expect(StorageChecker.isLocalStorageAvailable()).toBe(true);
      expect(await FallbackShowerService.getAllShowers()).toHaveLength(1);
      await expect(FallbackShowerService.addShower()).rejects.toThrow('Failed to save');
      expect(await FallbackShowerService.getAllShowers()).toHaveLength(1);
    } finally { write.mockRestore(); }
  });

  it('orders edited and legacy history newest first', async () => {
    localStorageMock.setItem('shower-tracker-showers', JSON.stringify([
      { id: 'old', timestamp: '2024-01-01' },
      { id: 'new', timestamp: '2024-01-02' }
    ]));
    expect((await FallbackShowerService.getLastShower())?.id).toBe('new');
    await FallbackShowerService.updateShower('new', { timestamp: new Date('2023-12-31') });
    expect((await FallbackShowerService.getLastShower())?.id).toBe('old');
    expect(localStorageMock.getItem('shower-tracker-showers')).toBeNull();
  });

  it('replaces all fallback data with one write and preserves it if that write fails', async () => {
    await FallbackShowerService.addShower(new Date('2024-01-01'));
    await FallbackSettingsService.saveSettings({ ...DEFAULT_SETTINGS, theme: 'dark' });
    await FallbackMetadataService.setMetadata('old', 'keep');
    const data = { showers: [{ timestamp: new Date('2024-02-01') }], settings: DEFAULT_SETTINGS, metadata: { new: 'value' } };
    const write = vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    try {
      await expect(replaceFallbackData(data)).rejects.toThrow('quota');
      expect((await FallbackShowerService.getLastShower())?.timestamp).toEqual(new Date('2024-01-01'));
      expect((await FallbackSettingsService.getSettings()).theme).toBe('dark');
      expect(await FallbackMetadataService.getAllMetadata()).toEqual({ old: 'keep' });
    } finally { write.mockRestore(); }
    const commit = vi.spyOn(localStorage, 'setItem');
    try {
      await replaceFallbackData(data);
      expect(commit).toHaveBeenCalledTimes(1);
    } finally { commit.mockRestore(); }
    expect((await FallbackShowerService.getLastShower())?.timestamp).toEqual(new Date('2024-02-01'));
    expect((await FallbackSettingsService.getSettings()).theme).toBe('system');
    expect(await FallbackMetadataService.getAllMetadata()).toEqual({ new: 'value' });
  });

  it('preserves a corrupt snapshot instead of replacing it with empty history', async () => {
    localStorageMock.setItem('shower-tracker-data-v1', 'null');
    await expect(FallbackShowerService.addShower()).rejects.toThrow('Stored data is corrupt');
    expect(localStorageMock.getItem('shower-tracker-data-v1')).toBe('null');
  });

  it('refuses unsafe writes when browser locks are unavailable but keeps reads working', async () => {
    await FallbackShowerService.addShower(new Date('2024-01-01'));
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined });
    await expect(FallbackShowerService.addShower()).rejects.toThrow('browser locks');
    expect(await FallbackShowerService.getAllShowers()).toHaveLength(1);
  });
});
