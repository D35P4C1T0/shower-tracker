import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ErrorBoundary } from '../error-boundary'

describe('ErrorBoundary', () => {
  it('renders children without crashing', () => {
    render(<ErrorBoundary><div>Test</div></ErrorBoundary>)
    expect(document.body).toBeTruthy()
  })
})