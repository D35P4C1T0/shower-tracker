import { usePWAInstall } from '../hooks/usePWAInstall';
import { AndroidInstallPrompt } from './android-install-prompt';
import { IOSInstallPrompt } from './ios-install-prompt';

export function PWAInstallPrompt() {
  const {
    platform,
    showAndroidPrompt,
    showIOSPrompt,
    isInstalling,
    installApp,
    dismissAndroidPrompt,
    dismissIOSPrompt
  } = usePWAInstall();

  // Don't render anything if app is already installed or can't be installed
  if (platform.isStandalone || !platform.canInstall) {
    return null;
  }

  if (showAndroidPrompt && platform.isAndroid) {
    return (
      <AndroidInstallPrompt
        onInstall={installApp}
        onDismiss={dismissAndroidPrompt}
        isInstalling={isInstalling}
      />
    );
  }

  if (showIOSPrompt && platform.isIOS) {
    return (
      <IOSInstallPrompt
        onDismiss={dismissIOSPrompt}
      />
    );
  }

  return null;
}