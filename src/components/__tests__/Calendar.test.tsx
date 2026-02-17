import { fireEvent, render, waitFor } from '@testing-library/react'
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

    fireEvent.click(dayButton)
    expect(onDayClick).toHaveBeenCalledTimes(1)
  })
})
