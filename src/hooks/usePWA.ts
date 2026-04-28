import { useCallback, useState, useEffect } from 'react';
import { pwaService, type PWAUpdateInfo, type PWAInstallInfo, type NetworkStatus } from '../lib/pwa-service';

/**
 * Hook for PWA functionality including updates, installation, and network status
 */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export function usePWA() {
  const [updateInfo, setUpdateInfo] = useState<PWAUpdateInfo>({
    isUpdateAvailable: false,
    currentVersion: undefined,
    latestVersion: undefined,
    updateServiceWorker: async () => {}
  });
  
  const [installInfo, setInstallInfo] = useState<PWAInstallInfo>({
    isInstallable: false,
    isInstalled: false,
    installApp: async () => {}
  });
  
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    isOfflineReady: false
  });

  useEffect(() => {
    // Initialize PWA service
    pwaService.registerServiceWorker();
    pwaService.cacheEssentialData();

    // Set up update listener
    pwaService.onUpdateAvailable(setUpdateInfo);
    
    // Set up network status listener
    pwaService.onNetworkStatusChange(setNetworkStatus);

    // Get initial states
    setInstallInfo(pwaService.getInstallInfo());
    setNetworkStatus(pwaService.getNetworkStatus());

    // Update install info periodically (in case prompt becomes available)
    const installCheckInterval = setInterval(() => {
      setInstallInfo(pwaService.getInstallInfo());
    }, 5000);
    const updateCheckInterval = setInterval(() => {
      void pwaService.checkForUpdates();
    }, UPDATE_CHECK_INTERVAL_MS);
    const checkOnFocus = () => {
      void pwaService.checkForUpdates();
    };
    const checkOnVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void pwaService.checkForUpdates();
      }
    };

    window.addEventListener('focus', checkOnFocus);
    document.addEventListener('visibilitychange', checkOnVisibilityChange);

    return () => {
      clearInterval(installCheckInterval);
      clearInterval(updateCheckInterval);
      window.removeEventListener('focus', checkOnFocus);
      document.removeEventListener('visibilitychange', checkOnVisibilityChange);
    };
  }, []);

  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    return await pwaService.requestNotificationPermission();
  };

  const showTestNotification = async (title: string, options?: NotificationOptions): Promise<void> => {
    await pwaService.showNotification(title, options);
  };

  const clearCaches = async (): Promise<void> => {
    await pwaService.clearCaches();
  };

  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    return await pwaService.checkForUpdates();
  }, []);

  return {
    // Update functionality
    isUpdateAvailable: updateInfo.isUpdateAvailable,
    currentVersion: updateInfo.currentVersion,
    latestVersion: updateInfo.latestVersion,
    updateApp: updateInfo.updateServiceWorker,
    checkForUpdates,
    
    // Installation functionality
    isInstallable: installInfo.isInstallable,
    isInstalled: installInfo.isInstalled,
    installApp: installInfo.installApp,
    
    // Network status
    isOnline: networkStatus.isOnline,
    isOfflineReady: networkStatus.isOfflineReady,
    
    // Notification functionality
    supportsNotifications: pwaService.supportsNotifications(),
    requestNotificationPermission,
    showTestNotification,
    
    // Development utilities
    clearCaches
  };
}
