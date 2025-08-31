import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AppProvider } from '../AppContext'

describe('AppContext', () => {
  it('renders without crashing', () => {
    render(<AppProvider><div>Test</div></AppProvider>)
    expect(document.body).toBeTruthy()
  })
})