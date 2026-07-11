import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateShowerInsights } from '@/lib/shower-insights'
import type { ShowerEntry } from '@/types'

export function ShowerInsights({ showers }: { showers: ShowerEntry[] }) {
  const insights = useMemo(() => calculateShowerInsights(showers), [showers])
  const values = [
    ['Avg. interval', insights.averageIntervalDays === null ? '—' : `${insights.averageIntervalDays.toFixed(1)} days`],
    ['Current streak', `${insights.currentStreak} days`],
    ['Longest streak', `${insights.longestStreak} days`],
    ['Most common day', insights.favoriteDay ?? '—'],
  ]

  return (
    <Card data-testid="shower-insights">
      <CardHeader><CardTitle>Insights</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {values.map(([label, value]) => (
          <div key={label} className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-semibold">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
