import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ShowerDetails } from '../ShowerDetails'

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

  it('adds a shower for an empty day and notifies parent', async () => {
    const addShower = vi.fn().mockResolvedValue(undefined)
    const onShowersChanged = vi.fn()

    useShowersMock.mockReturnValue({
      addShower,
      deleteShower: vi.fn(),
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

    await waitFor(() => {
      expect(addShower).toHaveBeenCalledTimes(1)
      expect(onShowersChanged).toHaveBeenCalledTimes(1)
    })
  })
})
