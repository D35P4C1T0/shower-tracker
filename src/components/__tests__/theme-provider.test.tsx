import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ThemeProvider } from '../theme-provider'

describe('ThemeProvider', () => {
  it('renders without crashing', () => {
    render(<ThemeProvider><div>Test</div></ThemeProvider>)
    expect(document.body).toBeTruthy()
  })
})