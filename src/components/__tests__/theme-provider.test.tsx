import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ThemeProvider, useTheme } from '../theme-provider'

function ThemeProbe() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  it('provides theme state and persists updates', () => {
    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <ThemeProbe />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme-value')).toHaveTextContent('light')
    fireEvent.click(screen.getByRole('button', { name: 'Set Dark' }))
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark')
    expect(localStorage.setItem).toHaveBeenCalledWith('test-theme', 'dark')
  })
})
