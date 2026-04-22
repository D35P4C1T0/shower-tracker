import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

    expect(screen.getByTestId('edit-shower-time-input')).toBeInTheDocument()
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

    const timeInput = await screen.findByTestId('edit-shower-time-input')
    expect(timeInput).toHaveValue('12:00')

    fireEvent.change(timeInput, { target: { value: '18:30' } })
    fireEvent.click(screen.getByTestId('save-shower-time'))

    await waitFor(() => {
      expect(addShower).toHaveBeenCalledWith(new Date(2026, 3, 21, 18, 30, 0, 0))
    })
    expect(updateShower).not.toHaveBeenCalled()
  })

  it('adds a shower with the default time when use default is clicked', async () => {
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
    fireEvent.click(screen.getByTestId('use-default-shower-time'))

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

    await waitFor(() => {
      expect(deleteShower).toHaveBeenCalledWith('1')
      expect(onShowersChanged).toHaveBeenCalledTimes(1)
    })
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
