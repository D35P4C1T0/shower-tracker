import { useCallback } from 'react';
import { useAppContext } from '../stores/AppContext';
import { SettingsService, MetadataService } from '../lib/database-service';
import type { UserSettings, Theme } from '../types';

export function useSettings() {
  const { state, dispatch } = useAppContext();

  // Update a specific setting
  const updateSetting = useCallback(async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      await SettingsService.updateSetting(key, value);
      dispatch({ type: 'UPDATE_SETTING', payload: { key, value } });
    } catch (error) {
      console.error('Failed to update setting:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save settings. Please try again.' });
      throw error;
    }
  }, [dispatch]);

  // Save all settings
  const saveSettings = useCallback(async (settings: UserSettings) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      await SettingsService.saveSettings(settings);
      dispatch({ type: 'SET_SETTINGS', payload: settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save settings. Please try again.' });
      throw error;
    }
  }, [dispatch]);

  // Theme-specific helpers
  const updateTheme = useCallback(async (theme: Theme) => {
    await updateSetting('theme', theme);
  }, [updateSetting]);

  // First day of week helpers
  const updateFirstDayOfWeek = useCallback(async (firstDayOfWeek: 0 | 1) => {
    await updateSetting('firstDayOfWeek', firstDayOfWeek);
  }, [updateSetting]);

  // Notification helpers
  const toggleNotifications = useCallback(async (enabled: boolean) => {
    await updateSetting('notificationsEnabled', enabled);
  }, [updateSetting]);

  const updateNotificationThreshold = useCallback(async (days: number) => {
    await updateSetting('notificationThresholdDays', days);
  }, [updateSetting]);



  // Notification check helpers
  const updateLastNotificationCheck = useCallback(async (date: Date) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      await MetadataService.setLastNotificationCheck(date);
      dispatch({ type: 'SET_LAST_NOTIFICATION_CHECK', payload: date });
    } catch (error) {
      console.error('Failed to update last notification check:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update notification status.' });
      throw error;
    }
  }, [dispatch]);

  // Check if notifications should be sent
  const shouldSendNotification = useCallback(() => {
    const { settings, lastNotificationCheck, showers } = state;
    
    if (!settings.notificationsEnabled) return false;
    
    // Get the last shower
    const lastShower = showers && showers.length > 0 ? showers[0] : null;
    if (!lastShower) return false;

    // Calculate time since last shower
    const timeSinceLastShower = new Date().getTime() - new Date(lastShower.timestamp).getTime();
    const daysSinceLastShower = timeSinceLastShower / (1000 * 60 * 60 * 24);

    // Check if threshold is exceeded
    if (daysSinceLastShower < settings.notificationThresholdDays) return false;

    // Check if we've already sent a notification recently
    if (lastNotificationCheck) {
      const timeSinceLastCheck = new Date().getTime() - new Date(lastNotificationCheck).getTime();
      const hoursSinceLastCheck = timeSinceLastCheck / (1000 * 60 * 60);
      
      // Don't send notifications more than once every 12 hours
      if (hoursSinceLastCheck < 12) return false;
    }

    return true;
  }, [state]);

  // Get current theme for system theme detection
  const getEffectiveTheme = useCallback((): 'light' | 'dark' => {
    if (state.settings.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return state.settings.theme;
  }, [state.settings.theme]);

  // Refresh settings from database
  const refreshSettings = useCallback(async () => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      const [settings, lastNotificationCheck] = await Promise.all([
        SettingsService.getSettings(),
        MetadataService.getLastNotificationCheck()
      ]);
      dispatch({ type: 'SET_SETTINGS', payload: settings });
      dispatch({ type: 'SET_LAST_NOTIFICATION_CHECK', payload: lastNotificationCheck });
    } catch (error) {
      console.error('Failed to refresh settings:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh settings. Please try again.' });
      throw error;
    }
  }, [dispatch]);

  return {
    settings: state.settings,
    lastNotificationCheck: state.lastNotificationCheck,
    isLoading: state.isLoading,
    error: state.error,
    updateSetting,
    saveSettings,
    updateTheme,
    updateFirstDayOfWeek,
    toggleNotifications,
    updateNotificationThreshold,

    updateLastNotificationCheck,
    shouldSendNotification,
    getEffectiveTheme,
    refreshSettings
  };
}