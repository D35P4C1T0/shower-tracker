import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Toast } from '../toast'

describe('Toast', () => {
  it('renders without crashing', () => {
    render(<Toast message="Test" type="success" onClose={() => {}} />)
    expect(document.body).toBeTruthy()
  })
})