import React, { type ReactElement } from 'react'
import { render, renderHook as originalRenderHook, type RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'
import { AppProvider } from '../stores/AppContext'
import { ToastProvider } from '../components/toast'
import { ThemeProvider } from '../components/theme-provider'

// Mock data for testing
export const mockShowerEntry = {
  id: '1',
  timestamp: new Date('2024-01-01T10:00:00Z'),
}

export const mockSettings = {
  theme: 'light' as const,
  firstDayOfWeek: 0 as const,
  notificationsEnabled: false,
  notificationThresholdDays: 3,
  projectInfo: {
    githubRepo: 'test/repo',
    author: 'Test Author',
  },
}

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider defaultTheme="light" storageKey="test-theme">
      <ToastProvider>
        <AppProvider>
          {children}
        </AppProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Custom renderHook with providers
export const renderHook = (hook: () => any, options?: any) => {
  return originalRenderHook(hook, {
    wrapper: AllTheProviders,
    ...options
  })
}

// Test utilities for mocking browser APIs
export const mockNotificationAPI = () => {
  const mockNotification = {
    permission: 'default' as NotificationPermission,
    requestPermission: vi.fn().mockResolvedValue('granted'),
  }
  
  global.Notification = mockNotification as any
  return mockNotification
}

export const mockServiceWorkerAPI = () => {
  const mockServiceWorker = {
    register: vi.fn().mockResolvedValue({}),
    ready: Promise.resolve({}),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  
  Object.defineProperty(navigator, 'serviceWorker', {
    value: mockServiceWorker,
    writable: true,
  })
  
  return mockServiceWorker
}

export const mockCachesAPI = () => {
  const mockCache = {
    addAll: vi.fn().mockResolvedValue(undefined),
    add: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    match: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(true),
  }
  
  const mockCaches = {
    open: vi.fn().mockResolvedValue(mockCache),
    keys: vi.fn().mockResolvedValue(['cache1', 'cache2']),
    delete: vi.fn().mockResolvedValue(true),
    has: vi.fn().mockResolvedValue(false),
    match: vi.fn().mockResolvedValue(undefined),
  }
  
  global.caches = mockCaches as any
  return { mockCaches, mockCache }
}

// Accessibility testing helper
export const checkA11y = async (container: Element) => {
  const { axe } = await import('jest-axe') as any
  const results = await axe(container)
  
  if (results.violations.length > 0) {
    const violationMessages = results.violations
      .map((violation: any) => `${violation.id}: ${violation.description}`)
      .join('\n')
    
    throw new Error(`Accessibility violations found:\n${violationMessages}`)
  }
}