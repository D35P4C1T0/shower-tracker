/**
 * PWA Service - Handles service worker registration and PWA functionality
 */

export interface PWAUpdateInfo {
  isUpdateAvailable: boolean;
  updateServiceWorker: () => Promise<void>;
}

export interface PWAInstallInfo {
  isInstallable: boolean;
  isInstalled: boolean;
  installApp: () => Promise<void>;
}

export interface NetworkStatus {
  isOnline: boolean;
  isOfflineReady: boolean;
}

class PWAService {
  private updateCallback?: (info: PWAUpdateInfo) => void;
  private networkCallback?: (status: NetworkStatus) => void;
  private installPrompt: any = null;

  constructor() {
    this.setupNetworkListeners();
    this.setupInstallPromptListener();
  }

  /**
   * Register service worker and handle updates
   */
  async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                this.notifyUpdate(registration);
              }
            });
          }
        });

        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Set up network status listeners
   */
  private setupNetworkListeners(): void {
    const updateNetworkStatus = () => {
      const status: NetworkStatus = {
        isOnline: navigator.onLine,
        isOfflineReady: this.isOfflineReady()
      };
      
      if (this.networkCallback) {
        this.networkCallback(status);
      }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    // Initial status
    updateNetworkStatus();
  }

  /**
   * Set up install prompt listener
   */
  private setupInstallPromptListener(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e;
    });
  }

  /**
   * Check if app is offline ready
   */
  private isOfflineReady(): boolean {
    return 'serviceWorker' in navigator && 
           navigator.serviceWorker.controller !== null;
  }

  /**
   * Notify about available updates
   */
  private notifyUpdate(registration: ServiceWorkerRegistration): void {
    if (this.updateCallback) {
      this.updateCallback({
        isUpdateAvailable: true,
        updateServiceWorker: async () => {
          const newWorker = registration.waiting;
          if (newWorker) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    }
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): NetworkStatus {
    return {
      isOnline: navigator.onLine,
      isOfflineReady: this.isOfflineReady()
    };
  }

  /**
   * Get PWA install info
   */
  getInstallInfo(): PWAInstallInfo {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalled = isStandalone || !!(window.navigator as any)?.standalone;

    return {
      isInstallable: !!this.installPrompt && !isInstalled,
      isInstalled,
      installApp: async () => {
        if (this.installPrompt) {
          const result = await this.installPrompt.prompt();
          if (result.outcome === 'accepted') {
            this.installPrompt = null;
          }
        }
      }
    };
  }

  /**
   * Set callback for update notifications
   */
  onUpdateAvailable(callback: (info: PWAUpdateInfo) => void): void {
    this.updateCallback = callback;
  }

  /**
   * Set callback for network status changes
   */
  onNetworkStatusChange(callback: (status: NetworkStatus) => void): void {
    this.networkCallback = callback;
  }

  /**
   * Check if device supports notifications
   */
  supportsNotifications(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!this.supportsNotifications()) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  /**
   * Show notification (for testing offline functionality)
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-64x64.png',
        ...options
      });
    }
  }

  /**
   * Cache essential data for offline use
   */
  async cacheEssentialData(): Promise<void> {
    if ('caches' in window) {
      try {
        const cache = await caches.open('shower-tracker-data-v1');
        
        // Cache essential API endpoints or data
        const essentialUrls = [
          '/',
          '/manifest.json',
          '/pwa-192x192.png',
          '/pwa-512x512.png'
        ];

        await cache.addAll(essentialUrls);
        console.log('Essential data cached for offline use');
      } catch (error) {
        console.error('Failed to cache essential data:', error);
      }
    }
  }

  /**
   * Clear all caches (for development/testing)
   */
  async clearCaches(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    }
  }
}

// Export singleton instance
export const pwaService = new PWAService();