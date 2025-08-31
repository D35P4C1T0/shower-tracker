import { usePWA } from '../hooks/usePWA';
import { Button } from './ui/button';

/**
 * Component that shows offline status and PWA update notifications
 */
export function OfflineIndicator() {
  const { 
    isOnline, 
    isOfflineReady, 
    isUpdateAvailable, 
    updateApp 
  } = usePWA();

  if (isOnline && !isUpdateAvailable) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-yellow-900 rounded-full"></div>
            You're offline. {isOfflineReady ? 'Core features are still available.' : 'Some features may not work.'}
          </div>
        </div>
      )}
      
      {/* Update available notification */}
      {isUpdateAvailable && (
        <div className="bg-blue-500 text-white px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-4">
            <span>A new version is available!</span>
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