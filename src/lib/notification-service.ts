import type { UserSettings } from '../types';

export type NotificationPermission = 'default' | 'granted' | 'denied';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export class NotificationService {
  private static readonly NOTIFICATION_TAG = 'shower-reminder';
  private static readonly DEFAULT_ICON = '/vite.svg';
  private static readonly DEFAULT_BADGE = '/vite.svg';

  /**
   * Check if notifications are supported in the current browser
   */
  static isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Get current notification permission status
   */
  static getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission as NotificationPermission;
  }

  /**
   * Request notification permission from the user
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Notifications are not supported in this browser');
      return 'denied';
    }

    if (this.getPermission() === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission as NotificationPermission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a notification with the given options
   */
  static async showNotification(options: NotificationOptions): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Notifications are not supported');
      return false;
    }

    const permission = this.getPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted:', permission);
      return false;
    }

    try {
      // Close any existing shower reminder notifications
      await this.closeExistingNotifications();

      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || this.DEFAULT_ICON,
        badge: options.badge || this.DEFAULT_BADGE,
        tag: options.tag || this.NOTIFICATION_TAG,
        requireInteraction: options.requireInteraction || false,
        silent: false
      });

      // Auto-close notification after 10 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }

  /**
   * Close existing notifications with the same tag
   */
  private static async closeExistingNotifications(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const notifications = await registration.getNotifications({
          tag: this.NOTIFICATION_TAG
        });
        
        notifications.forEach(notification => notification.close());
      } catch (error) {
        console.warn('Could not close existing notifications:', error);
      }
    }
  }

  /**
   * Generate friendly reminder messages based on days elapsed
   */
  static generateReminderMessage(daysSinceLastShower: number): { title: string; body: string } {
    const days = Math.floor(daysSinceLastShower);
    
    if (days === 1) {
      return {
        title: '🚿 Shower Reminder',
        body: "It's been a day since your last shower. Time to freshen up!"
      };
    } else if (days === 2) {
      return {
        title: '🚿 Shower Reminder',
        body: "It's been 2 days since your last shower. Your skin will thank you!"
      };
    } else if (days === 3) {
      return {
        title: '🚿 Shower Reminder',
        body: "It's been 3 days since your last shower. Time for some self-care!"
      };
    } else if (days <= 7) {
      return {
        title: '🚿 Shower Reminder',
        body: `It's been ${days} days since your last shower. Let's get clean!`
      };
    } else if (days <= 14) {
      return {
        title: '🚿 Shower Time!',
        body: `It's been ${days} days since your last shower. Your friends are starting to notice! 😅`
      };
    } else {
      return {
        title: '🚿 Urgent Shower Reminder!',
        body: `It's been ${days} days since your last shower. Time for an intervention! 🛁`
      };
    }
  }

  /**
   * Show a shower reminder notification
   */
  static async showShowerReminder(daysSinceLastShower: number): Promise<boolean> {
    const message = this.generateReminderMessage(daysSinceLastShower);
    
    return this.showNotification({
      title: message.title,
      body: message.body,
      tag: this.NOTIFICATION_TAG,
      requireInteraction: false
    });
  }

  /**
   * Check if we should send a notification based on settings and last shower
   */
  static shouldSendNotification(
    settings: UserSettings,
    lastShowerDate: Date | null,
    lastNotificationCheck: Date | null
  ): boolean {
    // Check if notifications are enabled
    if (!settings.notificationsEnabled) return false;

    // Check if we have permission
    if (this.getPermission() !== 'granted') return false;

    // Check if we have a last shower
    if (!lastShowerDate) return false;

    // Calculate time since last shower
    const now = new Date();
    const timeSinceLastShower = now.getTime() - lastShowerDate.getTime();
    const daysSinceLastShower = timeSinceLastShower / (1000 * 60 * 60 * 24);

    // Check if threshold is exceeded
    if (daysSinceLastShower < settings.notificationThresholdDays) return false;

    // Check if we've already sent a notification recently
    if (lastNotificationCheck) {
      const timeSinceLastCheck = now.getTime() - lastNotificationCheck.getTime();
      const hoursSinceLastCheck = timeSinceLastCheck / (1000 * 60 * 60);
      
      // Don't send notifications more than once every 12 hours
      if (hoursSinceLastCheck < 12) return false;
    }

    return true;
  }

  /**
   * Get user-friendly permission status message
   */
  static getPermissionStatusMessage(): string {
    const permission = this.getPermission();
    
    switch (permission) {
      case 'granted':
        return 'Notifications are enabled and working.';
      case 'denied':
        return 'Notifications are blocked. Please enable them in your browser settings to receive shower reminders.';
      case 'default':
        return 'Click to enable notifications for shower reminders.';
      default:
        return 'Notification status unknown.';
    }
  }

  /**
   * Get fallback message when notifications are not available
   */
  static getFallbackMessage(daysSinceLastShower: number): string {
    const days = Math.floor(daysSinceLastShower);
    
    if (days === 1) {
      return "⏰ Reminder: It's been a day since your last shower!";
    } else if (days <= 3) {
      return `⏰ Reminder: It's been ${days} days since your last shower!`;
    } else if (days <= 7) {
      return `⏰ Reminder: It's been ${days} days since your last shower. Time to freshen up!`;
    } else {
      return `⏰ Urgent: It's been ${days} days since your last shower!`;
    }
  }
}