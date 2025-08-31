import { useState, useEffect, useCallback } from 'react';
import { detectPlatform, type PlatformInfo } from '../lib/platform-utils';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
  platform: PlatformInfo;
  deferredPrompt: BeforeInstallPromptEvent | null;
  showAndroidPrompt: boolean;
  showIOSPrompt: boolean;
  isInstalling: boolean;
}

export function usePWAInstall() {
  const [state, setState] = useState<PWAInstallState>(() => ({
    platform: detectPlatform(),
    deferredPrompt: null,
    showAndroidPrompt: false,
    showIOSPrompt: false,
    isInstalling: false
  }));

  // Handle beforeinstallprompt event for Android
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      
      setState(prev => ({
        ...prev,
        deferredPrompt: promptEvent,
        showAndroidPrompt: prev.platform.isAndroid && prev.platform.canInstall
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Show iOS prompt if conditions are met
  useEffect(() => {
    const { isIOS, canInstall } = state.platform;
    if (isIOS && canInstall) {
      // Delay showing iOS prompt to avoid overwhelming user
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, showIOSPrompt: true }));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [state.platform]);

  const installApp = useCallback(async () => {
    if (!state.deferredPrompt) return false;

    setState(prev => ({ ...prev, isInstalling: true }));

    try {
      await state.deferredPrompt.prompt();
      const choiceResult = await state.deferredPrompt.userChoice;
      
      setState(prev => ({
        ...prev,
        deferredPrompt: null,
        showAndroidPrompt: false,
        isInstalling: false
      }));

      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('Error during app installation:', error);
      setState(prev => ({ ...prev, isInstalling: false }));
      return false;
    }
  }, [state.deferredPrompt]);

  const dismissAndroidPrompt = useCallback(() => {
    setState(prev => ({
      ...prev,
      showAndroidPrompt: false,
      deferredPrompt: null
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