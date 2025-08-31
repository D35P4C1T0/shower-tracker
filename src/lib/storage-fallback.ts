import type { ShowerEntry, UserSettings } from '../types';

// Storage keys
const STORAGE_KEYS = {
  SHOWERS: 'shower-tracker-showers',
  SETTINGS: 'shower-tracker-settings',
  METADATA: 'shower-tracker-metadata'
} as const;

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  firstDayOfWeek: 0,
  notificationsEnabled: false,
  notificationThresholdDays: 3,
  projectInfo: {
    githubRepo: 'https://github.com/user/shower-tracker',
    author: 'Shower Tracker App'
  }
};

// Check if localStorage is available
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Safe localStorage operations with error handling
function safeGetItem(key: string): string | null {
  try {
    if (!isLocalStorageAvailable()) return null;
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('Failed to read from localStorage:', error);
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    if (!isLocalStorageAvailable()) return false;
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn('Failed to write to localStorage:', error);
    return false;
  }
}

// Removed unused function - keeping for potential future use
// function safeRemoveItem(key: string): boolean {
//   try {
//     if (!isLocalStorageAvailable()) return false;
//     localStorage.removeItem(key);
//     return true;
//   } catch (error) {
//     console.warn('Failed to remove from localStorage:', error);
//     return false;
//   }
// }

// Fallback shower service
export class FallbackShowerService {
  static async addShower(timestamp: Date = new Date(), notes?: string): Promise<ShowerEntry> {
    const showers = await this.getAllShowers();
    const id = Date.now().toString();
    const newShower: ShowerEntry = { id, timestamp, notes };
    
    const updatedShowers = [newShower, ...showers].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const success = safeSetItem(STORAGE_KEYS.SHOWERS, JSON.stringify(updatedShowers));
    if (!success) {
      throw new Error('Failed to save shower data');
    }
    
    return newShower;
  }

  static async getAllShowers(): Promise<ShowerEntry[]> {
    const data = safeGetItem(STORAGE_KEYS.SHOWERS);
    if (!data) return [];
    
    try {
      const showers = JSON.parse(data) as ShowerEntry[];
      // Ensure timestamps are Date objects
      return showers.map(shower => ({
        ...shower,
        timestamp: new Date(shower.timestamp)
      }));
    } catch (error) {
      console.warn('Failed to parse shower data:', error);
      return [];
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
    const showers = await this.getAllShowers();
    const updatedShowers = showers.filter(shower => shower.id !== id);
    
    const success = safeSetItem(STORAGE_KEYS.SHOWERS, JSON.stringify(updatedShowers));
    if (!success) {
      throw new Error('Failed to delete shower data');
    }
  }

  static async updateShower(id: string, updates: Partial<Omit<ShowerEntry, 'id'>>): Promise<void> {
    const showers = await this.getAllShowers();
    const updatedShowers = showers.map(shower =>
      shower.id === id ? { ...shower, ...updates } : shower
    );
    
    const success = safeSetItem(STORAGE_KEYS.SHOWERS, JSON.stringify(updatedShowers));
    if (!success) {
      throw new Error('Failed to update shower data');
    }
  }
}

// Fallback settings service
export class FallbackSettingsService {
  static async getSettings(): Promise<UserSettings> {
    const data = safeGetItem(STORAGE_KEYS.SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    
    try {
      const settings = JSON.parse(data) as UserSettings;
      // Merge with defaults to handle missing properties
      return { ...DEFAULT_SETTINGS, ...settings };
    } catch (error) {
      console.warn('Failed to parse settings data:', error);
      return DEFAULT_SETTINGS;
    }
  }

  static async saveSettings(settings: UserSettings): Promise<void> {
    const success = safeSetItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    if (!success) {
      throw new Error('Failed to save settings');
    }
  }

  static async updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ): Promise<void> {
    const currentSettings = await this.getSettings();
    const updatedSettings = { ...currentSettings, [key]: value };
    await this.saveSettings(updatedSettings);
  }
}

// Fallback metadata service
export class FallbackMetadataService {
  static async setMetadata(key: string, value: string): Promise<void> {
    const metadata = await this.getAllMetadata();
    metadata[key] = {
      value,
      updatedAt: new Date().toISOString()
    };
    
    const success = safeSetItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata));
    if (!success) {
      throw new Error('Failed to save metadata');
    }
  }

  static async getMetadata(key: string): Promise<string | null> {
    const metadata = await this.getAllMetadata();
    return metadata[key]?.value || null;
  }

  static async deleteMetadata(key: string): Promise<void> {
    const metadata = await this.getAllMetadata();
    delete metadata[key];
    
    const success = safeSetItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata));
    if (!success) {
      throw new Error('Failed to delete metadata');
    }
  }

  static async getLastNotificationCheck(): Promise<Date | null> {
    const value = await this.getMetadata('lastNotificationCheck');
    return value ? new Date(value) : null;
  }

  static async setLastNotificationCheck(date: Date): Promise<void> {
    await this.setMetadata('lastNotificationCheck', date.toISOString());
  }

  private static async getAllMetadata(): Promise<Record<string, { value: string; updatedAt: string }>> {
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
    const hasIndexedDB = await this.isIndexedDBAvailable();
    if (hasIndexedDB) return 'indexeddb';
    
    const hasLocalStorage = this.isLocalStorageAvailable();
    if (hasLocalStorage) return 'localstorage';
    
    return 'none';
  }
}