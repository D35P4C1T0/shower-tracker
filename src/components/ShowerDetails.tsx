import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Pencil, Trash2, Droplet, Plus, Sunrise, Sun, Moon, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useShowers } from '../hooks/useShowers';
import { useToast } from './toast';
import type { ShowerEntry } from '../types';
import { formatDate, isSameDay } from '../lib/calendar-utils';
import { cn } from '../lib/utils';

const TIME_PRESETS = [
  { label: 'Morning', time: '08:00', icon: Sunrise },
  { label: 'Noon', time: '12:00', icon: Sun },
  { label: 'Evening', time: '20:00', icon: Moon },
];

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
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
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
    setShowNotes(!!shower.notes);
    setShowCustomTime(!TIME_PRESETS.some(preset => preset.time === formatTimeInput(new Date(shower.timestamp))));
  };

  const handleAddShower = () => {
    const showerTimestamp = getTimestampForAddedShower(date);
    setShowerToEdit(null);
    setDraftShowerTimestamp(showerTimestamp);
    setEditTime(formatTimeInput(showerTimestamp));
    setEditNotes('');
    setShowNotes(false);
    setShowCustomTime(!TIME_PRESETS.some(preset => preset.time === formatTimeInput(showerTimestamp)));
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
    showCustomTime,
    setShowCustomTime,
    showNotes,
    setShowNotes,
    isCreatingShower,
    isDeletingShower,
    isSavingTime,
    handleEditClick,
    handleAddShower,
    handleSaveTime,
    handleCancelEditTime,
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
    showCustomTime,
    setShowCustomTime,
    showNotes,
    setShowNotes,
    isCreatingShower,
    isDeletingShower,
    isSavingTime,
    handleEditClick,
    handleAddShower,
    handleSaveTime,
    handleCancelEditTime,
    handleDeleteFromEdit,
  } = useShowerTimeEditor(date, onShowersChanged);
  const isSelectedDateInFuture = isFutureDay(date);
  const drawerSwipeHandlers = useSwipeable({
    delta: 40,
    trackMouse: true,
    preventScrollOnSwipe: true,
    onSwipedDown: () => {
      if (!isSavingTime && !isDeletingShower) handleCancelEditTime();
    },
  });

  return (
    <Card className="app-fade-up app-fade-up-delay-2" data-testid="shower-details">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {date.toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
            <CardTitle className="text-lg">
              {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </CardTitle>
            <CardDescription className="text-xs">
              {showers.length === 0
                ? 'No showers recorded'
                : `${showers.length} shower${showers.length > 1 ? 's' : ''} recorded`
              }
            </CardDescription>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="-mr-2 -mt-2 h-11 w-11 shrink-0 rounded-full text-muted-foreground"
              aria-label="Close details"
              data-testid="close-modal"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showers.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground">
              <Droplet className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isSelectedDateInFuture ? 'Cannot add showers for future days.' : 'Log a shower to fill in this day.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60 overflow-hidden rounded-xl bg-muted/30">
            {showers.map((shower) => (
              <Button
                key={shower.id}
                variant="ghost"
                onClick={() => handleEditClick(shower)}
                className="h-auto min-h-16 w-full justify-start gap-3 whitespace-normal rounded-none px-3 py-3 text-left hover:bg-muted/60"
                aria-label="Edit shower"
                data-testid={`edit-shower-${shower.id}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Droplet className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold tabular-nums">
                    {formatTime(new Date(shower.timestamp))}
                  </span>
                  {shower.notes && (
                    <span className="mt-0.5 block break-words text-sm font-normal text-muted-foreground">
                      {shower.notes}
                    </span>
                  )}
                </span>
                <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Button>
            ))}
          </div>
        )}
        <Button
          variant="secondary"
          onClick={handleAddShower}
          disabled={isSavingTime || isSelectedDateInFuture}
          className="mt-4 h-11 w-full gap-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20"
          data-testid="add-shower-for-day"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add shower
        </Button>
      </CardContent>

      <Dialog open={!!showerToEdit || !!draftShowerTimestamp} onOpenChange={(open) => !open && handleCancelEditTime()}>
        <DialogContent
          className="app-shower-drawer top-auto bottom-0 w-full max-w-none sm:max-w-sm translate-y-0 grid-cols-1 gap-0 rounded-t-3xl rounded-b-none border-b-0 px-6 pt-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-5 sm:pb-[max(1.75rem,env(safe-area-inset-bottom))]"
          data-testid="edit-time-dialog"
        >
          <div
            {...drawerSwipeHandlers}
            className="-mt-3 flex h-11 touch-none select-none items-center justify-center"
            data-testid="shower-drawer-handle"
            aria-hidden="true"
          >
            <div className="h-1 w-8 rounded-full bg-muted-foreground/40" />
          </div>
          <DialogHeader className="mb-5 space-y-1 text-left">
            <DialogTitle className="text-lg">{isCreatingShower ? 'Add a shower' : 'Edit shower'}</DialogTitle>
            <DialogDescription className="text-xs">
              {formatDate(date)}
            </DialogDescription>
          </DialogHeader>
          <div className="h-16 min-w-0 overflow-hidden rounded-xl" data-testid="shower-time-selector">
            <div
              className="shower-time-track flex h-full w-[200%]"
              style={{ transform: showCustomTime ? 'translateX(-50%)' : 'translateX(0)' }}
            >
              <div
                className="shower-time-panel grid w-1/2 shrink-0 grid-cols-3 gap-2"
                role="group"
                aria-label="Time presets"
                aria-hidden={showCustomTime}
                inert={showCustomTime}
                style={{ visibility: showCustomTime ? 'hidden' : 'visible' }}
              >
                {TIME_PRESETS.map(({ label, time, icon: Icon }) => (
                  <Button
                    key={time}
                    variant="outline"
                    aria-label={`${label} · ${time}`}
                    title={`${label} · ${time}`}
                    aria-pressed={!showCustomTime && editTime === time}
                    disabled={isSavingTime || isDeletingShower || applyTimeToDate(date, time).getTime() > Date.now()}
                    onClick={() => {
                      setEditTime(time);
                      setShowCustomTime(false);
                    }}
                    className={cn(
                      'h-16 min-w-0 rounded-xl text-muted-foreground',
                      !showCustomTime && editTime === time && 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                    )}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </Button>
                ))}
              </div>
              <div
                id="shower-time-field"
                className="shower-time-panel w-1/2 min-w-0 shrink-0"
                aria-hidden={!showCustomTime}
                inert={!showCustomTime}
                style={{ visibility: showCustomTime ? 'visible' : 'hidden' }}
              >
                <Label htmlFor="shower-time" className="sr-only">Time</Label>
                <Input
                  id="shower-time"
                  type="time"
                  step={60}
                  value={editTime}
                  max={isSameDay(new Date(showerToEdit?.timestamp ?? draftShowerTimestamp ?? date), new Date()) ? formatTimeInput(new Date()) : undefined}
                  disabled={isSavingTime || isDeletingShower}
                  onChange={(event) => setEditTime(event.target.value)}
                  className="h-16 min-w-0 max-w-full appearance-none rounded-xl text-center text-lg"
                  data-testid="edit-shower-time-input"
                />
              </div>
            </div>
          </div>
          <div className="my-2 grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] items-center">
            <Button
              variant="ghost"
              className="h-11 min-w-0 gap-1.5 px-2 text-xs text-muted-foreground"
              aria-expanded={showNotes}
              aria-controls="shower-notes-field"
              onClick={() => setShowNotes(!showNotes)}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {showNotes ? 'Hide note' : editNotes ? 'Edit note' : 'Add a note'}
            </Button>
            <div className="h-4 bg-border" aria-hidden="true" />
            <Button
              variant="ghost"
              className="h-11 min-w-0 gap-1.5 px-2 text-xs text-muted-foreground"
              aria-expanded={showCustomTime}
              aria-controls="shower-time-field"
              onClick={() => setShowCustomTime(!showCustomTime)}
            >
              {showCustomTime
                ? <Sunrise className="h-3.5 w-3.5" aria-hidden="true" />
                : <Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
              {showCustomTime ? 'Time presets' : 'Custom time'}
            </Button>
          </div>
          <div id="shower-notes-field" className="mb-3 min-w-0 space-y-1.5" hidden={!showNotes}>
            <Label htmlFor="shower-notes" className="text-xs text-muted-foreground">Notes</Label>
            <textarea
              id="shower-notes"
              value={editNotes}
              maxLength={1000}
              disabled={isSavingTime || isDeletingShower}
              onChange={(event) => setEditNotes(event.target.value)}
              className="block min-h-16 w-full rounded-xl border border-input bg-background px-3 py-2 text-base"
              placeholder="Optional notes"
              data-testid="edit-shower-notes"
            />
          </div>
          <div className="flex min-w-0 gap-2">
            {showerToEdit && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={isDeletingShower || isSavingTime}
                    className="h-11 w-11 shrink-0 rounded-xl border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete shower"
                    data-testid="delete-shower-from-edit"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DialogTrigger>
                <DialogContent role="alertdialog" className="max-w-sm" data-testid="delete-shower-confirmation">
                  <DialogHeader>
                    <DialogTitle>Delete shower?</DialogTitle>
                    <DialogDescription>
                      This will permanently delete the shower recorded at {formatTime(new Date(showerToEdit.timestamp))} on {formatDate(date)}.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" disabled={isDeletingShower}>Cancel</Button>
                    </DialogClose>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteFromEdit}
                      disabled={isDeletingShower}
                      data-testid="confirm-delete-shower"
                    >
                      {isDeletingShower ? 'Deleting...' : 'Delete shower'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button
              onClick={handleSaveTime}
              disabled={isSavingTime || isDeletingShower || !editTime}
              className="h-11 min-w-0 flex-1 rounded-xl"
              data-testid="save-shower-time"
            >
              {isSavingTime ? 'Saving...' : isCreatingShower ? 'Save shower' : 'Save changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
