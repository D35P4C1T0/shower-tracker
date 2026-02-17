import { db } from '../database';
import { VALIDATION_CONSTANTS } from '../constants';
import { FallbackShowerService } from '../storage-fallback';
import type { ShowerEntry } from '../../types';
import { getRequiredStorageType } from './storage-state';

function toShowerEntry(shower: { id?: number; timestamp: Date; notes?: string }): ShowerEntry {
  return {
    id: shower.id!.toString(),
    timestamp: shower.timestamp,
    notes: shower.notes
  };
}

export class ShowerService {
  static async addShower(timestamp: Date = new Date(), notes?: string): Promise<ShowerEntry> {
    if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
      throw new Error('Invalid timestamp provided');
    }

    if (timestamp < VALIDATION_CONSTANTS.MIN_DATE || timestamp > VALIDATION_CONSTANTS.MAX_DATE) {
      throw new Error('Timestamp is outside valid date range');
    }

    if (notes !== undefined && notes.length > VALIDATION_CONSTANTS.MAX_NOTES_LENGTH) {
      throw new Error(`Notes exceed maximum length of ${VALIDATION_CONSTANTS.MAX_NOTES_LENGTH} characters`);
    }

    const storageType = getRequiredStorageType();

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
    const storageType = getRequiredStorageType();

    if (storageType === 'localstorage') {
      return await FallbackShowerService.getAllShowers();
    }

    if (storageType === 'none') {
      return [];
    }

    try {
      const showers = await db.showers.orderBy('timestamp').reverse().toArray();
      return showers.map(toShowerEntry);
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      return await FallbackShowerService.getAllShowers();
    }
  }

  static async getShowersByDateRange(startDate: Date, endDate: Date): Promise<ShowerEntry[]> {
    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      throw new Error('Invalid date provided');
    }

    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    const storageType = getRequiredStorageType();

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

      return showers.map(toShowerEntry);
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      return await FallbackShowerService.getShowersByDateRange(startDate, endDate);
    }
  }

  static async getLastShower(): Promise<ShowerEntry | null> {
    const storageType = getRequiredStorageType();

    if (storageType === 'localstorage') {
      return await FallbackShowerService.getLastShower();
    }

    if (storageType === 'none') {
      return null;
    }

    try {
      const shower = await db.showers.orderBy('timestamp').reverse().first();
      if (!shower) {
        return null;
      }

      return toShowerEntry(shower);
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      return await FallbackShowerService.getLastShower();
    }
  }

  static async deleteShower(id: string): Promise<void> {
    const storageType = getRequiredStorageType();

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
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid shower ID');
    }

    if (updates.timestamp !== undefined) {
      if (!(updates.timestamp instanceof Date) || isNaN(updates.timestamp.getTime())) {
        throw new Error('Invalid timestamp provided');
      }

      if (updates.timestamp < VALIDATION_CONSTANTS.MIN_DATE || updates.timestamp > VALIDATION_CONSTANTS.MAX_DATE) {
        throw new Error('Timestamp is outside valid date range');
      }
    }

    if (updates.notes !== undefined && updates.notes.length > VALIDATION_CONSTANTS.MAX_NOTES_LENGTH) {
      throw new Error(`Notes exceed maximum length of ${VALIDATION_CONSTANTS.MAX_NOTES_LENGTH} characters`);
    }

    const storageType = getRequiredStorageType();

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

  static async clearAllShowers(): Promise<void> {
    const storageType = getRequiredStorageType();

    if (storageType === 'localstorage') {
      return await FallbackShowerService.clearAllShowers();
    }

    if (storageType === 'none') {
      return;
    }

    try {
      await db.showers.clear();
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      await FallbackShowerService.clearAllShowers();
    }
  }
}
