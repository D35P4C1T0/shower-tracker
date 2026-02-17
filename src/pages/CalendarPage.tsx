import { useEffect, useRef, useState } from 'react';
import { Calendar } from '../components/Calendar';
import { ShowerDetails } from '../components/ShowerDetails';
import { CalendarSkeleton } from '../components/loading-skeleton';
import { useShowers } from '../hooks/useShowers';
import { useToast } from '../components/toast';
import type { ShowerEntry } from '../types';

export function CalendarPage() {
  const { isLoading, error, getShowersByDateRange } = useShowers();
  const { error: showError } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedShowers, setSelectedShowers] = useState<ShowerEntry[]>([]);
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);
  const lastShownErrorRef = useRef<string | null>(null);

  const handleDayClick = (date: Date, showers: ShowerEntry[]) => {
    setSelectedDate(date);
    setSelectedShowers(showers);
  };

  const handleTodaySelected = (date: Date, showers: ShowerEntry[]) => {
    // Only sync details when the details panel is already open.
    if (!selectedDate) {
      return;
    }

    setSelectedDate(date);
    setSelectedShowers(showers);
  };

  const handleCloseDetails = () => {
    setSelectedDate(null);
    setSelectedShowers([]);
  };

  const handleShowersChanged = async () => {
    // Refresh calendar data in-place without remounting (preserves visible month).
    setCalendarRefreshTrigger(prev => prev + 1);
    
    // Update the selected showers for the current date
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      try {
        const updatedShowers = await getShowersByDateRange(startOfDay, endOfDay);
        setSelectedShowers(updatedShowers);
      } catch (error) {
        console.error('Failed to refresh showers:', error);
      }
    }
  };

  useEffect(() => {
    if (!error) {
      lastShownErrorRef.current = null;
      return;
    }

    if (lastShownErrorRef.current === error) {
      return;
    }

    showError('Failed to load calendar', error);
    lastShownErrorRef.current = error;
  }, [error, showError]);

  if (isLoading) {
    return (
      <div className="space-y-6 app-fade-in">
        <CalendarSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 app-fade-in">
      <Calendar
        onDayClick={handleDayClick}
        onTodaySelected={handleTodaySelected}
        refreshTrigger={calendarRefreshTrigger}
      />
      
      {selectedDate && (
        <ShowerDetails
          date={selectedDate}
          showers={selectedShowers}
          onClose={handleCloseDetails}
          onShowersChanged={handleShowersChanged}
        />
      )}
    </div>
  );
}
