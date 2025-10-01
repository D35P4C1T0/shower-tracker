import { useState } from 'react';
import { Trash2, Droplet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { useShowers } from '../hooks/useShowers';
import { useToast } from './toast';
import type { ShowerEntry } from '../types';
import { formatDate } from '../lib/calendar-utils';
import { cn } from '../lib/utils';

interface ShowerDetailsProps {
  date: Date;
  showers: ShowerEntry[];
  onClose?: () => void;
  onShowerDeleted?: () => void;
}

export function ShowerDetails({ date, showers, onClose, onShowerDeleted }: ShowerDetailsProps) {
  const [showerToDelete, setShowerToDelete] = useState<ShowerEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteShower } = useShowers();
  const { success: showSuccess, error: showError } = useToast();

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDeleteClick = (shower: ShowerEntry) => {
    setShowerToDelete(shower);
  };

  const handleConfirmDelete = async () => {
    if (!showerToDelete) return;

    setIsDeleting(true);
    try {
      await deleteShower(showerToDelete.id);
      showSuccess('Shower deleted successfully');
      setShowerToDelete(null);
      onShowerDeleted?.();
    } catch (error) {
      showError('Failed to delete shower', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowerToDelete(null);
  };

  return (
    <Card data-testid="shower-details">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {formatDate(date)}
            </CardTitle>
            <CardDescription>
              {showers.length === 0 
                ? 'No showers recorded'
                : `${showers.length} shower${showers.length > 1 ? 's' : ''} recorded`
              }
            </CardDescription>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close details"
              data-testid="close-modal"
            >
              ✕
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No showers were recorded on this day.
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-500 to-blue-300 dark:from-blue-400 dark:to-blue-600" />
            
            {/* Timeline items */}
            <div className="space-y-6">
              {showers.map((shower) => (
                <div key={shower.id} className="relative pl-12">
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute left-3 top-1 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center",
                    "bg-blue-500 dark:bg-blue-400"
                  )}>
                    <Droplet className="h-3 w-3 text-white fill-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="group relative rounded-lg border bg-card hover:bg-accent/50 transition-colors p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-semibold text-base mb-1">
                          {formatTime(new Date(shower.timestamp))}
                        </div>
                        {shower.notes && (
                          <div className="text-sm text-muted-foreground">
                            {shower.notes}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(shower)}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground shrink-0"
                        aria-label="Delete shower"
                        data-testid={`delete-shower-${shower.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showerToDelete} onOpenChange={(open) => !open && handleCancelDelete()}>
        <DialogContent data-testid="dialog-content">
          <DialogHeader>
            <DialogTitle data-testid="dialog-title">Delete Shower?</DialogTitle>
            <DialogDescription data-testid="dialog-description">
              {showerToDelete && (
                <>
                  Delete shower from {formatTime(new Date(showerToDelete.timestamp))}? This cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              data-testid="confirm-delete"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}