import { Smartphone, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface AndroidInstallPromptProps {
  onInstall: () => Promise<boolean>;
  onDismiss: () => void;
  isInstalling: boolean;
}

export function AndroidInstallPrompt({ onInstall, onDismiss, isInstalling }: AndroidInstallPromptProps) {
  const handleInstall = async () => {
    const success = await onInstall();
    if (success) {
      // Installation was accepted, component will be unmounted
      return;
    }
    // If installation was dismissed, the prompt will be hidden by the hook
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center p-4 z-50">
      <Card className="w-full max-w-sm animate-in slide-in-from-bottom-4">
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
              disabled={isInstalling}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Add Shower Tracker to your home screen for quick access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Works offline</p>
              <p>Access your shower history anytime</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1"
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </Button>
            <Button
              variant="outline"
              onClick={onDismiss}
              disabled={isInstalling}
            >
              Not now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}