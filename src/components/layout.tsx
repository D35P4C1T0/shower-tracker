import type { ReactNode } from "react"
import { BottomNavigation } from "./bottom-navigation"
import { ThemeSwitcher } from "./theme-switcher"
import { cn } from "@/lib/utils"

interface LayoutProps {
  children: ReactNode
  currentPage?: 'home' | 'calendar' | 'settings'
  onNavigate?: (page: 'home' | 'calendar' | 'settings') => void
  showNavigation?: boolean
  showThemeSwitcher?: boolean
  title?: string
}

export function Layout({ 
  children, 
  currentPage = 'home', 
  onNavigate = () => {}, 
  showNavigation = true,
  showThemeSwitcher = true,
  title = "Shower Tracker"
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 app-fade-in">
        <div className="container flex h-14 items-center justify-between max-w-md mx-auto px-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          {showThemeSwitcher && <ThemeSwitcher />}
        </div>
      </header>

      {/* Main Content */}
      <main 
        className={cn(
          "container mx-auto max-w-md px-4 py-6 app-fade-in",
        )}
      >
        {children}
        {showNavigation && (
          <div
            aria-hidden="true"
            className="h-[calc(7rem+env(safe-area-inset-bottom))]"
            data-testid="bottom-navigation-spacer"
          />
        )}
      </main>

      {/* Bottom Navigation */}
      {showNavigation && (
        <BottomNavigation 
          currentPage={currentPage} 
          onNavigate={onNavigate} 
        />
      )}
    </div>
  )
}
