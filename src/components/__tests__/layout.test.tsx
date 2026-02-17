import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Layout } from '../layout'

vi.mock('../theme-switcher', () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher" />,
}))

vi.mock('../bottom-navigation', () => ({
  BottomNavigation: () => <div data-testid="bottom-navigation" />,
}))

describe('Layout', () => {
  it('renders title, content and navigation by default', () => {
    render(
      <Layout title="My App">
        <div>Body</div>
      </Layout>
    )

    expect(screen.getByText('My App')).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
    expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument()
  })

  it('hides navigation when requested', () => {
    render(
      <Layout showNavigation={false}>
        <div>Body</div>
      </Layout>
    )

    expect(screen.queryByTestId('bottom-navigation')).not.toBeInTheDocument()
  })
})
