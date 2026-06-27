import { db } from '../database';
import { FallbackShowerService } from '../storage-fallback';
import { validateShowerNotes, validateShowerTimestamp } from '../shower-validation';
import type { ShowerEntry } from '../../types';
import { runStorageOperation } from './storage-adapter';

function toShowerEntry(shower: { id?: number; timestamp: Date; notes?: string }): ShowerEntry {
  return {
    id: shower.id!.toString(),
    timestamp: shower.timestamp,
    notes: shower.notes
  };
}

function parseShowerId(id: string): number {
  const numericId = Number.parseInt(id, 10);
  if (!Number.isFinite(numericId)) {
    throw new Error('Invalid shower ID');
  }
  return numericId;
}

export class ShowerService {
  static async addShower(timestamp: Date = new Date(), notes?: string): Promise<ShowerEntry> {
    validateShowerTimestamp(timestamp);
    validateShowerNotes(notes);

    return await runStorageOperation({
      indexedDB: async () => {
        const id = await db.showers.add({ timestamp, notes });
        return { id: id!.toString(), timestamp, notes };
      },
      localStorage: () => FallbackShowerService.addShower(timestamp, notes),
      noStorage: () => {
        throw new Error('No storage available');
      }
    });
  }

  static async getAllShowers(): Promise<ShowerEntry[]> {
    return await runStorageOperation({
      indexedDB: async () => {
        const showers = await db.showers.orderBy('timestamp').reverse().toArray();
        return showers.map(toShowerEntry);
      },
      localStorage: () => FallbackShowerService.getAllShowers(),
      noStorage: () => []
    });
  }

  static async getShowersByDateRange(startDate: Date, endDate: Date): Promise<ShowerEntry[]> {
    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      throw new Error('Invalid date range');
    }

    return await runStorageOperation({
      indexedDB: async () => {
        const showers = await db.showers
          .where('timestamp')
          .between(startDate, endDate, true, true)
          .reverse()
          .sortBy('timestamp');

        return showers
          .map(toShowerEntry)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },
      localStorage: () => FallbackShowerService.getShowersByDateRange(startDate, endDate),
      noStorage: () => []
    });
  }

  static async getLastShower(): Promise<ShowerEntry | null> {
    const showers = await this.getAllShowers();
    return showers.length > 0 ? showers[0] : null;
  }

  static async deleteShower(id: string): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid shower ID');
    }

    await runStorageOperation({
      indexedDB: async () => {
        await db.showers.delete(parseShowerId(id));
      },
      localStorage: () => FallbackShowerService.deleteShower(id),
      noStorage: () => {
        throw new Error('No storage available');
      }
    });
  }

  static async updateShower(id: string, updates: Partial<Omit<ShowerEntry, 'id'>>): Promise<void> {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid shower ID');
    }

    if (updates.timestamp !== undefined) {
      validateShowerTimestamp(updates.timestamp);
    }
    validateShowerNotes(updates.notes);

    await runStorageOperation({
      indexedDB: async () => {
        await db.showers.update(parseShowerId(id), updates);
      },
      localStorage: () => FallbackShowerService.updateShower(id, updates),
      noStorage: () => {
        throw new Error('No storage available');
      }
    });
  }

  static async clearAllShowers(): Promise<void> {
    await runStorageOperation({
      indexedDB: async () => {
        await db.showers.clear();
      },
      localStorage: () => FallbackShowerService.clearAllShowers(),
      noStorage: () => undefined
    });
  }
}
