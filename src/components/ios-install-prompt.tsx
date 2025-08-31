import { Share, Plus, X, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface IOSInstallPromptProps {
  onDismiss: () => void;
}

export function IOSInstallPrompt({ onDismiss }: IOSInstallPromptProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-sm animate-in fade-in-0 zoom-in-95">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Install App</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Add Shower Tracker to your home screen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Tap the Share button</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Share className="h-3 w-3" />
                  <span>in Safari's toolbar</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Select "Add to Home Screen"</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Plus className="h-3 w-3" />
                  <span>from the share menu</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Tap "Add" to confirm</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The app will appear on your home screen
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="h-4 w-4 text-primary" />
              <span className="font-medium">Works offline</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Access your shower history anytime, even without internet
            </p>
          </div>

          <Button onClick={onDismiss} className="w-full">
            Got it
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}