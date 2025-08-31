import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SettingsPage } from '../SettingsPage'

describe('SettingsPage', () => {
  it('renders without crashing', () => {
    render(<SettingsPage />)
    expect(document.body).toBeTruthy()
  })
})