import { db } from '../database';
import { FallbackMetadataService } from '../storage-fallback';
import { runStorageOperation } from './storage-adapter';

export class MetadataService {
  static async setMetadata(key: string, value: string): Promise<void> {
    await runStorageOperation({
      indexedDB: async () => {
        const existing = await db.metadata.where('key').equals(key).first();
        if (existing) {
          await db.metadata.update(existing.id!, { value, updatedAt: new Date() });
        } else {
          await db.metadata.add({ key, value, updatedAt: new Date() });
        }
      },
      localStorage: () => FallbackMetadataService.setMetadata(key, value),
      noStorage: () => {
        throw new Error('No storage available');
      }
    });
  }

  static async getMetadata(key: string): Promise<string | null> {
    return await runStorageOperation({
      indexedDB: async () => {
        const metadata = await db.metadata.where('key').equals(key).first();
        return metadata?.value || null;
      },
      localStorage: () => FallbackMetadataService.getMetadata(key),
      noStorage: () => null
    });
  }

  static async deleteMetadata(key: string): Promise<void> {
    await runStorageOperation({
      indexedDB: async () => {
        await db.metadata.where('key').equals(key).delete();
      },
      localStorage: () => FallbackMetadataService.deleteMetadata(key),
      noStorage: () => {
        throw new Error('No storage available');
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
    return await runStorageOperation({
      indexedDB: async () => {
        const metadataEntries = await db.metadata.toArray();
        return metadataEntries.reduce<Record<string, string>>((result, entry) => {
          result[entry.key] = entry.value;
          return result;
        }, {});
      },
      localStorage: () => FallbackMetadataService.getAllMetadata(),
      noStorage: () => ({})
    });
  }

  static async clearAllMetadata(): Promise<void> {
    await runStorageOperation({
      indexedDB: async () => {
        await db.metadata.clear();
      },
      localStorage: () => FallbackMetadataService.clearAllMetadata(),
      noStorage: () => undefined
    });
  }
}
