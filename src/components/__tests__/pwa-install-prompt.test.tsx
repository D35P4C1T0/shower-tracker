import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PWAInstallPrompt } from '../pwa-install-prompt'

describe('PWAInstallPrompt', () => {
  it('renders without crashing', () => {
    render(<PWAInstallPrompt />)
    expect(document.body).toBeTruthy()
  })
})