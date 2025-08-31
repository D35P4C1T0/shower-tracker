import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ShowerDetails } from '../ShowerDetails'

describe('ShowerDetails', () => {
  it('renders without crashing', () => {
    const mockShower = {
      id: '1',
      timestamp: new Date(),
      duration: 10,
      temperature: 'warm' as const,
      rating: 5
    }
    render(<ShowerDetails shower={mockShower} onEdit={() => {}} onDelete={() => {}} />)
    expect(document.body).toBeTruthy()
  })
})