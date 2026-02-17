import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AndroidInstallPrompt } from '../android-install-prompt'

describe('AndroidInstallPrompt', () => {
  it('invokes install and dismiss actions', async () => {
    const onInstall = vi.fn().mockResolvedValue(true)
    const onDismiss = vi.fn()
    render(
      <AndroidInstallPrompt
        onInstall={onInstall}
        onDismiss={onDismiss}
        isInstalling={false}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Install' }))
    await waitFor(() => {
      expect(onInstall).toHaveBeenCalledTimes(1)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
