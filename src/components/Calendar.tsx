import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
  getLastDayOfMonth
} from '../lib/calendar-utils';
import { cn } from '../lib/utils';

interface CalendarProps {
  onDayClick?: (date: Date, showers: ShowerEntry[]) => void;
}

export function Calendar({ onDayClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthShowers, setMonthShowers] = useState<ShowerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { getShowersByDateRange } = useShowers();
  const { settings } = useSettings();

  // Load showers for the current month
  useEffect(() => {
    const loadMonthShowers = async () => {
      setIsLoading(true);
      try {
        const startDate = getFirstDayOfMonth(currentDate);
        const endDate = getLastDayOfMonth(currentDate);
        const showers = await getShowersByDateRange(startDate, endDate);
        setMonthShowers(showers);
      } catch (error) {
        console.error('Failed to load month showers:', error);
        setMonthShowers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMonthShowers();
  }, [currentDate, getShowersByDateRange]);

  // Generate calendar grid
  const calendarGrid = useMemo(() => {
    return generateCalendarGrid(currentDate, settings.firstDayOfWeek);
  }, [currentDate, settings.firstDayOfWeek]);

  // Get day names based on user preference
  const dayNames = useMemo(() => {
    return getDayNames(settings.firstDayOfWeek);
  }, [settings.firstDayOfWeek]);

  // Group showers by date for quick lookup
  const showersByDate = useMemo(() => {
    const grouped = new Map<string, ShowerEntry[]>();
    
    monthShowers.forEach(shower => {
      const dateKey = new Date(shower.timestamp).toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(shower);
    });
    
    return grouped;
  }, [monthShowers]);

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentDate(getPreviousMonth(currentDate));
  };

  const goToNextMonth = () => {
    setCurrentDate(getNextMonth(currentDate));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle day click
  const handleDayClick = (date: Date) => {
    const dayShowers = showersByDate.get(date.toDateString()) || [];
    onDayClick?.(date, dayShowers);
  };

  // Check if a date has showers
  const hasShowers = (date: Date): boolean => {
    return showersByDate.has(date.toDateString());
  };

  // Get shower count for a date
  const getShowerCount = (date: Date): number => {
    return showersByDate.get(date.toDateString())?.length || 0;
  };

  return (
    <Card data-testid="calendar">
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading calendar...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Day headers */}
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
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.map((date, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative aspect-square p-1",
                    date && "cursor-pointer"
                  )}
                >
                  {date && (
                    <button
                      onClick={() => handleDayClick(date)}
                      data-date={date.toISOString().split('T')[0]}
                      className={cn(
                        "w-full h-full rounded-md border-2 border-transparent",
                        "flex flex-col items-center justify-center",
                        "text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        isToday(date) && "border-primary bg-primary/10",
                        hasShowers(date) && "bg-blue-100 dark:bg-blue-900/30 has-shower",
                        hasShowers(date) && isToday(date) && "bg-primary/20"
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
            
            {/* Legend */}
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
        )}
      </CardContent>
    </Card>
  );
}