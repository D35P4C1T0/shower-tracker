import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BottomNavigation } from '../bottom-navigation'

describe('BottomNavigation', () => {
  it('marks the active page for assistive tech and styling', () => {
    render(<BottomNavigation currentPage="calendar" onNavigate={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Calendar' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Calendar' })).toHaveClass('text-primary')
  })

  it('navigates immediately on touch pointer release for iOS PWAs', () => {
    const onNavigate = vi.fn()
    render(<BottomNavigation currentPage="home" onNavigate={onNavigate} />)

    fireEvent.pointerUp(screen.getByRole('button', { name: 'Calendar' }), {
      pointerType: 'touch',
    })

    expect(onNavigate).toHaveBeenCalledWith('calendar')
  })

  it('keeps mouse navigation on click', () => {
    const onNavigate = vi.fn()
    render(<BottomNavigation currentPage="home" onNavigate={onNavigate} />)

    fireEvent.pointerUp(screen.getByRole('button', { name: 'Calendar' }), {
      pointerType: 'mouse',
    })
    expect(onNavigate).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Calendar' }))
    expect(onNavigate).toHaveBeenCalledWith('calendar')
  })
})
