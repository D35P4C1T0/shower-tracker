import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { ShowerEntry } from '../types';
import { formatDate } from '../lib/calendar-utils';

interface ShowerDetailsProps {
  date: Date;
  showers: ShowerEntry[];
  onClose?: () => void;
}

export function ShowerDetails({ date, showers, onClose }: ShowerDetailsProps) {
  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card>
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
          <div className="space-y-3">
            {showers.map((shower) => (
              <div
                key={shower.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div>
                    <div className="font-medium">
                      Shower at {formatTime(new Date(shower.timestamp))}
                    </div>
                    {shower.notes && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {shower.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}