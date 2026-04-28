import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { ShowerEntry } from '@/types';

interface ShowerFrequencyChartProps {
  firstDayOfWeek: 0 | 1;
  onShowerGoalsChange: (goals: ShowerGoals) => void;
  showerGoals: ShowerGoals;
  showers: ShowerEntry[];
}

interface ShowerFrequencyPoint {
  date: Date;
  count: number;
}

interface WeekBucket {
  label: string;
  count: number;
}

const DEFAULT_WEEKLY_TARGET = 4;
const DEFAULT_MONTHLY_TARGET = 16;

interface ShowerGoals {
  weekly: number;
  monthly: number;
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLast30DaysShowerFrequency(showers: ShowerEntry[], today = new Date()): ShowerFrequencyPoint[] {
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(startOfToday);
    date.setDate(startOfToday.getDate() - (29 - index));
    return {
      date,
      count: 0,
    };
  });

  const countsByDate = new Map(days.map((day) => [getLocalDateKey(day.date), day]));
  const firstDay = days[0].date.getTime();
  const lastDay = days[days.length - 1].date.getTime() + 24 * 60 * 60 * 1000;

  showers.forEach((shower) => {
    const showerDate = new Date(shower.timestamp);
    const showerTime = showerDate.getTime();
    if (showerTime < firstDay || showerTime >= lastDay) {
      return;
    }

    const day = countsByDate.get(getLocalDateKey(showerDate));
    if (day) {
      day.count += 1;
    }
  });

  return days;
}

export function getLast4WeekShowerBuckets(showers: ShowerEntry[], today = new Date()): WeekBucket[] {
  const days = getLast30DaysShowerFrequency(showers, today).slice(-28);

  return Array.from({ length: 4 }, (_, bucketIndex) => {
    const bucketDays = days.slice(bucketIndex * 7, bucketIndex * 7 + 7);
    const firstDay = bucketDays[0].date;
    const lastDay = bucketDays[bucketDays.length - 1].date;
    return {
      label: `${firstDay.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}-${lastDay.toLocaleDateString(undefined, { day: 'numeric' })}`,
      count: bucketDays.reduce((total, point) => total + point.count, 0),
    };
  });
}

function getStartOfWeek(date: Date, firstDayOfWeek: 0 | 1): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const daysSinceWeekStart = (start.getDay() - firstDayOfWeek + 7) % 7;
  start.setDate(start.getDate() - daysSinceWeekStart);
  return start;
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function countShowersSince(showers: ShowerEntry[], startDate: Date, endDate = new Date()): number {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  return showers.filter((shower) => {
    const showerTime = new Date(shower.timestamp).getTime();
    return showerTime >= startTime && showerTime <= endTime;
  }).length;
}

function getDaysSinceLastShower(showers: ShowerEntry[], today = new Date()): number | null {
  if (showers.length === 0) {
    return null;
  }

  const newestShower = showers.reduce<Date | null>((newest, shower) => {
    const showerDate = new Date(shower.timestamp);
    if (!newest || showerDate.getTime() > newest.getTime()) {
      return showerDate;
    }
    return newest;
  }, null);

  if (!newestShower) {
    return null;
  }

  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfLastShowerDay = new Date(newestShower);
  startOfLastShowerDay.setHours(0, 0, 0, 0);
  const days = Math.floor((startOfToday.getTime() - startOfLastShowerDay.getTime()) / (24 * 60 * 60 * 1000));
  return Math.min(7, Math.max(0, days));
}

interface ProgressRingProps {
  colorClass: string;
  label: string;
  max: number;
  onClick?: () => void;
  progressValue?: number;
  testId: string;
  value: number | null;
}

interface GoalEditModalProps {
  defaultValue: number;
  max: number;
  min?: number;
  onOpenChange: (open: boolean) => void;
  onSave: (value: number) => void;
  open: boolean;
  title: string;
}

function GoalEditModal({ defaultValue, max, min = 1, onOpenChange, onSave, open, title }: GoalEditModalProps) {
  const [value, setValue] = useState(`${defaultValue}`);

  useEffect(() => {
    if (open) {
      setValue(`${defaultValue}`);
    }
  }, [defaultValue, open]);

  const parsedValue = Number(value);
  const isValidValue = Number.isFinite(parsedValue) && parsedValue >= min && parsedValue <= max;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-xs gap-3 p-4" data-testid="goal-edit-dialog">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-xs">
            Pick a target between {min} and {max}.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="h-12 text-base"
          data-testid="goal-edit-input"
        />
        <DialogFooter className="grid grid-cols-2 gap-2 space-x-0 sm:space-x-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!isValidValue}
            onClick={() => {
              onSave(parsedValue);
              onOpenChange(false);
            }}
            data-testid="goal-edit-save"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProgressRing({ colorClass, label, max, onClick, progressValue, testId, value }: ProgressRingProps) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const numericValue = progressValue ?? value ?? 0;
  const progress = Math.min(1, max > 0 ? numericValue / max : 0);
  const dashOffset = circumference * (1 - progress);
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      data-progress={progress}
      data-testid={testId}
    >
      <div className="relative h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20">
        <svg className="-rotate-90" viewBox="0 0 72 72" aria-hidden="true">
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            className="text-muted"
          />
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={colorClass}
          data-testid={`${testId}-progress`}
        />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold leading-none sm:text-lg">{value ?? '--'}</span>
          <span className="text-[10px] text-muted-foreground">/{max}</span>
        </div>
      </div>
      <span className="text-center text-[11px] font-medium leading-tight text-muted-foreground sm:text-xs">{label}</span>
    </Wrapper>
  );
}

export function ShowerFrequencyChart({
  firstDayOfWeek,
  onShowerGoalsChange,
  showerGoals,
  showers
}: ShowerFrequencyChartProps) {
  const [goalBeingEdited, setGoalBeingEdited] = useState<'weekly' | 'monthly' | null>(null);
  const [activeWeekBucketIndex, setActiveWeekBucketIndex] = useState<number | null>(null);

  const now = new Date();
  const trendBuckets = getLast4WeekShowerBuckets(showers, now);
  const maxBucket = Math.max(1, ...trendBuckets.map((bucket) => bucket.count));
  const currentWeekShowers = countShowersSince(showers, getStartOfWeek(now, firstDayOfWeek), now);
  const currentMonthShowers = countShowersSince(showers, getStartOfMonth(now), now);
  const daysSinceLastShower = getDaysSinceLastShower(showers, now);
  const weeklyTarget = showerGoals.weekly || DEFAULT_WEEKLY_TARGET;
  const monthlyTarget = showerGoals.monthly || DEFAULT_MONTHLY_TARGET;

  return (
    <div className="space-y-4" data-testid="shower-frequency-chart">
      <div className="rounded-md border bg-muted/35 p-3 sm:p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <div className="text-sm font-semibold">Past 4 weeks</div>
          <div className="text-xs text-muted-foreground">weekly totals</div>
        </div>

        <div className="grid h-24 grid-cols-4 items-end gap-1.5 sm:h-28 sm:gap-2" aria-label="Shower rhythm trend for the past 4 weeks">
          {trendBuckets.map((bucket, index) => (
            <div key={index} className="relative flex min-w-0 flex-1 flex-col items-center gap-2">
              <button
                type="button"
                className="flex h-16 w-full items-end rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:h-20"
                aria-describedby={activeWeekBucketIndex === index ? `week-bucket-tooltip-${index}` : undefined}
                aria-label={`${bucket.label}: ${bucket.count} shower${bucket.count === 1 ? '' : 's'}`}
                onBlur={() => setActiveWeekBucketIndex(null)}
                onClick={() => setActiveWeekBucketIndex(index)}
                onMouseEnter={() => setActiveWeekBucketIndex(index)}
                onMouseLeave={() => setActiveWeekBucketIndex(null)}
                data-testid="shower-frequency-bar"
              >
                <div
                  className="w-full rounded-t-md bg-blue-500/80 transition-[height] dark:bg-blue-400/80"
                  style={{ height: `${Math.max(bucket.count === 0 ? 4 : 14, (bucket.count / maxBucket) * 64)}px` }}
                />
              </button>
              {activeWeekBucketIndex === index && (
                <div
                  id={`week-bucket-tooltip-${index}`}
                  role="tooltip"
                  className="absolute bottom-[calc(100%+0.375rem)] left-1/2 z-20 w-max max-w-[7rem] -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-center text-[11px] font-medium text-popover-foreground shadow-md"
                  data-testid="shower-frequency-tooltip"
                >
                  {bucket.label}
                </div>
              )}
              <div className="text-xs font-medium tabular-nums">{bucket.count}</div>
            </div>
          ))}
        </div>

        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>older</span>
          <span>now</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <ProgressRing
          colorClass="text-blue-500 dark:text-blue-400"
          label="This week"
          max={weeklyTarget}
          onClick={() => setGoalBeingEdited('weekly')}
          testId="weekly-shower-ring"
          value={currentWeekShowers}
        />
        <ProgressRing
          colorClass="text-emerald-500 dark:text-emerald-400"
          label="This month"
          max={monthlyTarget}
          onClick={() => setGoalBeingEdited('monthly')}
          testId="monthly-shower-ring"
          value={currentMonthShowers}
        />
        <ProgressRing
          colorClass="text-red-500 dark:text-red-400"
          label="Days since"
          max={7}
          testId="days-since-shower-ring"
          value={daysSinceLastShower}
        />
      </div>

      <GoalEditModal
        defaultValue={goalBeingEdited === 'monthly' ? monthlyTarget : weeklyTarget}
        max={goalBeingEdited === 'monthly' ? 93 : 21}
        onOpenChange={(open) => setGoalBeingEdited(open ? goalBeingEdited ?? 'weekly' : null)}
        onSave={(value) => {
          if (goalBeingEdited === 'monthly') {
            onShowerGoalsChange({ ...showerGoals, monthly: value });
          } else {
            onShowerGoalsChange({ ...showerGoals, weekly: value });
          }
        }}
        open={goalBeingEdited !== null}
        title={goalBeingEdited === 'monthly' ? 'Monthly goal' : 'Weekly goal'}
      />
    </div>
  );
}
