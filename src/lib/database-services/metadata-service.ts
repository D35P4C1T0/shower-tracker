import { db } from '../database';
import { FallbackMetadataService } from '../storage-fallback';
import { getRequiredStorageType } from './storage-state';

export class MetadataService {
  static async setMetadata(key: string, value: string): Promise<void> {
    const storageType = getRequiredStorageType();

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
    const storageType = getRequiredStorageType();

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
    const storageType = getRequiredStorageType();

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
    const storageType = getRequiredStorageType();

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
    const storageType = getRequiredStorageType();

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
