import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/theme-provider'
import { AppProvider } from '@/stores/AppContext'
import { ErrorBoundary } from '@/components/error-boundary'
import { logWebVitals } from '@/lib/performance'

// Initialize performance monitoring
logWebVitals();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="shower-tracker-theme">
        <AppProvider>
          <App />
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
