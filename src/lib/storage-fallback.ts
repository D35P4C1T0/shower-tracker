import type { ShowerEntry, UserSettings } from '../types';
import { DEFAULT_SETTINGS, normalizeProjectInfo, normalizeShowerGoals } from './database-services/default-settings';
import { validateShowerNotes, validateShowerTimestamp } from './shower-validation';

// Storage keys
const STORAGE_KEYS = {
  SHOWERS: 'shower-tracker-showers',
  SETTINGS: 'shower-tracker-settings',
  METADATA: 'shower-tracker-metadata'
} as const;

const LEGACY_WEEKLY_TARGET_KEY = 'shower-tracker-weekly-target';
const LEGACY_MONTHLY_TARGET_KEY = 'shower-tracker-monthly-target';
const CORRUPT_SHOWERS_KEY = 'shower-tracker-showers-corrupt-backup';

const SNAPSHOT_KEY = 'shower-tracker-data-v1';
type StorageSnapshot = Record<string, string>;

function readSnapshot(): StorageSnapshot {
  const snapshot = localStorage.getItem(SNAPSHOT_KEY);
  if (snapshot !== null) {
    const data: unknown = JSON.parse(snapshot);
    if (typeof data !== 'object' || data === null || Array.isArray(data) ||
        Object.values(data).some(value => typeof value !== 'string')) {
      throw new Error('Stored data is corrupt. The original snapshot has been kept.');
    }
    return data as StorageSnapshot;
  }
  return Object.fromEntries(Object.values(STORAGE_KEYS).flatMap(key => {
    const value = localStorage.getItem(key);
    return value === null ? [] : [[key, value]];
  }));
}

function writeSnapshot(snapshot: StorageSnapshot): void {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  // The new snapshot is committed before removing obsolete copies.
  try {
    for (const key of Object.values(STORAGE_KEYS)) localStorage.removeItem(key);
  } catch (error) {
    console.warn('Could not remove legacy storage copies:', error);
  }
}

async function withStorageLock<T>(operation: () => T | Promise<T>): Promise<T> {
  if (!navigator.locks) {
    throw new Error('Safe localStorage writes require browser locks. Please update your browser.');
  }
  return navigator.locks.request('shower-tracker-storage', operation);
}

function isLocalStorageAvailable(): boolean {
  try {
    localStorage.getItem(SNAPSHOT_KEY);
    return true;
  } catch {
    return false;
  }
}

function safeGetItem(key: string): string | null {
  if (key === CORRUPT_SHOWERS_KEY || key === LEGACY_WEEKLY_TARGET_KEY || key === LEGACY_MONTHLY_TARGET_KEY) {
    return localStorage.getItem(key);
  }
  return readSnapshot()[key] ?? null;
}

function safeSetItem(key: string, value: string): boolean {
  try {
    if (key === CORRUPT_SHOWERS_KEY) localStorage.setItem(key, value);
    else writeSnapshot({ ...readSnapshot(), [key]: value });
    return true;
  } catch (error) {
    console.warn('Failed to write to localStorage:', error);
    return false;
  }
}

function safeRemoveItem(key: string): boolean {
  try {
    const snapshot = readSnapshot();
    delete snapshot[key];
    writeSnapshot(snapshot);
    return true;
  } catch (error) {
    console.warn('Failed to remove stored data:', error);
    return false;
  }
}

function createShowerId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function replaceFallbackData(data: {
  showers: Array<{ timestamp: Date; notes?: string }>;
  settings: UserSettings;
  metadata: Record<string, string>;
}): Promise<void> {
  const snapshot: StorageSnapshot = {
    [STORAGE_KEYS.SHOWERS]: JSON.stringify(data.showers.map(shower => ({ ...shower, id: createShowerId() }))),
    [STORAGE_KEYS.SETTINGS]: JSON.stringify(data.settings),
    [STORAGE_KEYS.METADATA]: JSON.stringify(Object.fromEntries(Object.entries(data.metadata).map(([key, value]) => [
      key, { value, updatedAt: new Date().toISOString() }
    ])))
  };
  await withStorageLock(() => writeSnapshot(snapshot));
}

function readLegacyGoalTarget(key: string): number | undefined {
  try {
    const value = Number(safeGetItem(key));
    return Number.isFinite(value) && value > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

// Fallback shower service
export class FallbackShowerService {
  static async addShower(timestamp: Date = new Date(), notes?: string): Promise<ShowerEntry> {
    return withStorageLock(async () => {
      validateShowerTimestamp(timestamp);
      validateShowerNotes(notes);

      const showers = await this.getAllShowers();
      const id = createShowerId();
      const newShower: ShowerEntry = { id, timestamp, notes };

      const updatedShowers = [newShower, ...showers].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const success = safeSetItem(STORAGE_KEYS.SHOWERS, JSON.stringify(updatedShowers));
      if (!success) {
        throw new Error('Failed to save shower data');
      }

      return newShower;
    });
  }

  static async getAllShowers(): Promise<ShowerEntry[]> {
    const data = safeGetItem(STORAGE_KEYS.SHOWERS);
    if (!data) return [];

    try {
      const showers = JSON.parse(data) as ShowerEntry[];
      if (!Array.isArray(showers)) throw new Error('Invalid shower list');
      return showers.map(shower => {
        if (!shower || typeof shower.id !== 'string' || !shower.id ||
            (typeof shower.timestamp !== 'string' && typeof shower.timestamp !== 'number')) {
          throw new Error('Invalid stored shower');
        }
        const timestamp = new Date(shower.timestamp);
        if (!Number.isFinite(timestamp.getTime())) throw new Error('Invalid stored timestamp');
        validateShowerNotes(shower.notes);
        return { ...shower, timestamp };
      }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.warn('Failed to parse shower data:', error);
      safeSetItem(CORRUPT_SHOWERS_KEY, data);
      throw new Error('Stored shower data is corrupt. A recovery copy was preserved.');
    }
  }

  static async getShowersByDateRange(startDate: Date, endDate: Date): Promise<ShowerEntry[]> {
    const allShowers = await this.getAllShowers();
    return allShowers.filter(shower => {
      const showerDate = new Date(shower.timestamp);
      return showerDate >= startDate && showerDate <= endDate;
    });
  }

  static async getLastShower(): Promise<ShowerEntry | null> {
    const showers = await this.getAllShowers();
    return showers.length > 0 ? showers[0] : null;
  }

  static async deleteShower(id: string): Promise<void> {
    return withStorageLock(async () => {
      const showers = await this.getAllShowers();
      const updatedShowers = showers.filter(shower => shower.id !== id);
      if (updatedShowers.length === showers.length) throw new Error('Shower not found');

      const success = safeSetItem(STORAGE_KEYS.SHOWERS, JSON.stringify(updatedShowers));
      if (!success) {
        throw new Error('Failed to delete shower data');
      }
    });
  }

  static async updateShower(id: string, updates: Partial<Omit<ShowerEntry, 'id'>>): Promise<void> {
    return withStorageLock(async () => {
      if (updates.timestamp !== undefined) {
        validateShowerTimestamp(updates.timestamp);
      }
      validateShowerNotes(updates.notes);

      const showers = await this.getAllShowers();
      if (!showers.some(shower => shower.id === id)) throw new Error('Shower not found');
      const updatedShowers = showers.map(shower =>
        shower.id === id ? { ...shower, ...updates } : shower
      );

      const success = safeSetItem(STORAGE_KEYS.SHOWERS, JSON.stringify(updatedShowers));
      if (!success) {
        throw new Error('Failed to update shower data');
      }
    });
  }

  static async clearAllShowers(): Promise<void> {
    return withStorageLock(async () => {
      const success = safeRemoveItem(STORAGE_KEYS.SHOWERS);
      if (!success) {
        throw new Error('Failed to clear shower data');
      }
    });
  }

  static getCorruptDataBackup(): string | null {
    return safeGetItem(CORRUPT_SHOWERS_KEY);
  }
}

// Fallback settings service
export class FallbackSettingsService {
  static async getSettings(): Promise<UserSettings> {
    const data = safeGetItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      return {
        ...DEFAULT_SETTINGS,
        showerGoals: normalizeShowerGoals({
          weekly: readLegacyGoalTarget(LEGACY_WEEKLY_TARGET_KEY),
          monthly: readLegacyGoalTarget(LEGACY_MONTHLY_TARGET_KEY)
        })
      };
    }

    try {
      const settings = JSON.parse(data) as Partial<UserSettings> & {
        githubRepo?: string;
        author?: string;
      };

      const projectInfo = normalizeProjectInfo(
        settings.projectInfo ?? {
          githubRepo: settings.githubRepo,
          author: settings.author
        }
      );

      return {
        ...DEFAULT_SETTINGS,
        ...settings,
        showerGoals: normalizeShowerGoals(settings.showerGoals ?? {
          weekly: readLegacyGoalTarget(LEGACY_WEEKLY_TARGET_KEY),
          monthly: readLegacyGoalTarget(LEGACY_MONTHLY_TARGET_KEY)
        }),
        projectInfo
      };
    } catch (error) {
      console.warn('Failed to parse settings data:', error);
      return DEFAULT_SETTINGS;
    }
  }

  static async saveSettings(settings: UserSettings): Promise<void> {
    return withStorageLock(async () => {
      const success = safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      if (!success) {
        throw new Error('Failed to save settings');
      }
    });
  }

  static async updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ): Promise<void> {
    return withStorageLock(async () => {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, [key]: value };
      if (!safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings))) {
        throw new Error('Failed to save settings');
      }
    });
  }

  static async clearSettings(): Promise<void> {
    return withStorageLock(async () => {
      const success = safeRemoveItem(STORAGE_KEYS.SETTINGS);
      if (!success) {
        throw new Error('Failed to clear settings data');
      }
    });
  }
}

// Fallback metadata service
export class FallbackMetadataService {
  static async setMetadata(key: string, value: string): Promise<void> {
    return withStorageLock(async () => {
      const metadata = await this.getAllMetadataEntries();
      metadata[key] = {
        value,
        updatedAt: new Date().toISOString()
      };

      const success = safeSetItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata));
      if (!success) {
        throw new Error('Failed to save metadata');
      }
    });
  }

  static async getMetadata(key: string): Promise<string | null> {
    const metadata = await this.getAllMetadataEntries();
    return metadata[key]?.value || null;
  }

  static async deleteMetadata(key: string): Promise<void> {
    return withStorageLock(async () => {
      const metadata = await this.getAllMetadataEntries();
      delete metadata[key];

      const success = safeSetItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata));
      if (!success) {
        throw new Error('Failed to delete metadata');
      }
    });
  }

  static async getLastNotificationCheck(): Promise<Date | null> {
    const value = await this.getMetadata('lastNotificationCheck');
    return value ? new Date(value) : null;
  }

  static async setLastNotificationCheck(date: Date): Promise<void> {
    await this.setMetadata('lastNotificationCheck', date.toISOString());
  }

  static async getAllMetadata(): Promise<Record<string, string>> {
    const metadata = await this.getAllMetadataEntries();
    return Object.entries(metadata).reduce<Record<string, string>>((result, [key, item]) => {
      result[key] = item.value;
      return result;
    }, {});
  }

  static async clearAllMetadata(): Promise<void> {
    return withStorageLock(async () => {
      const success = safeRemoveItem(STORAGE_KEYS.METADATA);
      if (!success) {
        throw new Error('Failed to clear metadata');
      }
    });
  }

  private static async getAllMetadataEntries(): Promise<Record<string, { value: string; updatedAt: string }>> {
    const data = safeGetItem(STORAGE_KEYS.METADATA);
    if (!data) return {};

    try {
      return JSON.parse(data);
    } catch (error) {
      console.warn('Failed to parse metadata:', error);
      return {};
    }
  }
}

// Storage availability checker
export class StorageChecker {
  static isIndexedDBAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!('indexedDB' in window)) {
        resolve(false);
        return;
      }

      try {
        const request = indexedDB.open('__test__');
        request.onerror = () => resolve(false);
        request.onsuccess = () => {
          request.result.close();
          indexedDB.deleteDatabase('__test__');
          resolve(true);
        };
      } catch {
        resolve(false);
      }
    });
  }

  static isLocalStorageAvailable(): boolean {
    return isLocalStorageAvailable();
  }

  static async getAvailableStorage(): Promise<'indexeddb' | 'localstorage' | 'none'> {
    // Once fallback data is saved, keep using it even if IndexedDB returns.
    try {
      if (localStorage.getItem(SNAPSHOT_KEY) !== null) return 'localstorage';
    } catch { /* IndexedDB can still work when localStorage is blocked. */ }
    const hasIndexedDB = await this.isIndexedDBAvailable();
    if (hasIndexedDB) return 'indexeddb';

    const hasLocalStorage = this.isLocalStorageAvailable();
    if (hasLocalStorage) return 'localstorage';

    return 'none';
  }
}
