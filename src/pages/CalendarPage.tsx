import { useState } from 'react';
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
  const [calendarKey, setCalendarKey] = useState(0);

  const handleDayClick = (date: Date, showers: ShowerEntry[]) => {
    setSelectedDate(date);
    setSelectedShowers(showers);
  };

  const handleCloseDetails = () => {
    setSelectedDate(null);
    setSelectedShowers([]);
  };

  const handleShowerDeleted = async () => {
    // Refresh the calendar by changing its key (forces remount)
    setCalendarKey(prev => prev + 1);
    
    // Update the selected showers for the current date
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      try {
        const updatedShowers = await getShowersByDateRange(startOfDay, endOfDay);
        setSelectedShowers(updatedShowers);
        
        // If no showers left for this day, close the details
        if (updatedShowers.length === 0) {
          handleCloseDetails();
        }
      } catch (error) {
        console.error('Failed to refresh showers:', error);
      }
    }
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
      <Calendar key={calendarKey} onDayClick={handleDayClick} />
      
      {selectedDate && (
        <ShowerDetails
          date={selectedDate}
          showers={selectedShowers}
          onClose={handleCloseDetails}
          onShowerDeleted={handleShowerDeleted}
        />
      )}
    </div>
  );
}