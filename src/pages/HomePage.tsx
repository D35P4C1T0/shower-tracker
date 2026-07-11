import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TimeSinceDisplay } from '@/components/time-since-display'
import { NotificationBanner } from '@/components/notification-banner'
import { ShowerFrequencyChart } from '@/components/shower-frequency-chart'
import { CardSkeleton } from '@/components/loading-skeleton'
import { useShowers } from '@/hooks/useShowers'
import { useSettings } from '@/hooks/useSettings'
import { useToast } from '@/components/toast'
import { CheckCircle, Loader2, Plus } from 'lucide-react'
import { ShowerInsights } from '@/components/shower-insights'

export function HomePage() {
  const { showers, addShower, formatTimeSinceLastShower, getLastShower, isLoading, error } = useShowers()
  const { settings, updateShowerGoals } = useSettings()
  const { success, error: showError } = useToast()
  const [isRecording, setIsRecording] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleRecordShower = async () => {
    if (isRecording) return

    try {
      setIsRecording(true)
      await addShower()
      
      // Show success feedback
      setShowSuccess(true)
      success('Shower recorded!', 'Your shower has been successfully logged.')
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (error) {
      console.error('Failed to record shower:', error)
      showError('Failed to record shower', 'Please try again. If the problem persists, check your storage settings.')
    } finally {
      setIsRecording(false)
    }
  }

  const lastShower = getLastShower()
  const hasShowers = lastShower !== null

  if (isLoading) {
    return (
      <div className="space-y-6 app-fade-in">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6 app-fade-in">
      <NotificationBanner />

      {error && (
        <p className="text-center text-sm text-destructive">
          {error}
        </p>
      )}

      <Card className="app-fade-up app-fade-up-delay-1">
        <CardHeader>
          <CardTitle>You Last Showered</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            {hasShowers ? (
              <>
                <TimeSinceDisplay 
                  formatTime={formatTimeSinceLastShower}
                  isLoading={false}
                />
                <p className="text-sm text-muted-foreground mt-1" data-testid="last-shower-time">
                  Logged on {new Date(lastShower!.timestamp).toLocaleString()}
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-muted-foreground">--</div>
                <p className="text-sm text-muted-foreground mt-1">
                  No shower logged yet
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="app-fade-up app-fade-up-delay-2">
        <CardHeader>
          <CardTitle>Shower Rhythm</CardTitle>
          <CardDescription>
            Last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShowerFrequencyChart
            firstDayOfWeek={settings.firstDayOfWeek}
            onShowerGoalsChange={updateShowerGoals}
            showerGoals={settings.showerGoals}
            showers={showers}
          />
        </CardContent>
      </Card>

      <ShowerInsights showers={showers} />

      <Button
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-[max(1rem,calc((100vw-28rem)/2+1rem))] z-40 h-14 w-14 rounded-lg shadow-lg"
        size="icon"
        onClick={handleRecordShower}
        disabled={isRecording}
        aria-label="Record shower"
      >
        {isRecording ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : showSuccess ? (
          <CheckCircle className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>
    </div>
  )
}
