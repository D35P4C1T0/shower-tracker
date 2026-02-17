import { db } from '../database';
import { StorageChecker } from '../storage-fallback';
import type { ShowerEntry, UserSettings } from '../../types';
import { SettingsService } from './settings-service';
import { ShowerService } from './shower-service';
import { MetadataService } from './metadata-service';
import { getStorageType, setStorageType, type StorageType } from './storage-state';

export class DatabaseService {
  static async initialize(): Promise<void> {
    try {
      const availableStorage = await StorageChecker.getAvailableStorage();
      setStorageType(availableStorage);

      if (availableStorage === 'indexeddb') {
        await db.open();
        console.log('IndexedDB initialized successfully');
      } else if (availableStorage === 'localstorage') {
        console.log('Using localStorage fallback');
      } else {
        throw new Error('No storage options available');
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);

      if (StorageChecker.isLocalStorageAvailable()) {
        setStorageType('localstorage');
        console.log('Falling back to localStorage');
      } else {
        setStorageType('none');
        throw new Error('No storage options available');
      }
    }
  }

  static getStorageType(): StorageType | null {
    return getStorageType();
  }

  static isStorageAvailable(): boolean {
    const type = getStorageType();
    return type !== 'none' && type !== null;
  }

  static async clearAllData(): Promise<void> {
    await Promise.all([
      ShowerService.clearAllShowers(),
      SettingsService.clearSettings(),
      MetadataService.clearAllMetadata()
    ]);
  }

  static async exportData(): Promise<{
    showers: ShowerEntry[];
    settings: UserSettings;
    metadata: Record<string, string>;
  }> {
    const [showers, settings, metadata] = await Promise.all([
      ShowerService.getAllShowers(),
      SettingsService.getSettings(),
      MetadataService.getAllMetadata()
    ]);

    return { showers, settings, metadata };
  }
}
