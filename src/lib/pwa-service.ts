/**
 * PWA Service - Handles service worker registration and PWA functionality
 */
import { APP_BUILD_ID, APP_COMMIT, APP_VERSION } from './app-version';

export interface PWAUpdateInfo {
  isUpdateAvailable: boolean;
  currentVersion?: string;
  latestVersion?: string;
  currentBuildId?: string;
  latestBuildId?: string;
  updateServiceWorker: () => Promise<void>;
}

interface AppVersionMetadata {
  buildId?: string;
  commit?: string;
  version?: string;
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

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface BeforeInstallPromptChoice {
  outcome: 'accepted' | 'dismissed';
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<BeforeInstallPromptChoice>;
}

class PWAService {
  private updateCallback?: (info: PWAUpdateInfo) => void;
  private networkCallback?: (status: NetworkStatus) => void;
  private installPrompt: BeforeInstallPromptEvent | null = null;
  private pendingUpdateInfo?: PWAUpdateInfo;
  private registration?: ServiceWorkerRegistration;
  private isReloadingForUpdate = false;

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
        const swUrl = this.withBasePath('sw.js');
        const registration = await navigator.serviceWorker.register(swUrl, {
          updateViaCache: 'none'
        });
        this.registration = registration;
        
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

        await this.checkForUpdates();
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
    const emitStatus = (online: boolean) => {
      const status: NetworkStatus = {
        isOnline: online,
        isOfflineReady: this.isOfflineReady()
      };
      if (this.networkCallback) {
        this.networkCallback(status);
      }
    };

    // Use explicit boolean based on event rather than navigator.onLine, which can be unreliable in WebKit headless
    window.addEventListener('online', () => emitStatus(true));
    window.addEventListener('offline', () => emitStatus(false));

    // Initial status from navigator as a starting point
    emitStatus(navigator.onLine);
  }

  /**
   * Set up install prompt listener
   */
  private setupInstallPromptListener(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as BeforeInstallPromptEvent;
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
  private notifyUpdate(registration?: ServiceWorkerRegistration, latestMetadata?: AppVersionMetadata): void {
    const updateInfo: PWAUpdateInfo = {
      isUpdateAvailable: true,
      currentVersion: APP_VERSION,
      latestVersion: latestMetadata?.version,
      currentBuildId: APP_BUILD_ID,
      latestBuildId: latestMetadata?.buildId,
      updateServiceWorker: async () => {
        await this.applyUpdate(registration, latestMetadata?.buildId ?? latestMetadata?.version);
      }
    };

    this.pendingUpdateInfo = updateInfo;

    if (this.updateCallback) {
      this.updateCallback(updateInfo);
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
    const standaloneNavigator = window.navigator as NavigatorWithStandalone;
    const isInstalled = isStandalone || !!standaloneNavigator.standalone;

    return {
      isInstallable: !!this.installPrompt && !isInstalled,
      isInstalled,
      installApp: async () => {
        if (this.installPrompt) {
          await this.installPrompt.prompt();
          const result = await this.installPrompt.userChoice;
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
    if (this.pendingUpdateInfo) {
      callback(this.pendingUpdateInfo);
    }
  }

  /**
   * Check for updated app shell and service worker.
   */
  async checkForUpdates(): Promise<boolean> {
    try {
      if (this.registration) {
        await this.registration.update();
      }

      const response = await fetch(this.withBasePath('version.json'), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        return false;
      }

      const metadata = await response.json() as AppVersionMetadata;
      const latestBuildId = metadata.buildId ?? metadata.commit ?? metadata.version;
      const currentBuildId = APP_BUILD_ID ?? APP_COMMIT ?? APP_VERSION;
      if (latestBuildId && latestBuildId !== currentBuildId) {
        this.notifyUpdate(this.registration, metadata);
        return true;
      }
    } catch (error) {
      console.warn('Failed to check for app updates:', error);
    }

    return false;
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
        icon: this.withBasePath('pwa-192x192.png'),
        badge: this.withBasePath('pwa-64x64.png'),
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
          this.withBasePath('/'),
          this.withBasePath('manifest.webmanifest'),
          this.withBasePath('pwa-192x192.png'),
          this.withBasePath('pwa-512x512.png')
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

  private async applyUpdate(registration?: ServiceWorkerRegistration, latestVersion?: string): Promise<void> {
    if (this.isReloadingForUpdate) {
      return;
    }

    this.isReloadingForUpdate = true;

    const newWorker = registration?.waiting ?? this.registration?.waiting;
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
    }

    await this.clearCaches();
    await this.registration?.update();

    const url = new URL(window.location.href);
    url.searchParams.set('app-version', latestVersion ?? Date.now().toString());
    window.location.replace(url.toString());
  }

  private withBasePath(path: string): string {
    const baseUrl = import.meta.env.BASE_URL || '/';
    return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }
}

// Export singleton instance
export const pwaService = new PWAService();
