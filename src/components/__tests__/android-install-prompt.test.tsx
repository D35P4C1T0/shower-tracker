import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AndroidInstallPrompt } from '../android-install-prompt'

describe('AndroidInstallPrompt', () => {
  it('renders without crashing', () => {
    render(<AndroidInstallPrompt onInstall={() => {}} onDismiss={() => {}} />)
    expect(document.body).toBeTruthy()
  })
})