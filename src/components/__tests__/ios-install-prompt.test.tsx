import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { IOSInstallPrompt } from '../ios-install-prompt'

describe('IOSInstallPrompt', () => {
  it('calls onDismiss when user acknowledges the prompt', () => {
    const onDismiss = vi.fn()
    render(<IOSInstallPrompt onDismiss={onDismiss} />)

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
