import { useState } from 'react'
import { Layout } from '@/components/layout'
import { HomePage } from '@/pages/HomePage'
import { CalendarPage } from '@/pages/CalendarPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { OfflineIndicator } from '@/components/offline-indicator'
import { ErrorBoundary } from '@/components/error-boundary'
import { ToastProvider } from '@/components/toast'
import { useNotifications } from '@/hooks/useNotifications'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'calendar' | 'settings'>('home')
  
  // Initialize notifications
  useNotifications()

  const renderCurrentPage = () => {
    switch (currentPage) {
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
          onNavigate={setCurrentPage}
        >
          {renderCurrentPage()}
        </Layout>
        <PWAInstallPrompt />
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
