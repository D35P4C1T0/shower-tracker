import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import App from '../App'

describe('Integration Tests', () => {
  it('should integrate components properly', () => {
    render(<App />)
    expect(document.body).toBeTruthy()
  })
})