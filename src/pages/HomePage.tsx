import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TimeSinceDisplay } from '@/components/time-since-display'
import { NotificationBanner } from '@/components/notification-banner'
import { CardSkeleton } from '@/components/loading-skeleton'
import { useShowers } from '@/hooks/useShowers'
import { useToast } from '@/components/toast'
import { CheckCircle, Loader2 } from 'lucide-react'

export function HomePage() {
  const { addShower, formatTimeSinceLastShower, getLastShower, isLoading, error } = useShowers()
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
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <NotificationBanner />
      
      <Card>
        <CardHeader>
          <CardTitle>Welcome Back!</CardTitle>
          <CardDescription>
            Track your shower habits with ease
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleRecordShower}
            disabled={isRecording}
          >
            {isRecording ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : showSuccess ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Recorded!
              </>
            ) : (
              'Record it'
            )}
          </Button>
          
          {error && (
            <p className="text-sm text-destructive mt-2 text-center">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time Since Last Shower</CardTitle>
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
                  Last shower: {new Date(lastShower!.timestamp).toLocaleString()}
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-muted-foreground">--</div>
                <p className="text-sm text-muted-foreground mt-1">
                  No showers recorded yet
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}