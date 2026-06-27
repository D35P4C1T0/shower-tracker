import { db, type DBUserSettings } from '../database';
import { FallbackSettingsService } from '../storage-fallback';
import type { UserSettings } from '../../types';
import { DEFAULT_SETTINGS, normalizeProjectInfo, normalizeShowerGoals } from './default-settings';
import { runStorageOperation } from './storage-adapter';

const LEGACY_WEEKLY_TARGET_KEY = 'shower-tracker-weekly-target';
const LEGACY_MONTHLY_TARGET_KEY = 'shower-tracker-monthly-target';

function readLegacyGoalTarget(key: string): number | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const value = Number(window.localStorage.getItem(key));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function settingsFromDB(settings: DBUserSettings): UserSettings {
  return {
    theme: settings.theme,
    firstDayOfWeek: settings.firstDayOfWeek,
    notificationsEnabled: settings.notificationsEnabled,
    notificationThresholdDays: settings.notificationThresholdDays,
    showerGoals: normalizeShowerGoals({
      weekly: settings.weeklyShowerTarget ?? readLegacyGoalTarget(LEGACY_WEEKLY_TARGET_KEY),
      monthly: settings.monthlyShowerTarget ?? readLegacyGoalTarget(LEGACY_MONTHLY_TARGET_KEY)
    }),
    projectInfo: normalizeProjectInfo({
      githubRepo: settings.githubRepo,
      author: settings.author
    })
  };
}

function settingsToDB(settings: UserSettings, id?: number): DBUserSettings {
  const projectInfo = normalizeProjectInfo(settings.projectInfo);
  const showerGoals = normalizeShowerGoals(settings.showerGoals);

  return {
    id,
    theme: settings.theme,
    firstDayOfWeek: settings.firstDayOfWeek,
    notificationsEnabled: settings.notificationsEnabled,
    notificationThresholdDays: settings.notificationThresholdDays,
    weeklyShowerTarget: showerGoals.weekly,
    monthlyShowerTarget: showerGoals.monthly,
    githubRepo: projectInfo.githubRepo,
    author: projectInfo.author
  };
}

function defaultSettingsWithLegacyGoals(): UserSettings {
  return {
    ...DEFAULT_SETTINGS,
    showerGoals: normalizeShowerGoals({
      weekly: readLegacyGoalTarget(LEGACY_WEEKLY_TARGET_KEY),
      monthly: readLegacyGoalTarget(LEGACY_MONTHLY_TARGET_KEY)
    })
  };
}

export class SettingsService {
  static async getSettings(): Promise<UserSettings> {
    return await runStorageOperation({
      indexedDB: async () => {
        const settings = await db.settings.toCollection().first();
        if (!settings) {
          const defaults = defaultSettingsWithLegacyGoals();
          await this.saveSettings(defaults);
          return defaults;
        }

        return settingsFromDB(settings);
      },
      localStorage: () => FallbackSettingsService.getSettings(),
      noStorage: () => DEFAULT_SETTINGS
    });
  }

  static async saveSettings(settings: UserSettings): Promise<void> {
    await runStorageOperation({
      indexedDB: async () => {
        const existing = await db.settings.toCollection().first();
        const dbSettings = settingsToDB(settings, existing?.id);

        if (existing?.id !== undefined) {
          await db.settings.update(existing.id, dbSettings);
        } else {
          await db.settings.add(dbSettings);
        }
      },
      localStorage: () => FallbackSettingsService.saveSettings(settings),
      noStorage: () => {
        throw new Error('No storage available');
      }
    });
  }

  static async updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ): Promise<void> {
    await runStorageOperation({
      indexedDB: async () => {
        const currentSettings = await this.getSettings();
        await this.saveSettings({ ...currentSettings, [key]: value });
      },
      localStorage: () => FallbackSettingsService.updateSetting(key, value),
      noStorage: () => {
        throw new Error('No storage available');
      }
    });
  }

  static async clearSettings(): Promise<void> {
    await runStorageOperation({
      indexedDB: async () => {
        await db.settings.clear();
      },
      localStorage: () => FallbackSettingsService.clearSettings(),
      noStorage: () => undefined
    });
  }
}
