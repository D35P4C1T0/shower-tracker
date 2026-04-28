import { db, type DBUserSettings } from '../database';
import { FallbackSettingsService } from '../storage-fallback';
import type { UserSettings } from '../../types';
import { DEFAULT_SETTINGS, normalizeProjectInfo, normalizeShowerGoals } from './default-settings';
import { getRequiredStorageType } from './storage-state';

const LEGACY_WEEKLY_TARGET_KEY = 'shower-tracker-weekly-target';
const LEGACY_MONTHLY_TARGET_KEY = 'shower-tracker-monthly-target';

function readLegacyGoalTarget(key: string): number | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const value = Number(window.localStorage.getItem(key));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

export class SettingsService {
  static async getSettings(): Promise<UserSettings> {
    const storageType = getRequiredStorageType();

    if (storageType === 'localstorage') {
      return await FallbackSettingsService.getSettings();
    }

    if (storageType === 'none') {
      return DEFAULT_SETTINGS;
    }

    try {
      const settings = await db.settings.toCollection().first();

      if (!settings) {
        const settingsWithLegacyGoals: UserSettings = {
          ...DEFAULT_SETTINGS,
          showerGoals: normalizeShowerGoals({
            weekly: readLegacyGoalTarget(LEGACY_WEEKLY_TARGET_KEY),
            monthly: readLegacyGoalTarget(LEGACY_MONTHLY_TARGET_KEY)
          })
        };
        await this.saveSettings(settingsWithLegacyGoals);
        return settingsWithLegacyGoals;
      }

      const projectInfo = normalizeProjectInfo({
        githubRepo: settings.githubRepo,
        author: settings.author
      });
      const showerGoals = normalizeShowerGoals({
        weekly: settings.weeklyShowerTarget ?? readLegacyGoalTarget(LEGACY_WEEKLY_TARGET_KEY),
        monthly: settings.monthlyShowerTarget ?? readLegacyGoalTarget(LEGACY_MONTHLY_TARGET_KEY)
      });

      const resolvedSettings: UserSettings = {
        theme: settings.theme ?? DEFAULT_SETTINGS.theme,
        firstDayOfWeek: settings.firstDayOfWeek ?? DEFAULT_SETTINGS.firstDayOfWeek,
        notificationsEnabled: settings.notificationsEnabled ?? DEFAULT_SETTINGS.notificationsEnabled,
        notificationThresholdDays: settings.notificationThresholdDays ?? DEFAULT_SETTINGS.notificationThresholdDays,
        showerGoals,
        projectInfo
      };

      const requiresRepair =
        settings.theme !== resolvedSettings.theme ||
        settings.firstDayOfWeek !== resolvedSettings.firstDayOfWeek ||
        settings.notificationsEnabled !== resolvedSettings.notificationsEnabled ||
        settings.notificationThresholdDays !== resolvedSettings.notificationThresholdDays ||
        settings.weeklyShowerTarget !== resolvedSettings.showerGoals.weekly ||
        settings.monthlyShowerTarget !== resolvedSettings.showerGoals.monthly ||
        settings.githubRepo !== resolvedSettings.projectInfo.githubRepo ||
        settings.author !== resolvedSettings.projectInfo.author;

      if (requiresRepair) {
        await this.saveSettings(resolvedSettings);
      }

      return resolvedSettings;
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      return await FallbackSettingsService.getSettings();
    }
  }

  static async saveSettings(settings: UserSettings): Promise<void> {
    const storageType = getRequiredStorageType();

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
        weeklyShowerTarget: settings.showerGoals.weekly,
        monthlyShowerTarget: settings.showerGoals.monthly,
        githubRepo: settings.projectInfo.githubRepo,
        author: settings.projectInfo.author
      };

      const existing = await db.settings.toCollection().first();
      if (existing) {
        await db.settings.update(existing.id!, dbSettings);
      } else {
        await db.settings.add(dbSettings);
      }
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      await FallbackSettingsService.saveSettings(settings);
    }
  }

  static async updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ): Promise<void> {
    const storageType = getRequiredStorageType();

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

  static async clearSettings(): Promise<void> {
    const storageType = getRequiredStorageType();

    if (storageType === 'localstorage') {
      return await FallbackSettingsService.clearSettings();
    }

    if (storageType === 'none') {
      return;
    }

    try {
      await db.settings.clear();
    } catch (error) {
      console.warn('IndexedDB failed, trying localStorage fallback:', error);
      await FallbackSettingsService.clearSettings();
    }
  }
}
