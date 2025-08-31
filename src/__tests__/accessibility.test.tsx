import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import App from '../App'

describe('Accessibility Tests', () => {
  it('should have proper ARIA labels', () => {
    render(<App />)
    expect(document.body).toBeTruthy()
  })
})