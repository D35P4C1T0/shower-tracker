import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Calendar } from '../Calendar'

const { useShowersMock, useSettingsMock } = vi.hoisted(() => ({
  useShowersMock: vi.fn(),
  useSettingsMock: vi.fn(),
}))

vi.mock('../../hooks/useShowers', () => ({
  useShowers: useShowersMock,
}))

vi.mock('../../hooks/useSettings', () => ({
  useSettings: useSettingsMock,
}))

describe('Calendar', () => {
  beforeEach(() => {
    useShowersMock.mockReset()
    useSettingsMock.mockReset()
  })

  it('loads the month and calls onDayClick when a day is selected', async () => {
    const getShowersByDateRange = vi.fn().mockResolvedValue([])
    const onDayClick = vi.fn()

    useShowersMock.mockReturnValue({
      getShowersByDateRange,
    })
    useSettingsMock.mockReturnValue({
      settings: {
        firstDayOfWeek: 0,
      },
    })

    const { container } = render(<Calendar onDayClick={onDayClick} />)

    await waitFor(() => {
      expect(getShowersByDateRange).toHaveBeenCalledTimes(1)
    })

    const dayButton = container.querySelector('button[data-date]') as HTMLButtonElement
    expect(dayButton).not.toBeNull()
    await waitFor(() => {
      expect(dayButton).not.toBeDisabled()
    })

    fireEvent.click(dayButton)
    expect(onDayClick).toHaveBeenCalledTimes(1)
  })

  it('loads showers through the end of the final day for inclusive month ranges', async () => {
    const getShowersByDateRange = vi.fn().mockResolvedValue([])

    useShowersMock.mockReturnValue({
      getShowersByDateRange,
    })
    useSettingsMock.mockReturnValue({
      settings: {
        firstDayOfWeek: 0,
      },
    })

    render(<Calendar />)

    await waitFor(() => {
      expect(getShowersByDateRange).toHaveBeenCalledTimes(1)
    })

    const [, endDate] = getShowersByDateRange.mock.calls[0]
    expect(endDate.getHours()).toBe(23)
    expect(endDate.getMinutes()).toBe(59)
    expect(endDate.getSeconds()).toBe(59)
    expect(endDate.getMilliseconds()).toBe(999)
  })

  it('shows up to three dots for showers in a calendar day cell', async () => {
    const showerDate = new Date()
    showerDate.setDate(15)
    const getShowersByDateRange = vi.fn().mockResolvedValue([
      {
        id: '1',
        timestamp: new Date(showerDate.getFullYear(), showerDate.getMonth(), 15, 8, 0),
      },
      {
        id: '2',
        timestamp: new Date(showerDate.getFullYear(), showerDate.getMonth(), 15, 12, 0),
      },
      {
        id: '3',
        timestamp: new Date(showerDate.getFullYear(), showerDate.getMonth(), 15, 18, 0),
      },
      {
        id: '4',
        timestamp: new Date(showerDate.getFullYear(), showerDate.getMonth(), 15, 22, 0),
      },
    ])

    useShowersMock.mockReturnValue({
      getShowersByDateRange,
    })
    useSettingsMock.mockReturnValue({
      settings: {
        firstDayOfWeek: 0,
      },
    })

    const { container } = render(<Calendar />)

    await waitFor(() => {
      expect(getShowersByDateRange).toHaveBeenCalledTimes(1)
    })

    const dayButton = container.querySelector('button[title*="15"][title*="4 showers"]')
    expect(dayButton?.querySelectorAll('[data-testid="shower-dot"]')).toHaveLength(3)
    expect(dayButton?.textContent).not.toContain('+')
  })

  it('opens a go to month dialog from the month header and loads the selected month', async () => {
    const getShowersByDateRange = vi.fn().mockResolvedValue([])

    useShowersMock.mockReturnValue({
      getShowersByDateRange,
    })
    useSettingsMock.mockReturnValue({
      settings: {
        firstDayOfWeek: 0,
      },
    })

    render(<Calendar />)

    await waitFor(() => {
      expect(getShowersByDateRange).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByTestId('calendar-month-trigger')).not.toBeDisabled()
    })

    fireEvent.click(screen.getByTestId('calendar-month-trigger'))
    expect(screen.getByTestId('go-to-month-dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('month-option-6'))
    fireEvent.change(screen.getByTestId('go-to-year-input'), {
      target: { value: '2024' },
    })
    fireEvent.click(screen.getByTestId('go-to-month-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('calendar-month')).toHaveTextContent('July')
    })

    expect(getShowersByDateRange).toHaveBeenLastCalledWith(
      new Date(2024, 6, 1, 0, 0, 0, 0),
      new Date(2024, 6, 31, 23, 59, 59, 999)
    )
  })

  it('keeps calendar controls enabled while a new month is loading', async () => {
    let resolveMonthLoad!: (showers: []) => void
    const getShowersByDateRange = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockImplementationOnce(() => new Promise<[]>((resolve) => {
        resolveMonthLoad = resolve
      }))

    useShowersMock.mockReturnValue({
      getShowersByDateRange,
    })
    useSettingsMock.mockReturnValue({
      settings: {
        firstDayOfWeek: 0,
      },
    })

    render(<Calendar />)

    await waitFor(() => {
      expect(getShowersByDateRange).toHaveBeenCalledTimes(1)
    })

    fireEvent.click(screen.getByTestId('next-month'))

    expect(screen.getByRole('button', { name: 'Today' })).not.toBeDisabled()
    expect(screen.getByTestId('prev-month')).not.toBeDisabled()
    expect(screen.getByTestId('next-month')).not.toBeDisabled()
    expect(screen.getByTestId('calendar-month-trigger')).not.toBeDisabled()

    await act(async () => {
      resolveMonthLoad([])
    })
  })
})
