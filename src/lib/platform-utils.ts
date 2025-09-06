/**
 * Platform detection utilities for PWA installation prompts
 */

export interface PlatformInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isMobile: boolean;
  isStandalone: boolean;
  canInstall: boolean;
}

/**
 * Detects the current platform and installation capabilities
 */
export function detectPlatform(): PlatformInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const isAndroid = /android/.test(userAgent);
  const isIOS = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
  const isMobile = isAndroid || isIOS || /mobile/.test(userAgent);
  
  // Check if app is already running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator && (window.navigator as any).standalone === true) ||
    document.referrer.includes('android-app://');

  // Check if installation is possible
  const canInstall = !isStandalone && (
    isAndroid || // Android supports beforeinstallprompt
    (isIOS && !isStandalone) // iOS can be installed manually
  );

  return {
    isAndroid,
    isIOS,
    isMobile,
    isStandalone,
    canInstall
  };
}

/**
 * Checks if the beforeinstallprompt event is supported
 */
export function supportsInstallPrompt(): boolean {
  return 'BeforeInstallPromptEvent' in window || 'onbeforeinstallprompt' in window;
}