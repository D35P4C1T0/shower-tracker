import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CalendarPage } from '../CalendarPage'

const {
  useShowersMock,
  useToastMock,
} = vi.hoisted(() => ({
  useShowersMock: vi.fn(),
  useToastMock: vi.fn(),
}))

vi.mock('../../hooks/useShowers', () => ({
  useShowers: useShowersMock,
}))

vi.mock('../../components/toast', () => ({
  useToast: useToastMock,
}))

vi.mock('../../components/Calendar', () => ({
  Calendar: () => <div data-testid="calendar" />,
}))

vi.mock('../../components/ShowerDetails', () => ({
  ShowerDetails: () => <div data-testid="shower-details" />,
}))

vi.mock('../../components/loading-skeleton', () => ({
  CalendarSkeleton: () => <div data-testid="calendar-skeleton" />,
}))

describe('CalendarPage', () => {
  beforeEach(() => {
    useShowersMock.mockReset()
    useToastMock.mockReset()
  })

  it('shows calendar errors through a deduped effect', async () => {
    const showError = vi.fn()
    let currentError: string | null = 'Could not load calendar'

    useShowersMock.mockImplementation(() => ({
      isLoading: false,
      error: currentError,
      getShowersByDateRange: vi.fn().mockResolvedValue([]),
    }))
    useToastMock.mockReturnValue({ error: showError })

    const view = render(<CalendarPage />)

    await waitFor(() => {
      expect(showError).toHaveBeenCalledTimes(1)
    })

    view.rerender(<CalendarPage />)
    await waitFor(() => {
      expect(showError).toHaveBeenCalledTimes(1)
    })

    currentError = null
    view.rerender(<CalendarPage />)
    await waitFor(() => {
      expect(showError).toHaveBeenCalledTimes(1)
    })

    currentError = 'Could not load calendar'
    view.rerender(<CalendarPage />)
    await waitFor(() => {
      expect(showError).toHaveBeenCalledTimes(2)
    })
  })
})
