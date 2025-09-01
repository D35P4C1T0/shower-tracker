import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pwaService } from '../pwa-service';

describe('PWAService', () => {
  let mockServiceWorkerRegister: any;
  let mockNotificationRequestPermission: any;
  let mockCachesOpen: any;
  let mockCachesKeys: any;
  let mockCachesDelete: any;
  let mockCacheAddAll: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup service worker mocks
    mockServiceWorkerRegister = vi.fn().mockResolvedValue({
      addEventListener: vi.fn(),
      installing: null,
      waiting: null,
      active: null
    });

    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: {
        register: mockServiceWorkerRegister,
        ready: Promise.resolve({
          showNotification: vi.fn()
        }),
        controller: null
      },
      writable: true
    });

    // Setup notification mocks
    mockNotificationRequestPermission = vi.fn().mockResolvedValue('granted');
    
    // Create a mock Notification constructor
    const MockNotification = vi.fn() as any;
    MockNotification.permission = 'default';
    MockNotification.requestPermission = mockNotificationRequestPermission;
    
    Object.defineProperty(window, 'Notification', {
      value: MockNotification,
      writable: true,
      configurable: true
    });

    // Setup caches mocks
    mockCacheAddAll = vi.fn().mockResolvedValue(undefined);
    mockCachesOpen = vi.fn().mockResolvedValue({
      addAll: mockCacheAddAll,
      add: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      match: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(true)
    });
    mockCachesKeys = vi.fn().mockResolvedValue(['cache1', 'cache2']);
    mockCachesDelete = vi.fn().mockResolvedValue(true);

    Object.defineProperty(window, 'caches', {
      value: {
        open: mockCachesOpen,
        keys: mockCachesKeys,
        delete: mockCachesDelete,
        has: vi.fn().mockResolvedValue(false),
        match: vi.fn().mockResolvedValue(undefined)
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('registerServiceWorker', () => {
    it('should register service worker successfully', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await pwaService.registerServiceWorker();

      expect(mockServiceWorkerRegister).toHaveBeenCalledWith('/sw.js');
      expect(consoleSpy).toHaveBeenCalledWith('Service Worker registered successfully');
    });

    it('should handle service worker registration failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockServiceWorkerRegister.mockRejectedValue(new Error('Registration failed'));

      await pwaService.registerServiceWorker();

      expect(consoleSpy).toHaveBeenCalledWith('Service Worker registration failed:', expect.any(Error));
    });

    it('should not register if service worker is not supported', async () => {
      // Remove service worker support
      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: undefined,
        writable: true
      });

      await pwaService.registerServiceWorker();

      expect(mockServiceWorkerRegister).not.toHaveBeenCalled();
    });
  });

  describe('getNetworkStatus', () => {
    it('should return correct online status', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        value: true,
        writable: true
      });
      
      const status = pwaService.getNetworkStatus();
      
      expect(status.isOnline).toBe(true);
      expect(status.isOfflineReady).toBe(false);
    });

    it('should detect offline ready state when service worker is active', () => {
      Object.defineProperty(window.navigator, 'serviceWorker', {
        value: {
          ...window.navigator.serviceWorker,
          controller: {} as any
        },
        writable: true
      });
      
      const status = pwaService.getNetworkStatus();
      
      expect(status.isOfflineReady).toBe(true);
    });
  });

  describe('getInstallInfo', () => {
    it('should return correct install info when not installed', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => ({ matches: false })),
        writable: true
      });

      const info = pwaService.getInstallInfo();
      
      expect(info.isInstalled).toBe(false);
      expect(info.isInstallable).toBe(false);
    });

    it('should detect standalone mode as installed', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => ({ matches: true })),
        writable: true
      });

      const info = pwaService.getInstallInfo();
      
      expect(info.isInstalled).toBe(true);
    });
  });

  describe('requestNotificationPermission', () => {
    it('should request permission when default', async () => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'default',
        writable: true
      });

      const permission = await pwaService.requestNotificationPermission();

      expect(mockNotificationRequestPermission).toHaveBeenCalled();
      expect(permission).toBe('granted');
    });

    it('should return current permission when already set', async () => {
      Object.defineProperty(window.Notification, 'permission', {
        value: 'granted',
        writable: true
      });

      const permission = await pwaService.requestNotificationPermission();

      expect(mockNotificationRequestPermission).not.toHaveBeenCalled();
      expect(permission).toBe('granted');
    });

    it('should return denied when notifications not supported', async () => {
      // @ts-ignore - intentionally setting to undefined for test
      delete (window as any).Notification;

      const permission = await pwaService.requestNotificationPermission();

      expect(permission).toBe('denied');
    });
  });

  describe('cacheEssentialData', () => {
    it('should cache essential URLs', async () => {
      await pwaService.cacheEssentialData();

      expect(mockCachesOpen).toHaveBeenCalledWith('shower-tracker-data-v1');
      expect(mockCacheAddAll).toHaveBeenCalledWith([
        '/',
        '/manifest.json',
        '/pwa-192x192.png',
        '/pwa-512x512.png'
      ]);
    });

    it('should handle caching errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockCachesOpen.mockRejectedValue(new Error('Cache error'));

      await pwaService.cacheEssentialData();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to cache essential data:', expect.any(Error));
    });

    it('should not cache when caches API is not available', async () => {
      Object.defineProperty(window, 'caches', {
        value: undefined,
        writable: true
      });

      await pwaService.cacheEssentialData();

      expect(mockCachesOpen).not.toHaveBeenCalled();
    });
  });

  describe('clearCaches', () => {
    it('should clear all caches', async () => {
      await pwaService.clearCaches();

      expect(mockCachesKeys).toHaveBeenCalled();
      expect(mockCachesDelete).toHaveBeenCalledTimes(2);
      expect(mockCachesDelete).toHaveBeenCalledWith('cache1');
      expect(mockCachesDelete).toHaveBeenCalledWith('cache2');
    });
  });

  describe('supportsNotifications', () => {
    it('should return true when notifications and service worker are supported', () => {
      expect(pwaService.supportsNotifications()).toBe(true);
    });

    it('should return false when notifications are not supported', () => {
      // @ts-ignore - intentionally setting to undefined for test
      delete (window as any).Notification;

      expect(pwaService.supportsNotifications()).toBe(false);
    });

    it('should return false when service worker is not supported', () => {
      // @ts-ignore - intentionally setting to undefined for test
      delete (window.navigator as any).serviceWorker;

      expect(pwaService.supportsNotifications()).toBe(false);
    });
  });
});