import { useEffect, useRef, useState } from 'react'
import { Layout } from '@/components/layout'
import { HomePage } from '@/pages/HomePage'
import { CalendarPage } from '@/pages/CalendarPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { OfflineIndicator } from '@/components/offline-indicator'
import { ErrorBoundary } from '@/components/error-boundary'
import { ToastProvider } from '@/components/toast'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

type AppPage = 'home' | 'calendar' | 'settings'

const PAGE_TRANSITION_MS = 180

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('home')
  const [displayPage, setDisplayPage] = useState<AppPage>('home')
  const [isPageVisible, setIsPageVisible] = useState(true)
  const transitionTimerRef = useRef<number | null>(null)
  
  // Initialize notifications
  useNotifications()

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current)
      }
    }
  }, [])

  const handleNavigate = (nextPage: AppPage) => {
    setCurrentPage(nextPage)

    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }

    if (nextPage === displayPage) {
      setIsPageVisible(true)
      return
    }

    setIsPageVisible(false)
    transitionTimerRef.current = window.setTimeout(() => {
      setDisplayPage(nextPage)
      setIsPageVisible(true)
      transitionTimerRef.current = null
    }, PAGE_TRANSITION_MS)
  }

  const renderCurrentPage = (page: AppPage) => {
    switch (page) {
      case 'home':
        return <HomePage />
      case 'calendar':
        return <CalendarPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <HomePage />
    }
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <OfflineIndicator />
        <Layout 
          currentPage={currentPage} 
          onNavigate={handleNavigate}
        >
          <div
            className={cn(
              'motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none',
              isPageVisible ? 'opacity-100' : 'opacity-0'
            )}
          >
            {renderCurrentPage(displayPage)}
          </div>
        </Layout>
        <PWAInstallPrompt />
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
