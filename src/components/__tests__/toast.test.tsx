import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast } from '../toast'

function ToastProbe() {
  const { success } = useToast()
  return (
    <button onClick={() => success('Saved', 'Changes were saved')}>
      Trigger Toast
    </button>
  )
}

describe('Toast', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows and dismisses a toast', () => {
    vi.useFakeTimers()
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Toast' }))
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('Changes were saved')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close notification' }))
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })
})
