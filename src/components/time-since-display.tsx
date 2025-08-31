import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface TimeSinceDisplayProps {
  /** Function that returns the formatted time string */
  formatTime: () => string
  /** Whether the component is in a loading state */
  isLoading?: boolean
  /** Custom refresh interval in milliseconds (default: 1000ms) */
  refreshInterval?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * A component that displays time since a certain event and auto-refreshes
 */
export function TimeSinceDisplay({ 
  formatTime, 
  isLoading = false, 
  refreshInterval = 1000,
  className = "text-3xl font-bold text-primary"
}: TimeSinceDisplayProps) {
  const [timeDisplay, setTimeDisplay] = useState<string>('')

  // Update time display at the specified interval
  useEffect(() => {
    const updateTimeDisplay = () => {
      setTimeDisplay(formatTime())
    }

    updateTimeDisplay()
    const interval = setInterval(updateTimeDisplay, refreshInterval)

    return () => clearInterval(interval)
  }, [formatTime, refreshInterval])

  if (isLoading) {
    return (
      <div className={className}>
        <Loader2 className="h-8 w-8 animate-spin mx-auto" data-testid="loading-spinner" />
      </div>
    )
  }

  return (
    <div className={className}>
      {timeDisplay}
    </div>
  )
}