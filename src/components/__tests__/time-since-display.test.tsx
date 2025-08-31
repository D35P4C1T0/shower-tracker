import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TimeSinceDisplay } from '../time-since-display'

describe('TimeSinceDisplay', () => {
  it('renders without crashing', () => {
    render(<TimeSinceDisplay lastShower={new Date()} />)
    expect(document.body).toBeTruthy()
  })
})