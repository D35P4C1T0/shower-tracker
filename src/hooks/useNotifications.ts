import { useCallback, useEffect, useRef } from 'react';
import { useAppContext } from '../stores/AppContext';
import { NotificationService, type NotificationPermission } from '../lib/notification-service';
import { MetadataService } from '../lib/database-service';

export function useNotifications() {
  const { state, dispatch } = useAppContext();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Request notification permission from the user
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const permission = await NotificationService.requestPermission();
      
      if (permission === 'granted') {
        // If permission was granted, enable notifications in settings
        dispatch({ 
          type: 'UPDATE_SETTING', 
          payload: { key: 'notificationsEnabled', value: true } 
        });
      }
      
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }, [dispatch]);

  /**
   * Check if a notification should be sent and send it
   */
  const checkAndSendNotification = useCallback(async (): Promise<boolean> => {
    try {
      const { settings, showers } = state;
      
      // Get the last shower
      const lastShower = showers && showers.length > 0 ? showers[0] : null;
      const lastShowerDate = lastShower ? new Date(lastShower.timestamp) : null;
      
      // Check if we should send a notification
      const shouldSend = NotificationService.shouldSendNotification(
        settings,
        lastShowerDate,
        state.lastNotificationCheck
      );

      if (!shouldSend) return false;

      // Calculate days since last shower
      const now = new Date();
      const timeSinceLastShower = lastShowerDate 
        ? now.getTime() - lastShowerDate.getTime()
        : 0;
      const daysSinceLastShower = timeSinceLastShower / (1000 * 60 * 60 * 24);

      // Send the notification
      const notificationSent = await NotificationService.showShowerReminder(daysSinceLastShower);

      if (notificationSent) {
        // Update last notification check time
        const checkTime = new Date();
        await MetadataService.setLastNotificationCheck(checkTime);
        dispatch({ 
          type: 'SET_LAST_NOTIFICATION_CHECK', 
          payload: checkTime 
        });
        
        console.log('Shower reminder notification sent');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to check and send notification:', error);
      return false;
    }
  }, [state, dispatch]);

  /**
   * Start periodic notification checking
   */
  const startNotificationChecking = useCallback(() => {
    // Clear any existing interval
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    // Check immediately
    checkAndSendNotification();

    // Set up periodic checking every 30 minutes
    checkIntervalRef.current = setInterval(() => {
      checkAndSendNotification();
    }, 30 * 60 * 1000); // 30 minutes

    console.log('Started notification checking');
  }, [checkAndSendNotification]);

  /**
   * Stop periodic notification checking
   */
  const stopNotificationChecking = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
      console.log('Stopped notification checking');
    }
  }, []);

  /**
   * Get current notification permission status
   */
  const getPermissionStatus = useCallback((): NotificationPermission => {
    return NotificationService.getPermission();
  }, []);

  /**
   * Check if notifications are supported
   */
  const isSupported = useCallback((): boolean => {
    return NotificationService.isSupported();
  }, []);

  /**
   * Get user-friendly permission status message
   */
  const getPermissionStatusMessage = useCallback((): string => {
    return NotificationService.getPermissionStatusMessage();
  }, []);

  /**
   * Get fallback message for when notifications can't be sent
   */
  const getFallbackMessage = useCallback((): string | null => {
    const { settings, showers } = state;
    
    if (!settings.notificationsEnabled) return null;
    
    const lastShower = showers && showers.length > 0 ? showers[0] : null;
    if (!lastShower) return null;

    const now = new Date();
    const timeSinceLastShower = now.getTime() - new Date(lastShower.timestamp).getTime();
    const daysSinceLastShower = timeSinceLastShower / (1000 * 60 * 60 * 24);

    if (daysSinceLastShower >= settings.notificationThresholdDays) {
      return NotificationService.getFallbackMessage(daysSinceLastShower);
    }

    return null;
  }, [state]);

  /**
   * Test notification functionality
   */
  const testNotification = useCallback(async (): Promise<boolean> => {
    try {
      const permission = getPermissionStatus();
      
      if (permission !== 'granted') {
        console.warn('Cannot test notification: permission not granted');
        return false;
      }

      return await NotificationService.showNotification({
        title: '🚿 Test Notification',
        body: 'This is a test notification from Shower Tracker. Notifications are working!',
        tag: 'test-notification'
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }, [getPermissionStatus]);

  // Set up notification checking when notifications are enabled
  useEffect(() => {
    if (state.settings.notificationsEnabled && getPermissionStatus() === 'granted') {
      startNotificationChecking();
    } else {
      stopNotificationChecking();
    }

    // Cleanup on unmount
    return () => {
      stopNotificationChecking();
    };
  }, [state.settings.notificationsEnabled, startNotificationChecking, stopNotificationChecking, getPermissionStatus]);

  // Check for notifications on app startup
  useEffect(() => {
    if (!state.isLoading && state.settings.notificationsEnabled) {
      // Delay initial check to allow UI to settle
      const timeoutId = setTimeout(() => {
        checkAndSendNotification();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [state.isLoading, state.settings.notificationsEnabled, checkAndSendNotification]);

  return {
    // Permission management
    requestPermission,
    getPermissionStatus,
    getPermissionStatusMessage,
    isSupported,
    
    // Notification checking
    checkAndSendNotification,
    startNotificationChecking,
    stopNotificationChecking,
    
    // Utility functions
    getFallbackMessage,
    testNotification,
    
    // State
    isEnabled: state.settings.notificationsEnabled,
    hasPermission: getPermissionStatus() === 'granted',
    lastCheck: state.lastNotificationCheck
  };
}