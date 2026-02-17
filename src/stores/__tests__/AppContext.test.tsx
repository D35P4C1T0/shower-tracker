import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProvider, useAppContext } from '../AppContext'

const {
  databaseServiceMock,
  showerServiceMock,
  settingsServiceMock,
  metadataServiceMock,
} = vi.hoisted(() => ({
  databaseServiceMock: {
    initialize: vi.fn(),
  },
  showerServiceMock: {
    getAllShowers: vi.fn(),
  },
  settingsServiceMock: {
    getSettings: vi.fn(),
  },
  metadataServiceMock: {
    getLastNotificationCheck: vi.fn(),
  },
}))

vi.mock('../../lib/database-service', () => ({
  DatabaseService: databaseServiceMock,
  ShowerService: showerServiceMock,
  SettingsService: settingsServiceMock,
  MetadataService: metadataServiceMock,
}))

function ContextProbe() {
  const { state } = useAppContext()
  return (
    <div>
      <span data-testid="status">{state.isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="showers">{state.showers.length}</span>
    </div>
  )
}

describe('AppContext', () => {
  beforeEach(() => {
    databaseServiceMock.initialize.mockReset()
    showerServiceMock.getAllShowers.mockReset()
    settingsServiceMock.getSettings.mockReset()
    metadataServiceMock.getLastNotificationCheck.mockReset()

    databaseServiceMock.initialize.mockResolvedValue(undefined)
    showerServiceMock.getAllShowers.mockResolvedValue([
      { id: '1', timestamp: new Date('2025-01-01T00:00:00.000Z') },
    ])
    settingsServiceMock.getSettings.mockResolvedValue({
      theme: 'system',
      firstDayOfWeek: 0,
      notificationsEnabled: false,
      notificationThresholdDays: 3,
      projectInfo: {
        githubRepo: 'https://github.com/D35P4C1T0/shower-tracker',
        author: 'D35P4C1T0',
      },
    })
    metadataServiceMock.getLastNotificationCheck.mockResolvedValue(null)
  })

  it('loads initial data into state', async () => {
    render(
      <AppProvider>
        <ContextProbe />
      </AppProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready')
      expect(screen.getByTestId('showers')).toHaveTextContent('1')
    })
  })
})
