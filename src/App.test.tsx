import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('react-swipeable', () => ({
  useSwipeable: () => ({}),
}))

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
}))

vi.mock('@/components/layout', () => ({
  Layout: ({
    children,
    onNavigate,
    currentPage,
  }: {
    children: ReactNode
    onNavigate: (page: 'home' | 'calendar' | 'settings') => void
    currentPage: 'home' | 'calendar' | 'settings'
  }) => (
    <div>
      <span data-testid="current-page">{currentPage}</span>
      <button onClick={() => onNavigate('home')}>Go Home</button>
      <button onClick={() => onNavigate('calendar')}>Go Calendar</button>
      <button onClick={() => onNavigate('settings')}>Go Settings</button>
      {children}
    </div>
  ),
}))

vi.mock('@/components/toast', () => ({
  ToastProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/offline-indicator', () => ({
  OfflineIndicator: () => <div data-testid="offline-indicator" />,
}))

vi.mock('@/components/pwa-install-prompt', () => ({
  PWAInstallPrompt: () => <div data-testid="pwa-install-prompt" />,
}))

vi.mock('@/components/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/pages/HomePage', () => ({
  HomePage: () => <div>Home Page</div>,
}))

vi.mock('@/pages/CalendarPage', () => ({
  CalendarPage: () => <div>Calendar Page</div>,
}))

vi.mock('@/pages/SettingsPage', () => ({
  SettingsPage: () => <div>Settings Page</div>,
}))

describe('App', () => {
  it('navigates between pages', () => {
    render(<App />)

    expect(screen.getByText('Home Page')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Go Calendar' }))
    expect(screen.getByText('Calendar Page')).toBeInTheDocument()
    expect(screen.getByTestId('current-page')).toHaveTextContent('calendar')

    fireEvent.click(screen.getByRole('button', { name: 'Go Settings' }))
    expect(screen.getByText('Settings Page')).toBeInTheDocument()
    expect(screen.getByTestId('current-page')).toHaveTextContent('settings')
  })

  it('keeps nav state and visible page in sync on the first tap', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Go Calendar' }))

    expect(screen.getByTestId('current-page')).toHaveTextContent('calendar')
    expect(screen.getByText('Calendar Page')).toBeInTheDocument()
    expect(screen.queryByText('Home Page')).not.toBeInTheDocument()
  })
})
