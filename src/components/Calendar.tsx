import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
  commitDate: boolean;
  clearDataOnError: boolean;
}

export function Calendar({ onDayClick, onTodaySelected, refreshTrigger = 0 }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthShowers, setMonthShowers] = useState<ShowerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedInitialMonth, setHasLoadedInitialMonth] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { getShowersByDateRange } = useShowers();
  const { settings } = useSettings();

  const requestIdRef = useRef(0);
  const initialDateRef = useRef(currentDate);

  const loadMonthShowers = useCallback(async (date: Date, options: LoadMonthOptions): Promise<ShowerEntry[] | null> => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);

    try {
      const startDate = getFirstDayOfMonth(date);
      const endDate = getLastDayOfMonth(date);
      const showers = await getShowersByDateRange(startDate, endDate);

      if (requestId === requestIdRef.current) {
        setMonthShowers(showers);
        if (options.commitDate) {
          setCurrentDate(date);
        }
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
        setIsLoading(false);
        setHasLoadedInitialMonth(true);
      }
    }
  }, [getShowersByDateRange]);

  useEffect(() => {
    void loadMonthShowers(initialDateRef.current, {
      commitDate: false,
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

    void loadMonthShowers(currentDate, {
      commitDate: false,
      clearDataOnError: false,
    });
  }, [refreshTrigger, hasLoadedInitialMonth, currentDate, loadMonthShowers]);

  const calendarGrid = useMemo(() => {
    return generateCalendarGrid(currentDate, settings.firstDayOfWeek);
  }, [currentDate, settings.firstDayOfWeek]);

  const dayNames = useMemo(() => {
    return getDayNames(settings.firstDayOfWeek);
  }, [settings.firstDayOfWeek]);

  const showersByDate = useMemo(() => {
    const grouped = new Map<string, ShowerEntry[]>();

    monthShowers.forEach((shower) => {
      const dateKey = new Date(shower.timestamp).toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(shower);
    });

    return grouped;
  }, [monthShowers]);

  const isSameMonth = (first: Date, second: Date): boolean => (
    first.getMonth() === second.getMonth() &&
    first.getFullYear() === second.getFullYear()
  );

  const navigateToMonth = async (nextDate: Date) => {
    if (isLoading || isSameMonth(currentDate, nextDate)) {
      return;
    }

    setIsTransitioning(true);
    await loadMonthShowers(nextDate, {
      commitDate: true,
      clearDataOnError: false,
    });
    setIsTransitioning(false);
  };

  const goToPreviousMonth = () => {
    void navigateToMonth(getPreviousMonth(currentDate));
  };

  const goToNextMonth = () => {
    void navigateToMonth(getNextMonth(currentDate));
  };

  const goToToday = async () => {
    const today = new Date();

    if (isSameMonth(currentDate, today)) {
      onTodaySelected?.(today, showersByDate.get(today.toDateString()) || []);
      return;
    }

    if (isLoading) {
      return;
    }

    setIsTransitioning(true);
    const loadedShowers = await loadMonthShowers(today, {
      commitDate: true,
      clearDataOnError: false,
    });
    setIsTransitioning(false);

    onTodaySelected?.(today, loadedShowers ? getShowersForDate(loadedShowers, today) : []);
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
    <Card data-testid="calendar" aria-busy={isLoading}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-xl" data-testid="calendar-month">
              {getMonthName(currentDate)}
            </CardTitle>
            <span className="text-xs font-medium text-muted-foreground/70 tracking-wider uppercase mt-0.5" aria-label="Year">
              {getYear(currentDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-xs"
              disabled={isLoading}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              disabled={isLoading}
              aria-label="Previous month"
              data-testid="prev-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              disabled={isLoading}
              aria-label="Next month"
              data-testid="next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'space-y-4 motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-in-out motion-reduce:transition-none',
            isTransitioning ? 'opacity-60' : 'opacity-100'
          )}
        >
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

          <div className="grid grid-cols-7 gap-1">
            {calendarGrid.map((date, index) => (
              <div
                key={date ? date.toISOString() : `empty-${index}`}
                className={cn(
                  'relative aspect-square p-1',
                  date && 'cursor-pointer'
                )}
              >
                {date && (
                  <button
                    onClick={() => handleDayClick(date)}
                    data-date={date.toISOString().split('T')[0]}
                    disabled={isLoading}
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
                            className="w-1.5 h-1.5 rounded-full bg-blue-500"
                          />
                        ))}
                        {getShowerCount(date) > 3 && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                            +
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

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
        </div>
      </CardContent>
    </Card>
  );
}
