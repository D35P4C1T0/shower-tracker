import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Layout } from '../layout'

describe('Layout', () => {
  it('renders without crashing', () => {
    render(<Layout><div>Test</div></Layout>)
    expect(document.body).toBeTruthy()
  })
})