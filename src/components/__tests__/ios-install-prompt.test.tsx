import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { IOSInstallPrompt } from '../ios-install-prompt'

describe('IOSInstallPrompt', () => {
  it('renders without crashing', () => {
    render(<IOSInstallPrompt onDismiss={() => {}} />)
    expect(document.body).toBeTruthy()
  })
})