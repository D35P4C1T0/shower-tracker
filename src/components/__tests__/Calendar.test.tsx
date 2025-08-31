import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Calendar } from '../Calendar'

describe('Calendar', () => {
  it('renders without crashing', () => {
    render(<Calendar showers={[]} onDateSelect={() => {}} />)
    expect(document.body).toBeTruthy()
  })
})