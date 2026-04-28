import { useState } from 'react'
import { useSwipeable } from 'react-swipeable'
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
import { getPageForSwipe, type AppPage } from '@/lib/page-navigation'

const SWIPE_THRESHOLD_PX = 56

function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('home')
  
  // Initialize notifications
  useNotifications({ enableScheduler: true })

  const handleNavigate = (nextPage: AppPage) => {
    setCurrentPage(nextPage)
  }

  const swipeHandlers = useSwipeable({
    delta: SWIPE_THRESHOLD_PX,
    preventScrollOnSwipe: false,
    trackMouse: false,
    onSwipedLeft: (eventData) => {
      if (eventData.absX <= eventData.absY) {
        return
      }

      const nextPage = getPageForSwipe(currentPage, 'left')
      if (nextPage) {
        handleNavigate(nextPage)
      }
    },
    onSwipedRight: (eventData) => {
      if (eventData.absX <= eventData.absY) {
        return
      }

      const nextPage = getPageForSwipe(currentPage, 'right')
      if (nextPage) {
        handleNavigate(nextPage)
      }
    }
  })

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
          <div {...swipeHandlers} className="touch-pan-y">
            <div
              className={cn(
                'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150 motion-reduce:animate-none'
              )}
              key={currentPage}
            >
              {renderCurrentPage(currentPage)}
            </div>
          </div>
        </Layout>
        <PWAInstallPrompt />
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
