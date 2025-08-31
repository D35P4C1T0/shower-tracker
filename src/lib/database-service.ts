import { db, type DBUserSettings } from './database';
import type { ShowerEntry, UserSettings } from '../types';
import { 
  FallbackShowerService, 
  FallbackSettingsService, 
  FallbackMetadataService,
  StorageChecker 
} from './storage-fallback';

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

// Shower Entry Operations
export class ShowerService {
  static async addShower(timestamp: Date = new Date(), notes?: string): Promise<ShowerEntry> {
    const storageType = DatabaseService.getStorageType();
    
    if (storageType === 'localstorage') {
      return await FallbackShowerService.addShower(timestamp, notes);
    }
    
    if (storageType === 'none') {
      throw new Error('No storage available');
    }

    try {
      const id = await db.showers.add({
        timestamp,
        notes
      });
      
      return {
        id: id!.toString(),
        timestamp,
        notes
      };
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      return await FallbackShowerService.addShower(timestamp, notes);
    }
  }

  static async getAllShowers(): Promise<ShowerEntry[]> {
    const storageType = DatabaseService.getStorageType();
    
    if (storageType === 'localstorage') {
      return await FallbackShowerService.getAllShowers();
    }
    
    if (storageType === 'none') {
      return [];
    }

    try {
      const showers = await db.showers.orderBy('timestamp').reverse().toArray();
      return showers.map(shower => ({
        id: shower.id!.toString(),
        timestamp: shower.timestamp,
        notes: shower.notes
      }));
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      return await FallbackShowerService.getAllShowers();
    }
  }

  static async getShowersByDateRange(startDate: Date, endDate: Date): Promise<ShowerEntry[]> {
    const storageType = DatabaseService.getStorageType();
    
    if (storageType === 'localstorage') {
      return await FallbackShowerService.getShowersByDateRange(startDate, endDate);
    }
    
    if (storageType === 'none') {
      return [];
    }

    try {
      const showers = await db.showers
        .where('timestamp')
        .between(startDate, endDate, true, true)
        .toArray();
      
      return showers.map(shower => ({
        id: shower.id!.toString(),
        timestamp: shower.timestamp,
        notes: shower.notes
      }));
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      return await FallbackShowerService.getShowersByDateRange(startDate, endDate);
    }
  }

  static async getLastShower(): Promise<ShowerEntry | null> {
    const storageType = DatabaseService.getStorageType();
    
    if (storageType === 'localstorage') {
      return await FallbackShowerService.getLastShower();
    }
    
    if (storageType === 'none') {
      return null;
    }

    try {
      const shower = await db.showers.orderBy('timestamp').reverse().first();
      if (!shower) return null;
      
      return {
        id: shower.id!.toString(),
        timestamp: shower.timestamp,
        notes: shower.notes
      };
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      return await FallbackShowerService.getLastShower();
    }
  }

  static async deleteShower(id: string): Promise<void> {
    const storageType = DatabaseService.getStorageType();
    
    if (storageType === 'localstorage') {
      return await FallbackShowerService.deleteShower(id);
    }
    
    if (storageType === 'none') {
      throw new Error('No storage available');
    }

    try {
      await db.showers.delete(parseInt(id));
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      await FallbackShowerService.deleteShower(id);
    }
  }

  static async updateShower(id: string, updates: Partial<Omit<ShowerEntry, 'id'>>): Promise<void> {
    const storageType = DatabaseService.getStorageType();
    
    if (storageType === 'localstorage') {
      return await FallbackShowerService.updateShower(id, updates);
    }
    
    if (storageType === 'none') {
      throw new Error('No storage available');
    }

    try {
      await db.showers.update(parseInt(id), updates);
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      await FallbackShowerService.updateShower(id, updates);
    }
  }
}

// Settings Operations
export class SettingsService {
  static async getSettings(): Promise<UserSettings> {
    const storageType = DatabaseService.getStorageType();
    
    if (storageType === 'localstorage') {
      return await FallbackSettingsService.getSettings();
    }
    
    if (storageType === 'none') {
      return DEFAULT_SETTINGS;
    }

    try {
      const settings = await db.settings.toCollection().first();
      
      if (!settings) {
        // Initialize with default settings
        await this.saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }

      return {
        theme: settings.theme,
        firstDayOfWeek: settings.firstDayOfWeek,
        notificationsEnabled: settings.notificationsEnabled,
        notificationThresholdDays: settings.notificationThresholdDays,
        projectInfo: {
          githubRepo: settings.githubRepo,
          author: settings.author
        }
      };
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      return await FallbackSettingsService.getSettings();
    }
  }

  static async saveSettings(settings: UserSettings): Promise<void> {
    const storageType = DatabaseService.getStorageType();
    
    if (storageType === 'localstorage') {
      return await FallbackSettingsService.saveSettings(settings);
    }
    
    if (storageType === 'none') {
      throw new Error('No storage available');
    }

    try {
      const dbSettings: Omit<DBUserSettings, 'id'> = {
        theme: settings.theme,
        firstDayOfWeek: settings.firstDayOfWeek,
        notificationsEnabled: settings.notificationsEnabled,
        notificationThresholdDays: settings.notificationThresholdDays,
        githubRepo: settings.projectInfo.githubRepo,
        author: settings.projectInfo.author
      };

      // Clear existing settings and add new ones
      await db.settings.clear();
      await db.settings.add(dbSettings);
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      await FallbackSettingsService.saveSettings(settings);
    }
  }

  static async updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ): Promise<void> {
    const storageType = DatabaseService.getStorageType();
    
    if (storageType === 'localstorage') {
      return await FallbackSettingsService.updateSetting(key, value);
    }
    
    if (storageType === 'none') {
      throw new Error('No storage available');
    }

    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, [key]: value };
      await this.saveSettings(updatedSettings);
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      await FallbackSettingsService.updateSetting(key, value);
    }
  }
}

// Metadata Operations
export class MetadataService {
  static async setMetadata(key: string, value: string): Promise<void> {
    const storageType = DatabaseService.getStorageType();
    
    if (storageType === 'localstorage') {
      return await FallbackMetadataService.setMetadata(key, value);
    }
    
    if (storageType === 'none') {
      throw new Error('No storage available');
    }

    try {
      const existing = await db.metadata.where('key').equals(key).first();
      
      if (existing) {
        await db.metadata.update(existing.id!, {
          value,
          updatedAt: new Date()
        });
      } else {
        await db.metadata.add({
          key,
          value,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      await FallbackMetadataService.setMetadata(key, value);
    }
  }

  static async getMetadata(key: string): Promise<string | null> {
    const storageType = DatabaseService.getStorageType();
    
    if (storageType === 'localstorage') {
      return await FallbackMetadataService.getMetadata(key);
    }
    
    if (storageType === 'none') {
      return null;
    }

    try {
      const metadata = await db.metadata.where('key').equals(key).first();
      return metadata?.value || null;
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      return await FallbackMetadataService.getMetadata(key);
    }
  }

  static async deleteMetadata(key: string): Promise<void> {
    const storageType = DatabaseService.getStorageType();
    
    if (storageType === 'localstorage') {
      return await FallbackMetadataService.deleteMetadata(key);
    }
    
    if (storageType === 'none') {
      throw new Error('No storage available');
    }

    try {
      await db.metadata.where('key').equals(key).delete();
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      await FallbackMetadataService.deleteMetadata(key);
    }
  }

  static async getLastNotificationCheck(): Promise<Date | null> {
    const storageType = DatabaseService.getStorageType();
    
    if (storageType === 'localstorage') {
      return await FallbackMetadataService.getLastNotificationCheck();
    }
    
    if (storageType === 'none') {
      return null;
    }

    try {
      const value = await this.getMetadata('lastNotificationCheck');
      return value ? new Date(value) : null;
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      return await FallbackMetadataService.getLastNotificationCheck();
    }
  }

  static async setLastNotificationCheck(date: Date): Promise<void> {
    const storageType = DatabaseService.getStorageType();
    
    if (storageType === 'localstorage') {
      return await FallbackMetadataService.setLastNotificationCheck(date);
    }
    
    if (storageType === 'none') {
      throw new Error('No storage available');
    }

    try {
      await this.setMetadata('lastNotificationCheck', date.toISOString());
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      await FallbackMetadataService.setLastNotificationCheck(date);
    }
  }
}

// Database initialization and utility functions
export class DatabaseService {
  private static storageType: 'indexeddb' | 'localstorage' | 'none' | null = null;

  static async initialize(): Promise<void> {
    try {
      // Check available storage options
      this.storageType = await StorageChecker.getAvailableStorage();
      
      if (this.storageType === 'indexeddb') {
        await db.open();
        console.log('IndexedDB initialized successfully');
      } else if (this.storageType === 'localstorage') {
        console.log('Using localStorage fallback');
      } else {
        throw new Error('No storage options available');
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Try fallback to localStorage
      if (StorageChecker.isLocalStorageAvailable()) {
        this.storageType = 'localstorage';
        console.log('Falling back to localStorage');
      } else {
        this.storageType = 'none';
        throw new Error('No storage options available');
      }
    }
  }

  static getStorageType(): 'indexeddb' | 'localstorage' | 'none' | null {
    return this.storageType;
  }

  static isStorageAvailable(): boolean {
    return this.storageType !== 'none' && this.storageType !== null;
  }

  static async clearAllData(): Promise<void> {
    await db.showers.clear();
    await db.settings.clear();
    await db.metadata.clear();
  }

  static async exportData(): Promise<{
    showers: ShowerEntry[];
    settings: UserSettings;
    metadata: Record<string, string>;
  }> {
    const showers = await ShowerService.getAllShowers();
    const settings = await SettingsService.getSettings();
    const metadataEntries = await db.metadata.toArray();
    
    const metadata: Record<string, string> = {};
    metadataEntries.forEach(entry => {
      metadata[entry.key] = entry.value;
    });

    return { showers, settings, metadata };
  }
}