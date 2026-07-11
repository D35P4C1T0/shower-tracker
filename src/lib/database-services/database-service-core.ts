import { db } from '../database';
import { StorageChecker } from '../storage-fallback';
import type { ShowerEntry, UserSettings } from '../../types';
import { validateShowerNotes, validateShowerTimestamp } from '../shower-validation';
import { DEFAULT_SETTINGS, normalizeProjectInfo, normalizeShowerGoals } from './default-settings';
import { SettingsService } from './settings-service';
import { ShowerService } from './shower-service';
import { MetadataService } from './metadata-service';
import { getStorageType, setStorageType, type StorageType } from './storage-state';

export interface ShowerTrackerExport {
  schemaVersion: 1;
  exportedAt: string;
  showers: ShowerEntry[];
  settings: Omit<UserSettings, 'projectInfo'>;
  metadata: Record<string, string>;
}

export interface ImportResult {
  showersImported: number;
  metadataImported: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseImportSource(source: string | unknown): unknown {
  if (typeof source !== 'string') {
    return source;
  }

  try {
    return JSON.parse(source);
  } catch {
    throw new Error('Import file is not valid JSON');
  }
}

function normalizeSettings(value: unknown): UserSettings {
  if (!isObject(value)) {
    return DEFAULT_SETTINGS;
  }

  const theme = value.theme === 'light' || value.theme === 'dark' || value.theme === 'system'
    ? value.theme
    : DEFAULT_SETTINGS.theme;
  const firstDayOfWeek = value.firstDayOfWeek === 1 ? 1 : DEFAULT_SETTINGS.firstDayOfWeek;
  const notificationsEnabled = typeof value.notificationsEnabled === 'boolean'
    ? value.notificationsEnabled
    : DEFAULT_SETTINGS.notificationsEnabled;
  const notificationThresholdDays = Number(value.notificationThresholdDays);

  return {
    theme,
    firstDayOfWeek,
    notificationsEnabled,
    notificationThresholdDays: Number.isFinite(notificationThresholdDays) && notificationThresholdDays >= 1
      ? notificationThresholdDays
      : DEFAULT_SETTINGS.notificationThresholdDays,
    showerGoals: normalizeShowerGoals(isObject(value.showerGoals) ? value.showerGoals : null),
    projectInfo: normalizeProjectInfo(null)
  };
}

function getPortableSettings(settings: UserSettings): Omit<UserSettings, 'projectInfo'> {
  const { projectInfo: _projectInfo, ...portableSettings } = settings;
  void _projectInfo;
  return portableSettings;
}

function normalizeShowers(value: unknown): Array<{ timestamp: Date; notes?: string }> {
  if (!Array.isArray(value)) {
    throw new Error('Import data must include a showers array');
  }

  return value.map((item, index) => {
    if (!isObject(item)) {
      throw new Error(`Shower entry ${index + 1} is invalid`);
    }

    const timestamp = new Date(item.timestamp as string | number | Date);
    validateShowerTimestamp(timestamp);

    const notes = item.notes === undefined ? undefined : String(item.notes);
    validateShowerNotes(notes);

    return { timestamp, notes };
  });
}

function normalizeMetadata(value: unknown): Record<string, string> {
  if (value === undefined) {
    return {};
  }

  if (!isObject(value)) {
    throw new Error('Import metadata must be an object');
  }

  return Object.entries(value).reduce<Record<string, string>>((result, [key, item]) => {
    result[key] = String(item);
    return result;
  }, {});
}

function normalizeImportData(source: string | unknown): {
  showers: Array<{ timestamp: Date; notes?: string }>;
  settings: UserSettings;
  metadata: Record<string, string>;
} {
  const data = parseImportSource(source);
  if (!isObject(data)) {
    throw new Error('Import data must be an object');
  }
  if (data.schemaVersion !== 1) {
    throw new Error('Unsupported or missing export schema version');
  }

  return {
    showers: normalizeShowers(data.showers),
    settings: normalizeSettings(data.settings),
    metadata: normalizeMetadata(data.metadata)
  };
}

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

  static async exportData(): Promise<ShowerTrackerExport> {
    const [showers, settings, metadata] = await Promise.all([
      ShowerService.getAllShowers(),
      SettingsService.getSettings(),
      MetadataService.getAllMetadata()
    ]);

    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      showers,
      settings: getPortableSettings(settings),
      metadata
    };
  }

  static async importData(source: string | unknown): Promise<ImportResult> {
    const data = normalizeImportData(source);
    const previousData = await this.exportData();

    try {
      await this.replaceAllData(data);
    } catch (error) {
      try {
        await this.replaceAllData(normalizeImportData(previousData));
      } catch (rollbackError) {
        console.error('Import rollback failed:', rollbackError);
        throw new Error('Import failed and automatic rollback failed. Use your pre-import export to recover.');
      }
      throw error;
    }

    return {
      showersImported: data.showers.length,
      metadataImported: Object.keys(data.metadata).length
    };
  }

  private static async replaceAllData(data: ReturnType<typeof normalizeImportData>): Promise<void> {
    await this.clearAllData();
    await SettingsService.saveSettings(data.settings);
    for (const shower of data.showers) {
      await ShowerService.addShower(shower.timestamp, shower.notes);
    }
    for (const [key, value] of Object.entries(data.metadata)) {
      await MetadataService.setMetadata(key, value);
    }
  }
}
