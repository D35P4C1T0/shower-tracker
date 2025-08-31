import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { NotificationBanner } from '../notification-banner'

describe('NotificationBanner', () => {
  it('renders without crashing', () => {
    render(<NotificationBanner />)
    expect(document.body).toBeTruthy()
  })
})