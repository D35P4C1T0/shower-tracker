import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { ToastProvider, useToast } from '../toast'

vi.mock('../theme-provider', () => ({
  useTheme: () => ({ theme: 'dark' }),
}))

function ToastProbe() {
  const { success, error } = useToast()
  return (
    <>
      <button onClick={() => success('Saved', 'Changes were saved')}>Trigger Toast</button>
      <button onClick={() => error('Failed', 'Please try again')}>Trigger Error</button>
    </>
  )
}

function renderToasts() {
  return render(<ToastProvider><ToastProbe /></ToastProvider>)
}

function advanceTime(ms: number) {
  act(() => { vi.advanceTimersByTime(ms) })
}

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    act(() => { toast.dismiss() })
    advanceTime(1000)
    vi.useRealTimers()
  })

  it('shows and dismisses a Sonner toast using the app theme', () => {
    const { container } = renderToasts()
    fireEvent.click(screen.getByRole('button', { name: 'Trigger Toast' }))
    advanceTime(0)
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('Changes were saved')).toBeInTheDocument()
    expect(container.querySelector('[data-sonner-toaster]')).toHaveAttribute('data-sonner-theme', 'dark')

    fireEvent.click(screen.getByRole('button', { name: 'Close notification' }))
    advanceTime(1000)
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })

  it('automatically dismisses success messages after five seconds', () => {
    renderToasts()
    fireEvent.click(screen.getByRole('button', { name: 'Trigger Toast' }))
    advanceTime(0)
    advanceTime(4900)
    expect(screen.getByText('Saved')).toBeInTheDocument()
    advanceTime(1100)
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })

  it('keeps errors visible for seven seconds', () => {
    renderToasts()
    fireEvent.click(screen.getByRole('button', { name: 'Trigger Error' }))
    advanceTime(0)
    advanceTime(6000)
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('Please try again')).toBeInTheDocument()
    advanceTime(2000)
    expect(screen.queryByText('Failed')).not.toBeInTheDocument()
  })
})
