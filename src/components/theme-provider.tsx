import { createContext, useContext, useEffect, type ReactNode } from 'react'
import type { Theme } from '@/types'
import { useSettings } from '@/hooks/useSettings'

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => Promise<void>
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, updateTheme } = useSettings()
  const theme = settings.theme

  useEffect(() => {
    const root = window.document.documentElement
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      root.classList.remove('light', 'dark')
      root.classList.add(theme === 'system' ? media?.matches ? 'dark' : 'light' : theme)
    }
    applyTheme()
    if (theme !== 'system') return
    media?.addEventListener('change', applyTheme)
    return () => media?.removeEventListener('change', applyTheme)
  }, [theme])

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme: updateTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
