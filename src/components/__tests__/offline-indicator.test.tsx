import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { OfflineIndicator } from '../offline-indicator'

describe('OfflineIndicator', () => {
  it('renders without crashing', () => {
    render(<OfflineIndicator />)
    expect(document.body).toBeTruthy()
  })
})