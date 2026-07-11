import { useState } from 'react';
import { Pencil, Trash2, Droplet, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useShowers } from '../hooks/useShowers';
import { useToast } from './toast';
import type { ShowerEntry } from '../types';
import { formatDate, isSameDay } from '../lib/calendar-utils';
import { cn } from '../lib/utils';

interface ShowerDetailsProps {
  date: Date;
  showers: ShowerEntry[];
  onClose?: () => void;
  onShowersChanged?: () => void;
}

export function getTimestampForAddedShower(date: Date, now: Date = new Date()): Date {
  if (isSameDay(date, now)) {
    return new Date(now);
  }

  const noonDate = new Date(date);
  noonDate.setHours(12, 0, 0, 0);
  return noonDate;
}

function formatTimeInput(timestamp: Date): string {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function applyTimeToDate(date: Date, timeValue: string): Date {
  const [hours, minutes] = timeValue.split(':').map(Number);
  const updatedDate = new Date(date);
  updatedDate.setHours(hours, minutes, 0, 0);
  return updatedDate;
}

function formatTime(timestamp: Date): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isFutureDay(date: Date, now: Date = new Date()): boolean {
  const startOfDate = new Date(date);
  startOfDate.setHours(0, 0, 0, 0);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return startOfDate.getTime() > startOfToday.getTime();
}

function useShowerTimeEditor(date: Date, onShowersChanged?: () => void) {
  const [showerToEdit, setShowerToEdit] = useState<ShowerEntry | null>(null);
  const [draftShowerTimestamp, setDraftShowerTimestamp] = useState<Date | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isDeletingShower, setIsDeletingShower] = useState(false);
  const [isSavingTime, setIsSavingTime] = useState(false);
  const { addShower, deleteShower, updateShower } = useShowers();
  const { success: showSuccess, error: showError } = useToast();
  const isCreatingShower = !showerToEdit && draftShowerTimestamp !== null;

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleEditClick = (shower: ShowerEntry) => {
    setDraftShowerTimestamp(null);
    setShowerToEdit(shower);
    setEditTime(formatTimeInput(new Date(shower.timestamp)));
    setEditNotes(shower.notes ?? '');
  };

  const handleAddShower = () => {
    const showerTimestamp = getTimestampForAddedShower(date);
    setShowerToEdit(null);
    setDraftShowerTimestamp(showerTimestamp);
    setEditTime(formatTimeInput(showerTimestamp));
    setEditNotes('');
  };

  const handleSaveTime = async () => {
    const baseTimestamp = showerToEdit?.timestamp ?? draftShowerTimestamp;
    if (!baseTimestamp || !editTime) return;

    setIsSavingTime(true);
    try {
      const updatedTimestamp = applyTimeToDate(new Date(baseTimestamp), editTime);
      if (updatedTimestamp.getTime() > new Date().getTime()) {
        showError('Failed to update shower time', 'Cannot record a shower in the future');
        return;
      }

      if (showerToEdit) {
        const notes = editNotes.trim() || undefined;
        const updates = notes === showerToEdit.notes
          ? { timestamp: updatedTimestamp }
          : { timestamp: updatedTimestamp, notes };
        await updateShower(showerToEdit.id, updates);
        showSuccess('Shower time updated', `Updated shower time to ${formatTime(updatedTimestamp)}.`);
      } else {
        const notes = editNotes.trim();
        if (notes) await addShower(updatedTimestamp, notes);
        else await addShower(updatedTimestamp);
        showSuccess('Shower added', `Added shower for ${formatDate(date)} at ${formatTime(updatedTimestamp)}.`);
      }

      setShowerToEdit(null);
      setDraftShowerTimestamp(null);
      setEditTime('');
      setEditNotes('');
      onShowersChanged?.();
    } catch (error) {
      showError(showerToEdit ? 'Failed to update shower time' : 'Failed to add shower', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSavingTime(false);
    }
  };

  const handleCancelEditTime = () => {
    setShowerToEdit(null);
    setDraftShowerTimestamp(null);
    setEditTime('');
    setEditNotes('');
  };

  const handleUseDefaultTime = async () => {
    if (!draftShowerTimestamp) {
      handleCancelEditTime();
      return;
    }

    setIsSavingTime(true);
    try {
      await addShower(draftShowerTimestamp);
      showSuccess('Shower added', `Added shower for ${formatDate(date)} at ${formatTime(draftShowerTimestamp)}.`);
      setDraftShowerTimestamp(null);
      setEditTime('');
      onShowersChanged?.();
    } catch (error) {
      showError('Failed to add shower', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSavingTime(false);
    }
  };

  const handleDeleteFromEdit = async () => {
    if (!showerToEdit) return;

    setIsDeletingShower(true);
    try {
      await deleteShower(showerToEdit.id);
      showSuccess('Shower deleted successfully');
      setShowerToEdit(null);
      setEditTime('');
      onShowersChanged?.();
    } catch (error) {
      showError('Failed to delete shower', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsDeletingShower(false);
    }
  };

  return {
    showerToEdit,
    draftShowerTimestamp,
    editTime,
    setEditTime,
    editNotes,
    setEditNotes,
    isCreatingShower,
    isDeletingShower,
    isSavingTime,
    handleEditClick,
    handleAddShower,
    handleSaveTime,
    handleCancelEditTime,
    handleUseDefaultTime,
    handleDeleteFromEdit,
  };
}

export function ShowerDetails({ date, showers, onClose, onShowersChanged }: ShowerDetailsProps) {
  const {
    showerToEdit,
    draftShowerTimestamp,
    editTime,
    setEditTime,
    editNotes,
    setEditNotes,
    isCreatingShower,
    isDeletingShower,
    isSavingTime,
    handleEditClick,
    handleAddShower,
    handleSaveTime,
    handleCancelEditTime,
    handleUseDefaultTime,
    handleDeleteFromEdit,
  } = useShowerTimeEditor(date, onShowersChanged);
  const isSelectedDateInFuture = isFutureDay(date);

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
          <div className="text-center py-4 text-muted-foreground space-y-3">
            <p>{isSelectedDateInFuture ? 'Cannot add showers for future days.' : 'No showers were recorded on this day.'}</p>
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddShower}
              disabled={isSavingTime || isSelectedDateInFuture}
              aria-label="Add shower"
              className="h-8 w-8"
              data-testid="add-shower-for-day"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-500 to-blue-300 dark:from-blue-400 dark:to-blue-600" />
            
            {/* Timeline items */}
            <div className="space-y-3">
              {showers.map((shower) => (
                <div key={shower.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-background flex items-center justify-center",
                    "bg-blue-500 dark:bg-blue-400"
                  )}>
                    <Droplet className="h-2.5 w-2.5 text-white fill-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="group relative rounded-md border bg-card hover:bg-accent/50 transition-colors p-2">
                    <div className="grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2">
                      <div aria-hidden="true" />
                      <div className="min-w-0 text-center">
                        <div className={cn(
                          'font-semibold text-sm',
                          shower.notes && 'mb-1'
                        )}>
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
                        size="icon"
                        onClick={() => handleEditClick(shower)}
                        className="h-8 w-8 shrink-0"
                        aria-label="Edit shower"
                        data-testid={`edit-shower-${shower.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-center pl-10">
              <Button
                variant="outline"
                size="icon"
                onClick={handleAddShower}
                disabled={isSavingTime || isSelectedDateInFuture}
                aria-label="Add shower"
                className="h-8 w-8"
                data-testid="add-shower-for-day"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={!!showerToEdit || !!draftShowerTimestamp} onOpenChange={(open) => !open && handleCancelEditTime()}>
        <DialogContent
          className="w-[calc(100vw-0.75rem)] max-w-sm gap-3 p-4"
          data-testid="edit-time-dialog"
        >
          <DialogHeader className="space-y-0 text-left">
            <DialogTitle className="text-base">Shower time</DialogTitle>
            <DialogDescription className="text-xs">
              {formatDate(date)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="shower-time">Time</Label>
            <Input
              id="shower-time"
              type="time"
              step={60}
              value={editTime}
              max={isSameDay(new Date(showerToEdit?.timestamp ?? draftShowerTimestamp ?? date), new Date()) ? formatTimeInput(new Date()) : undefined}
              onChange={(event) => setEditTime(event.target.value)}
              className="h-12 min-w-0 max-w-full text-base [appearance:textfield]"
              data-testid="edit-shower-time-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shower-notes">Notes</Label>
            <textarea
              id="shower-notes"
              value={editNotes}
              maxLength={1000}
              onChange={(event) => setEditNotes(event.target.value)}
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Optional notes"
              data-testid="edit-shower-notes"
            />
          </div>
          <div className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)] gap-2">
            {showerToEdit ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteFromEdit}
                disabled={isDeletingShower || isSavingTime}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                aria-label="Delete shower"
                data-testid="delete-shower-from-edit"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : (
              <div aria-hidden="true" />
            )}
            <Button
              variant="outline"
              onClick={isCreatingShower ? handleUseDefaultTime : handleCancelEditTime}
              disabled={isSavingTime || isDeletingShower}
              className="w-full"
              data-testid="use-default-shower-time"
            >
              {isCreatingShower ? 'Use default' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSaveTime}
              disabled={isSavingTime || isDeletingShower || !editTime}
              className="w-full"
              data-testid="save-shower-time"
            >
              {isSavingTime ? 'Saving...' : 'Save time'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
