import Dexie, { type EntityTable } from 'dexie';
// Database schema types are defined inline below

// Database interfaces for Dexie
export interface DBShowerEntry {
  id?: number;
  timestamp: Date;
  notes?: string;
}

export interface DBUserSettings {
  id?: number;
  theme: 'light' | 'dark' | 'system';
  firstDayOfWeek: 0 | 1;
  notificationsEnabled: boolean;
  notificationThresholdDays: number;
  githubRepo: string;
  author: string;
}

export interface DBMetadata {
  id?: number;
  key: string;
  value: string;
  updatedAt: Date;
}

// Database class
export class ShowerTrackerDB extends Dexie {
  showers!: EntityTable<DBShowerEntry, 'id'>;
  settings!: EntityTable<DBUserSettings, 'id'>;
  metadata!: EntityTable<DBMetadata, 'id'>;

  constructor() {
    super('ShowerTrackerDB');
    
    this.version(1).stores({
      showers: '++id, timestamp',
      settings: '++id',
      metadata: '++id, key, updatedAt'
    });
  }
}

// Create database instance
export const db = new ShowerTrackerDB();