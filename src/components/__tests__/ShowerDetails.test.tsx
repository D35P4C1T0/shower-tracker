import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ShowerDetails, getTimestampForAddedShower } from '../ShowerDetails'

const { useShowersMock, useToastMock } = vi.hoisted(() => ({
  useShowersMock: vi.fn(),
  useToastMock: vi.fn(),
}))

vi.mock('../../hooks/useShowers', () => ({
  useShowers: useShowersMock,
}))

vi.mock('../toast', () => ({
  useToast: useToastMock,
}))

describe('ShowerDetails', () => {
  afterEach(() => vi.useRealTimers())
  beforeEach(() => {
    useShowersMock.mockReset()
    useToastMock.mockReset()
  })

  it('opens the time dialog before adding a shower for an empty day', () => {
    const addShower = vi.fn().mockResolvedValue(undefined)
    const onShowersChanged = vi.fn()

    useShowersMock.mockReturnValue({
      addShower,
      deleteShower: vi.fn(),
      updateShower: vi.fn(),
    })
    useToastMock.mockReturnValue({
      success: vi.fn(),
      error: vi.fn(),
    })

    render(
      <ShowerDetails
        date={new Date('2025-01-01T00:00:00.000Z')}
        showers={[]}
        onShowersChanged={onShowersChanged}
      />
    )

    fireEvent.click(screen.getByTestId('add-shower-for-day'))

    expect(screen.getByTestId('edit-shower-time-input')).toHaveClass('min-w-0', 'max-w-full')
    expect(screen.getByTestId('edit-shower-time-input')).not.toBeVisible()
    expect(screen.getByTestId('edit-shower-notes')).not.toBeVisible()
    expect(screen.getByRole('button', { name: 'Noon · 12:00' })).toHaveAttribute('aria-pressed', 'true')
    expect(addShower).not.toHaveBeenCalled()
    expect(onShowersChanged).not.toHaveBeenCalled()
  })

  it('uses the current local time when adding a shower for today', () => {
    const now = new Date(2026, 3, 22, 18, 45, 12, 123)
    const selectedToday = new Date(2026, 3, 22, 0, 0, 0, 0)

    expect(getTimestampForAddedShower(selectedToday, now)).toEqual(now)
  })

  it('uses noon when adding a shower for another day', () => {
    const now = new Date(2026, 3, 22, 18, 45, 12, 123)
    const selectedDay = new Date(2026, 3, 21, 0, 0, 0, 0)

    expect(getTimestampForAddedShower(selectedDay, now)).toEqual(new Date(2026, 3, 21, 12, 0, 0, 0))
  })

  it('adds a shower with the selected time from the calendar page', async () => {
    const addShower = vi.fn().mockResolvedValue({
      id: '1',
      timestamp: new Date(2026, 3, 21, 18, 30, 0, 0),
    })
    const updateShower = vi.fn().mockResolvedValue(undefined)

    useShowersMock.mockReturnValue({
      addShower,
      deleteShower: vi.fn(),
      updateShower,
    })
    useToastMock.mockReturnValue({
      success: vi.fn(),
      error: vi.fn(),
    })

    render(
      <ShowerDetails
        date={new Date(2026, 3, 21, 0, 0, 0, 0)}
        showers={[]}
        onShowersChanged={vi.fn()}
      />
    )

    fireEvent.click(screen.getByTestId('add-shower-for-day'))

    fireEvent.click(screen.getByRole('button', { name: 'Custom time' }))
    const timeInput = await screen.findByTestId('edit-shower-time-input')
    expect(timeInput).toHaveValue('12:00')
    for (const label of ['Morning · 08:00', 'Noon · 12:00', 'Evening · 20:00']) {
      expect(screen.getByTitle(label)).toHaveAttribute('aria-pressed', 'false')
    }

    fireEvent.change(timeInput, { target: { value: '18:30' } })
    fireEvent.click(screen.getByTestId('save-shower-time'))

    await waitFor(() => {
      expect(addShower).toHaveBeenCalledWith(new Date(2026, 3, 21, 18, 30, 0, 0))
    })
    expect(updateShower).not.toHaveBeenCalled()
  })

  it('saves noon without expanding the custom time picker', async () => {
    const addShower = vi.fn().mockResolvedValue({
      id: '1',
      timestamp: new Date(2026, 3, 21, 12, 0, 0, 0),
    })

    useShowersMock.mockReturnValue({
      addShower,
      deleteShower: vi.fn(),
      updateShower: vi.fn(),
    })
    useToastMock.mockReturnValue({
      success: vi.fn(),
      error: vi.fn(),
    })

    render(
      <ShowerDetails
        date={new Date(2026, 3, 21, 0, 0, 0, 0)}
        showers={[]}
        onShowersChanged={vi.fn()}
      />
    )

    fireEvent.click(screen.getByTestId('add-shower-for-day'))
    fireEvent.click(screen.getByTestId('save-shower-time'))

    await waitFor(() => {
      expect(addShower).toHaveBeenCalledWith(new Date(2026, 3, 21, 12, 0, 0, 0))
    })
  })

  it('opens the edit time dialog from an existing shower edit button', () => {
    useShowersMock.mockReturnValue({
      addShower: vi.fn(),
      deleteShower: vi.fn(),
      updateShower: vi.fn(),
    })
    useToastMock.mockReturnValue({
      success: vi.fn(),
      error: vi.fn(),
    })

    render(
      <ShowerDetails
        date={new Date(2026, 3, 21, 0, 0, 0, 0)}
        showers={[{ id: '1', timestamp: new Date(2026, 3, 21, 9, 15, 0, 0) }]}
        onShowersChanged={vi.fn()}
      />
    )

    fireEvent.click(screen.getByTestId('edit-shower-1'))

    expect(screen.getByTestId('edit-shower-time-input')).toHaveValue('09:15')
  })

  it('deletes a shower from the edit time dialog', async () => {
    const deleteShower = vi.fn().mockResolvedValue(undefined)
    const onShowersChanged = vi.fn()

    useShowersMock.mockReturnValue({
      addShower: vi.fn(),
      deleteShower,
      updateShower: vi.fn(),
    })
    useToastMock.mockReturnValue({
      success: vi.fn(),
      error: vi.fn(),
    })

    render(
      <ShowerDetails
        date={new Date(2026, 3, 21, 0, 0, 0, 0)}
        showers={[{ id: '1', timestamp: new Date(2026, 3, 21, 9, 15, 0, 0) }]}
        onShowersChanged={onShowersChanged}
      />
    )

    fireEvent.click(screen.getByTestId('edit-shower-1'))
    fireEvent.click(screen.getByTestId('delete-shower-from-edit'))
    expect(deleteShower).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog', { name: 'Delete shower?' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(deleteShower).not.toHaveBeenCalled()
    expect(screen.getByTestId('edit-shower-time-input')).toHaveValue('09:15')
    fireEvent.click(screen.getByTestId('delete-shower-from-edit'))
    fireEvent.click(screen.getByTestId('confirm-delete-shower'))

    await waitFor(() => {
      expect(deleteShower).toHaveBeenCalledWith('1')
      expect(onShowersChanged).toHaveBeenCalledTimes(1)
    })
  })


  it.each([
    ['Morning · 08:00', 8],
    ['Noon · 12:00', 12],
    ['Evening · 20:00', 20],
  ])('saves the %s preset and keeps a hidden draft note', async (label, hour) => {
    const addShower = vi.fn().mockResolvedValue(undefined)
    useShowersMock.mockReturnValue({ addShower, deleteShower: vi.fn(), updateShower: vi.fn() })
    useToastMock.mockReturnValue({ success: vi.fn(), error: vi.fn() })
    render(<ShowerDetails date={new Date(2026, 3, 21)} showers={[]} />)
    fireEvent.click(screen.getByTestId('add-shower-for-day'))
    fireEvent.click(screen.getByRole('button', { name: 'Add a note' }))
    fireEvent.change(screen.getByTestId('edit-shower-notes'), { target: { value: 'After exercise' } })
    fireEvent.click(screen.getByRole('button', { name: 'Hide note' }))
    fireEvent.click(screen.getByRole('button', { name: 'Custom time' }))
    expect(screen.getByRole('button', { name: 'Time presets' })).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Time presets' }))
    fireEvent.click(screen.getByRole('button', { name: label }))
    expect(screen.getByTestId('edit-shower-time-input')).not.toBeVisible()
    expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByTestId('save-shower-time'))
    await waitFor(() => expect(addShower).toHaveBeenCalledWith(new Date(2026, 3, 21, hour), 'After exercise'))
  })

  it('disables future presets for today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 22, 10, 30))
    useShowersMock.mockReturnValue({ addShower: vi.fn(), deleteShower: vi.fn(), updateShower: vi.fn() })
    useToastMock.mockReturnValue({ success: vi.fn(), error: vi.fn() })
    render(<ShowerDetails date={new Date(2026, 3, 22)} showers={[]} />)
    fireEvent.click(screen.getByTestId('add-shower-for-day'))
    expect(screen.getByTestId('edit-shower-time-input')).toBeVisible()
    expect(screen.getByTestId('edit-shower-time-input')).toHaveValue('10:30')
    fireEvent.click(screen.getByRole('button', { name: 'Time presets' }))
    expect(screen.getByRole('button', { name: 'Morning · 08:00' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Noon · 12:00' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Evening · 20:00' })).toBeDisabled()
  })

  it.each([
    ['down', 0, 80, true],
    ['up', 0, -80, false],
    ['sideways', 80, 10, false],
    ['a small movement', 0, 10, false],
  ])('only dismisses the drawer for a downward handle swipe: %s', async (_direction, x, y, closes) => {
    const addShower = vi.fn()
    useShowersMock.mockReturnValue({ addShower, deleteShower: vi.fn(), updateShower: vi.fn() })
    useToastMock.mockReturnValue({ success: vi.fn(), error: vi.fn() })
    render(<ShowerDetails date={new Date(2026, 3, 21)} showers={[]} />)
    fireEvent.click(screen.getByTestId('add-shower-for-day'))
    const handle = screen.getByTestId('shower-drawer-handle')
    const start = { clientX: 100, clientY: 100 }
    const end = { clientX: 100 + x, clientY: 100 + y }
    fireEvent.touchStart(handle, { touches: [start], changedTouches: [start] })
    fireEvent.touchMove(handle, { touches: [end], changedTouches: [end] })
    fireEvent.touchEnd(handle, { touches: [], changedTouches: [end] })
    await waitFor(() => {
      if (closes) expect(screen.queryByTestId('edit-time-dialog')).not.toBeInTheDocument()
      else expect(screen.getByTestId('edit-time-dialog')).toBeVisible()
    })
    expect(addShower).not.toHaveBeenCalled()
  })

  it('opens existing notes and preserves the time when editing notes', async () => {
    const updateShower = vi.fn().mockResolvedValue(undefined)
    useShowersMock.mockReturnValue({ addShower: vi.fn(), deleteShower: vi.fn(), updateShower })
    useToastMock.mockReturnValue({ success: vi.fn(), error: vi.fn() })
    const timestamp = new Date(2026, 3, 21, 9, 15)
    render(<ShowerDetails date={new Date(2026, 3, 21)} showers={[{ id: '1', timestamp, notes: 'Old note' }]} />)
    fireEvent.click(screen.getByTestId('edit-shower-1'))
    expect(screen.getByTestId('edit-shower-time-input')).toBeVisible()
    expect(screen.getByTestId('edit-shower-notes')).toBeVisible()
    fireEvent.change(screen.getByTestId('edit-shower-notes'), { target: { value: 'Updated note' } })
    fireEvent.click(screen.getByTestId('save-shower-time'))
    await waitFor(() => expect(updateShower).toHaveBeenCalledWith('1', { timestamp, notes: 'Updated note' }))
  })

  it('disables the add shower action for future days', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)

    useShowersMock.mockReturnValue({
      addShower: vi.fn(),
      deleteShower: vi.fn(),
      updateShower: vi.fn(),
    })
    useToastMock.mockReturnValue({
      success: vi.fn(),
      error: vi.fn(),
    })

    render(
      <ShowerDetails
        date={futureDate}
        showers={[]}
        onShowersChanged={vi.fn()}
      />
    )

    expect(screen.getByText('Cannot add showers for future days.')).toBeInTheDocument()
    expect(screen.getByTestId('add-shower-for-day')).toBeDisabled()
  })
})
