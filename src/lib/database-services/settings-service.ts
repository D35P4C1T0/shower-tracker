import { db, type DBUserSettings } from '../database';
import { FallbackSettingsService } from '../storage-fallback';
import type { UserSettings } from '../../types';
import { DEFAULT_SETTINGS } from './default-settings';
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
}
