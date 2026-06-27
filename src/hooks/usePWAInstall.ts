import { useCallback, useEffect, useState } from 'react';
import { detectPlatform, type PlatformInfo } from '../lib/platform-utils';
import { usePWA } from './usePWA';

interface PWAInstallState {
  platform: PlatformInfo;
  hasDismissedAndroidPrompt: boolean;
  showAndroidPrompt: boolean;
  showIOSPrompt: boolean;
  isInstalling: boolean;
}

export function usePWAInstall() {
  const { isInstallable, isInstalled, installApp: installPWA } = usePWA();
  const [state, setState] = useState<PWAInstallState>(() => ({
    platform: detectPlatform(),
    hasDismissedAndroidPrompt: false,
    showAndroidPrompt: false,
    showIOSPrompt: false,
    isInstalling: false
  }));

  useEffect(() => {
    setState(prev => ({
      ...prev,
      showAndroidPrompt:
        prev.platform.isAndroid &&
        prev.platform.canInstall &&
        isInstallable &&
        !isInstalled &&
        !prev.hasDismissedAndroidPrompt
    }));
  }, [isInstallable, isInstalled]);

  useEffect(() => {
    const { isIOS, canInstall } = state.platform;

    if (isIOS && canInstall && !isInstalled) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, showIOSPrompt: true }));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isInstalled, state.platform]);

  const installApp = useCallback(async () => {
    if (!isInstallable || isInstalled) return false;

    setState(prev => ({ ...prev, isInstalling: true }));

    try {
      await installPWA();
      setState(prev => ({
        ...prev,
        hasDismissedAndroidPrompt: true,
        showAndroidPrompt: false,
        isInstalling: false
      }));
      return true;
    } catch (error) {
      console.error('Error during app installation:', error);
      setState(prev => ({ ...prev, isInstalling: false }));
      return false;
    }
  }, [installPWA, isInstallable, isInstalled]);

  const dismissAndroidPrompt = useCallback(() => {
    setState(prev => ({
      ...prev,
      showAndroidPrompt: false,
      hasDismissedAndroidPrompt: true
    }));
  }, []);

  const dismissIOSPrompt = useCallback(() => {
    setState(prev => ({ ...prev, showIOSPrompt: false }));
  }, []);

  return {
    ...state,
    installApp,
    dismissAndroidPrompt,
    dismissIOSPrompt
  };
}
