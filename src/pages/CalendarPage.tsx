import { useState } from 'react';
import { Calendar } from '../components/Calendar';
import { ShowerDetails } from '../components/ShowerDetails';
import { CalendarSkeleton } from '../components/loading-skeleton';
import { useShowers } from '../hooks/useShowers';
import { useToast } from '../components/toast';
import type { ShowerEntry } from '../types';

export function CalendarPage() {
  const { isLoading, error } = useShowers();
  const { error: showError } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedShowers, setSelectedShowers] = useState<ShowerEntry[]>([]);

  const handleDayClick = (date: Date, showers: ShowerEntry[]) => {
    setSelectedDate(date);
    setSelectedShowers(showers);
  };

  const handleCloseDetails = () => {
    setSelectedDate(null);
    setSelectedShowers([]);
  };

  // Show error toast if there's an error
  if (error) {
    showError('Failed to load calendar', error);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CalendarSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Calendar onDayClick={handleDayClick} />
      
      {selectedDate && (
        <ShowerDetails
          date={selectedDate}
          showers={selectedShowers}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}