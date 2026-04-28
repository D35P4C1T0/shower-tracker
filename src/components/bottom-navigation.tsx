import { Home, Calendar, Settings } from "lucide-react"
import type { PointerEvent } from "react"
import { cn } from "@/lib/utils"

interface BottomNavigationProps {
  currentPage: 'home' | 'calendar' | 'settings'
  onNavigate: (page: 'home' | 'calendar' | 'settings') => void
}

export function BottomNavigation({ currentPage, onNavigate }: BottomNavigationProps) {
  const navItems = [
    {
      id: 'home' as const,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'calendar' as const,
      label: 'Calendar',
      icon: Calendar,
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: Settings,
    },
  ]

  const handleTouchNavigation = (
    event: PointerEvent<HTMLButtonElement>,
    page: 'home' | 'calendar' | 'settings'
  ) => {
    if (event.pointerType === 'mouse') {
      return
    }

    event.preventDefault()
    onNavigate(page)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-[env(safe-area-inset-bottom)] app-fade-in">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          
          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onPointerUp={(event) => handleTouchNavigation(event, item.id)}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex touch-manipulation select-none flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-colors duration-150 ease-out motion-reduce:transition-none",
                "min-w-0 flex-1 text-xs font-medium [-webkit-tap-highlight-color:transparent]",
                isActive
                  ? "text-primary bg-primary/10 shadow-sm"
                  : "text-muted-foreground active:bg-primary/10 active:text-primary"
              )}
              aria-label={item.label}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200 ease-out motion-reduce:transition-none",
                  isActive ? "text-primary scale-105" : "scale-100"
                )}
              />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
