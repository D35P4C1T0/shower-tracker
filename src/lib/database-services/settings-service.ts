import { db, type DBUserSettings } from '../database';
import { FallbackSettingsService } from '../storage-fallback';
import type { UserSettings } from '../../types';
import { DEFAULT_SETTINGS, normalizeProjectInfo } from './default-settings';
import { getRequiredStorageType } from './storage-state';

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
        await this.saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }

      const projectInfo = normalizeProjectInfo({
        githubRepo: settings.githubRepo,
        author: settings.author
      });

      const resolvedSettings: UserSettings = {
        theme: settings.theme ?? DEFAULT_SETTINGS.theme,
        firstDayOfWeek: settings.firstDayOfWeek ?? DEFAULT_SETTINGS.firstDayOfWeek,
        notificationsEnabled: settings.notificationsEnabled ?? DEFAULT_SETTINGS.notificationsEnabled,
        notificationThresholdDays: settings.notificationThresholdDays ?? DEFAULT_SETTINGS.notificationThresholdDays,
        projectInfo
      };

      const requiresRepair =
        settings.theme !== resolvedSettings.theme ||
        settings.firstDayOfWeek !== resolvedSettings.firstDayOfWeek ||
        settings.notificationsEnabled !== resolvedSettings.notificationsEnabled ||
        settings.notificationThresholdDays !== resolvedSettings.notificationThresholdDays ||
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
