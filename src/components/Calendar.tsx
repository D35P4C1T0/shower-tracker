import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CalendarSkeleton } from './loading-skeleton';
import { useShowers } from '../hooks/useShowers';
import { useSettings } from '../hooks/useSettings';
import type { ShowerEntry } from '../types';
import {
  generateCalendarGrid,
  getMonthName,
  getYear,
  getPreviousMonth,
  getNextMonth,
  getDayNames,
  isToday,
  formatDate,
  getFirstDayOfMonth,
  getLastDayOfMonth,
} from '../lib/calendar-utils';
import { cn } from '../lib/utils';

interface CalendarProps {
  onDayClick?: (date: Date, showers: ShowerEntry[]) => void;
  onTodaySelected?: (date: Date, showers: ShowerEntry[]) => void;
  refreshTrigger?: number;
}

interface LoadMonthOptions {
  clearDataOnError: boolean;
}

type MonthTransitionDirection = 'forward' | 'backward';

interface CalendarGridProps {
  dayNames: string[];
  calendarGrid: Array<Date | null>;
  hasShowers: (date: Date) => boolean;
  getShowerCount: (date: Date) => number;
  onDayClick: (date: Date) => void;
}

interface MonthOption {
  value: number;
  label: string;
}

function getLocalDateKey(date: Date): string {
  return [date.getFullYear(), `${date.getMonth() + 1}`.padStart(2, '0'), `${date.getDate()}`.padStart(2, '0')].join('-');
}

interface MonthPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthOptions: MonthOption[];
  selectedMonth: number;
  selectedYear: string;
  onSelectMonth: (month: number) => void;
  onSelectYear: (year: string) => void;
  onSubmit: () => void;
}

function CalendarGrid({
  dayNames,
  calendarGrid,
  hasShowers,
  getShowerCount,
  onDayClick,
}: CalendarGridProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((dayName) => (
          <div
            key={dayName}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {dayName}
          </div>
        ))}
      </div>

      <div className="grid h-[clamp(18rem,72vw,24rem)] grid-cols-7 grid-rows-6 gap-1 sm:h-[26rem]">
        {calendarGrid.map((date, index) => (
          <div
            key={date ? date.toISOString() : `empty-${index}`}
            className={cn('relative min-h-0 p-1', date && 'cursor-pointer')}
          >
            {date && (
              <button
                onClick={() => onDayClick(date)}
                data-date={getLocalDateKey(date)}
                className={cn(
                  'w-full h-full rounded-md border-2 border-transparent',
                  'flex flex-col items-center justify-center',
                  'text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  isToday(date) && 'border-primary bg-primary/10',
                  hasShowers(date) && 'bg-blue-100 dark:bg-blue-900/30 has-shower',
                  hasShowers(date) && isToday(date) && 'bg-primary/20'
                )}
                title={
                  hasShowers(date)
                    ? `${formatDate(date)} - ${getShowerCount(date)} shower${getShowerCount(date) > 1 ? 's' : ''}`
                    : formatDate(date)
                }
              >
                <span className="font-medium">{date.getDate()}</span>
                {hasShowers(date) && (
                  <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: Math.min(getShowerCount(date), 3) }).map((_, i) => (
                      <div
                        key={i}
                        data-testid="shower-dot"
                        className="w-1.5 h-1.5 rounded-full bg-blue-500"
                      />
                    ))}
                  </div>
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      <CalendarLegend />
    </div>
  );
}

function CalendarLegend() {
  return (
    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-4 border-t">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded border-2 border-primary bg-primary/10" />
        <span>Today</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        </div>
        <span>Has showers</span>
      </div>
    </div>
  );
}

function MonthPickerDialog({
  open,
  onOpenChange,
  monthOptions,
  selectedMonth,
  selectedYear,
  onSelectMonth,
  onSelectYear,
  onSubmit,
}: MonthPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-sm overflow-y-auto p-4 sm:max-w-md sm:p-6"
        data-testid="go-to-month-dialog"
      >
        <DialogHeader>
          <DialogTitle>Go to month</DialogTitle>
          <DialogDescription>
            Pick the month and year to show in the calendar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Month</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {monthOptions.map((month) => (
                <Button
                  key={month.value}
                  type="button"
                  variant={selectedMonth === month.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onSelectMonth(month.value)}
                  className="h-9 px-2"
                  data-testid={`month-option-${month.value}`}
                >
                  {month.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="go-to-year">Year</Label>
            <Input
              id="go-to-year"
              type="number"
              min={1900}
              max={2100}
              value={selectedYear}
              onChange={(event) => onSelectYear(event.target.value)}
              data-testid="go-to-year-input"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} data-testid="go-to-month-submit">
            Show month
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Calendar({ onDayClick, onTodaySelected, refreshTrigger = 0 }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthTransition, setMonthTransition] = useState<{
    direction: MonthTransitionDirection;
    previousDate: Date;
  } | null>(null);
  const [goToMonthOpen, setGoToMonthOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [monthShowers, setMonthShowers] = useState<ShowerEntry[]>([]);
  const [isMonthLoading, setIsMonthLoading] = useState(false);
  const [hasLoadedInitialMonth, setHasLoadedInitialMonth] = useState(false);

  const { getShowersByDateRange } = useShowers();
  const { settings } = useSettings();

  const requestIdRef = useRef(0);
  const currentDateRef = useRef(currentDate);
  const initialDateRef = useRef(currentDate);
  const previousRefreshTriggerRef = useRef(refreshTrigger);

  const loadMonthShowers = useCallback(async (date: Date, options: LoadMonthOptions): Promise<ShowerEntry[] | null> => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsMonthLoading(true);

    try {
      const startDate = getFirstDayOfMonth(date);
      const endDate = getLastDayOfMonth(date);
      const showers = await getShowersByDateRange(startDate, endDate);

      if (requestId === requestIdRef.current) {
        setMonthShowers(showers);
      }
      return showers;
    } catch (error) {
      if (requestId === requestIdRef.current) {
        console.error('Failed to load month showers:', error);
        if (options.clearDataOnError) {
          setMonthShowers([]);
        }
      }
      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        setIsMonthLoading(false);
        setHasLoadedInitialMonth(true);
      }
    }
  }, [getShowersByDateRange]);

  useEffect(() => {
    void loadMonthShowers(initialDateRef.current, {
      clearDataOnError: true,
    });
  }, [loadMonthShowers]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedInitialMonth) {
      return;
    }

    if (previousRefreshTriggerRef.current === refreshTrigger) {
      return;
    }

    previousRefreshTriggerRef.current = refreshTrigger;
    void loadMonthShowers(currentDateRef.current, {
      clearDataOnError: false,
    });
  }, [refreshTrigger, hasLoadedInitialMonth, loadMonthShowers]);

  const calendarGrid = useMemo(() => {
    return generateCalendarGrid(currentDate, settings.firstDayOfWeek);
  }, [currentDate, settings.firstDayOfWeek]);

  const dayNames = useMemo(() => {
    return getDayNames(settings.firstDayOfWeek);
  }, [settings.firstDayOfWeek]);

  const monthOptions = useMemo(() => (
    Array.from({ length: 12 }, (_, monthIndex) => ({
      value: monthIndex,
      label: new Date(2000, monthIndex, 1).toLocaleDateString('en-US', { month: 'short' }),
    }))
  ), []);

  const showersByDate = useMemo(() => {
    const grouped = new Map<string, ShowerEntry[]>();

    monthShowers.forEach((shower) => {
      const dateKey = new Date(shower.timestamp).toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(shower);
    });

    grouped.forEach((showers) => {
      showers.sort((first, second) =>
        new Date(first.timestamp).getTime() - new Date(second.timestamp).getTime()
      );
    });

    return grouped;
  }, [monthShowers]);

  const isSameMonth = (first: Date, second: Date): boolean => (
    first.getMonth() === second.getMonth() &&
    first.getFullYear() === second.getFullYear()
  );

  const getMonthDirection = (from: Date, to: Date): MonthTransitionDirection => {
    const fromMonthIndex = from.getFullYear() * 12 + from.getMonth();
    const toMonthIndex = to.getFullYear() * 12 + to.getMonth();
    return toMonthIndex > fromMonthIndex ? 'forward' : 'backward';
  };

  const renderMonthHeader = (date: Date, includeTestId = true) => (
    <>
      <CardTitle className="text-base sm:text-xl" data-testid={includeTestId ? 'calendar-month' : undefined}>
        {getMonthName(date)}
      </CardTitle>
      <span className="text-xs font-medium text-muted-foreground/70 tracking-wider uppercase mt-0.5" aria-label="Year">
        {getYear(date)}
      </span>
    </>
  );

  const navigateToMonth = async (nextDate: Date): Promise<ShowerEntry[] | null> => {
    const previousDate = currentDateRef.current;
    if (isSameMonth(previousDate, nextDate)) {
      return null;
    }

    setMonthTransition({
      direction: getMonthDirection(previousDate, nextDate),
      previousDate,
    });
    currentDateRef.current = nextDate;
    setCurrentDate(nextDate);
    return await loadMonthShowers(nextDate, {
      clearDataOnError: false,
    });
  };

  const goToPreviousMonth = () => {
    void navigateToMonth(getPreviousMonth(currentDate));
  };

  const goToNextMonth = () => {
    void navigateToMonth(getNextMonth(currentDate));
  };

  const goToToday = async () => {
    const today = new Date();

    if (isSameMonth(currentDateRef.current, today)) {
      onTodaySelected?.(today, showersByDate.get(today.toDateString()) || []);
      return;
    }

    const loadedShowers = await navigateToMonth(today);
    onTodaySelected?.(today, loadedShowers ? getShowersForDate(loadedShowers, today) : []);
  };

  const openGoToMonth = () => {
    setSelectedMonth(currentDate.getMonth());
    setSelectedYear(currentDate.getFullYear().toString());
    setGoToMonthOpen(true);
  };

  const handleGoToMonth = async () => {
    const year = Number(selectedYear);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      return;
    }

    setGoToMonthOpen(false);
    await navigateToMonth(new Date(year, selectedMonth, 1));
  };

  const handleDayClick = (date: Date) => {
    const dayShowers = showersByDate.get(date.toDateString()) || [];
    onDayClick?.(date, dayShowers);
  };

  const hasShowers = (date: Date): boolean => {
    return showersByDate.has(date.toDateString());
  };

  const getShowerCount = (date: Date): number => {
    return showersByDate.get(date.toDateString())?.length || 0;
  };

  const getShowersForDate = (showers: ShowerEntry[], date: Date): ShowerEntry[] => {
    const dateKey = date.toDateString();
    return showers.filter((shower) => new Date(shower.timestamp).toDateString() === dateKey);
  };

  if (!hasLoadedInitialMonth) {
    return <CalendarSkeleton />;
  }

  return (
    <>
      <Card data-testid="calendar" aria-busy={isMonthLoading}>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={openGoToMonth}
              className="group flex rounded-md text-left transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Open month picker"
              data-testid="calendar-month-trigger"
            >
              <div className="flex items-start gap-1.5">
                <ChevronDown
                  className="mt-1.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary"
                  aria-hidden="true"
                />
                <div className="relative h-11 w-24 overflow-hidden sm:h-12 sm:w-32">
                  {monthTransition && (
                    <div
                      className={cn(
                        'absolute inset-0 flex flex-col',
                        monthTransition.direction === 'forward'
                          ? 'calendar-month-exit-forward'
                          : 'calendar-month-exit-backward'
                      )}
                      aria-hidden="true"
                    >
                      {renderMonthHeader(monthTransition.previousDate, false)}
                    </div>
                  )}
                  <div
                    key={`${currentDate.getFullYear()}-${currentDate.getMonth()}`}
                    className={cn(
                      monthTransition ? 'absolute inset-0 flex flex-col' : 'flex flex-col',
                      monthTransition?.direction === 'forward' && 'calendar-month-enter-forward',
                      monthTransition?.direction === 'backward' && 'calendar-month-enter-backward'
                    )}
                    onAnimationEnd={() => setMonthTransition(null)}
                  >
                    {renderMonthHeader(currentDate)}
                  </div>
                </div>
              </div>
            </button>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="px-2 text-xs sm:px-3"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                aria-label="Previous month"
                className="px-2 sm:px-3"
                data-testid="prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                aria-label="Next month"
                className="px-2 sm:px-3"
                data-testid="next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          <CalendarGrid
            dayNames={dayNames}
            calendarGrid={calendarGrid}
            hasShowers={hasShowers}
            getShowerCount={getShowerCount}
            onDayClick={handleDayClick}
          />
        </CardContent>
      </Card>

      <MonthPickerDialog
        open={goToMonthOpen}
        onOpenChange={setGoToMonthOpen}
        monthOptions={monthOptions}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onSelectMonth={setSelectedMonth}
        onSelectYear={setSelectedYear}
        onSubmit={() => void handleGoToMonth()}
      />
    </>
  );
}
