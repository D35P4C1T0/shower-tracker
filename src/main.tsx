import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/theme-provider'
import { AppProvider } from '@/stores/AppContext'
import { ErrorBoundary } from '@/components/error-boundary'
import { logWebVitals } from '@/lib/performance'
import { PWAProvider } from '@/hooks/usePWA'

// Initialize performance monitoring
logWebVitals();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
        <AppProvider>
          <ThemeProvider>
            <PWAProvider>
              <App />
            </PWAProvider>
          </ThemeProvider>
        </AppProvider>
    </ErrorBoundary>
  </StrictMode>,
)
