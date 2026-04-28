import { useEffect, useRef } from 'react';
import { usePWA } from '../hooks/usePWA';
import { Button } from './ui/button';

const PULL_TO_CHECK_THRESHOLD_PX = 80;

/**
 * Component that shows offline status and PWA update notifications
 */
export function OfflineIndicator() {
  const { 
    isOnline, 
    isOfflineReady, 
    isUpdateAvailable, 
    latestVersion,
    updateApp,
    checkForUpdates
  } = usePWA();
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      if (window.scrollY <= 0) {
        touchStartYRef.current = event.touches[0]?.clientY ?? null;
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const touchStartY = touchStartYRef.current;
      touchStartYRef.current = null;

      if (touchStartY === null || window.scrollY > 0) {
        return;
      }

      const touchEndY = event.changedTouches[0]?.clientY;
      if (touchEndY !== undefined && touchEndY - touchStartY >= PULL_TO_CHECK_THRESHOLD_PX) {
        void checkForUpdates();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [checkForUpdates]);

  if (isOnline && !isUpdateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium app-fade-in" data-testid="offline-indicator">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-yellow-900 rounded-full"></div>
            Offline. {isOfflineReady ? 'Core features are still available.' : 'Some features may not work.'}
          </div>
        </div>
      )}
      
      {/* Update available notification */}
      {isUpdateAvailable && (
        <div className="bg-blue-500 text-white px-4 py-2 text-center text-sm font-medium app-fade-in">
          <div className="flex items-center justify-center gap-4">
            <span>{latestVersion ? `Version ${latestVersion} is available!` : 'A new version is available!'}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={updateApp}
              className="bg-white text-blue-500 hover:bg-gray-100"
            >
              Update Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
