import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimeSinceDisplay } from '../time-since-display'

describe('TimeSinceDisplay', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates the displayed value on interval', () => {
    vi.useFakeTimers()
    const formatTime = vi.fn()
      .mockReturnValueOnce('1 minute ago')
      .mockReturnValue('2 minutes ago')

    render(<TimeSinceDisplay formatTime={formatTime} refreshInterval={1000} />)

    expect(screen.getByText('1 minute ago')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByText('2 minutes ago')).toBeInTheDocument()
  })

  it('renders loading spinner when loading', () => {
    render(<TimeSinceDisplay formatTime={() => 'x'} isLoading />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
})
