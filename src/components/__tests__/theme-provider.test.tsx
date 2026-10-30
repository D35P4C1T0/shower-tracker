import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from '../theme-provider'
import { AppProvider } from '@/stores/AppContext'
import { DatabaseService, SettingsService } from '@/lib/database-service'

function ThemeProbe() {
  const { theme, setTheme } = useTheme()
  return <>
    <span data-testid="theme-value">{theme}</span>
    <button onClick={() => void setTheme('dark')}>Set Dark</button>
  </>
}

beforeEach(async () => {
  await DatabaseService.initialize()
  await DatabaseService.clearAllData()
})

describe('ThemeProvider', () => {
  it('loads the saved theme and exports subsequent changes', async () => {
    await SettingsService.updateSetting('theme', 'light')
    render(<AppProvider><ThemeProvider><ThemeProbe /></ThemeProvider></AppProvider>)
    await waitFor(() => expect(screen.getByTestId('theme-value')).toHaveTextContent('light'))
    expect(document.documentElement).toHaveClass('light')
    fireEvent.click(screen.getByRole('button', { name: 'Set Dark' }))
    await waitFor(() => expect(screen.getByTestId('theme-value')).toHaveTextContent('dark'))
    expect(document.documentElement).toHaveClass('dark')
    expect((await DatabaseService.exportData()).settings.theme).toBe('dark')
  })

  it('renders and changes theme with localStorage blocked', async () => {
    const read = vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    const write = vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    try {
      render(<AppProvider><ThemeProvider><ThemeProbe /></ThemeProvider></AppProvider>)
      await waitFor(() => expect(screen.getByTestId('theme-value')).toHaveTextContent('system'))
      fireEvent.click(screen.getByRole('button', { name: 'Set Dark' }))
      await waitFor(() => expect(screen.getByTestId('theme-value')).toHaveTextContent('dark'))
      expect((await SettingsService.getSettings()).theme).toBe('dark')
    } finally { read.mockRestore(); write.mockRestore() }
  })
})
