import { test, expect } from '@playwright/test'
import { openApp, recordShower, exportData, waitForOfflineReady } from './helpers'

test('registers a service worker and takes control @smoke', async ({ page }) => {
  await openApp(page)
  await waitForOfflineReady(page)
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated')
})

test('loads cached app and records showers after an offline reload', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit aborts offline service-worker navigations with an internal error in this harness; offline writes are covered separately')
  await openApp(page)
  await waitForOfflineReady(page)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByTestId('offline-indicator')).toBeVisible()
  await recordShower(page)
  await context.setOffline(false)
  await page.reload()
  expect((await exportData(page)).showers).toHaveLength(1)
})

test('keeps both online and offline records after reconnecting', async ({ page, context }) => {
  await openApp(page)
  await recordShower(page)
  await context.setOffline(true)
  // Remove the earlier toast so the second assertion must observe the new write.
  await page.getByRole('button', { name: 'Close notification', exact: true }).click()
  await expect(page.getByTestId('toast')).toHaveCount(0)
  await recordShower(page)
  await context.setOffline(false)
  await page.reload()
  expect((await exportData(page)).showers).toHaveLength(2)
})

test('shows iOS installation instructions', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1'
    })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Get started', exact: true }).click()
  await expect(page.getByText('Install App', { exact: true })).toBeVisible()
  await expect(page.getByText('Select "Add to Home Screen"', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Got it', exact: true }).click()
  await expect(page.getByText('Install App', { exact: true })).not.toBeVisible()
})

test('calls the Android installation prompt and hides it after acceptance', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36'
    })
  })
  await openApp(page)
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true })
    Object.assign(event, {
      prompt: async () => { document.documentElement.dataset.installPrompted = 'true' },
      userChoice: Promise.resolve({ outcome: 'accepted' })
    })
    window.dispatchEvent(event)
  })
  await page.getByRole('button', { name: 'Install', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-install-prompted', 'true')
  await expect(page.getByText('Install App', { exact: true })).not.toBeVisible()
})

test('enables notifications and persists the reminder threshold', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit cannot grant notification permission')
  await context.grantPermissions(['notifications'], { origin: 'http://localhost:4173' })
  await openApp(page)
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  expect(await page.evaluate(() => Notification.permission)).toBe('granted')
  const toggle = page.getByTestId('notification-toggle')
  await expect(toggle).toBeEnabled()
  await toggle.click()
  await expect(toggle).toBeChecked()
  await page.getByLabel('Reminder threshold (days)').fill('5')
  await page.getByLabel('Reminder threshold (days)').blur()
  await expect(page.getByText('Notification threshold updated successfully.')).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await expect(page.getByTestId('notification-toggle')).toBeChecked()
  await expect(page.getByLabel('Reminder threshold (days)')).toHaveValue('5')
})

test('persists theme across tabs @smoke', async ({ page, context }) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Toggle theme', exact: true }).press('Enter')
  await page.getByRole('menuitem', { name: 'Dark', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  const other = await context.newPage()
  await openApp(other)
  await expect(other.locator('html')).toHaveClass(/dark/)
})

test('reports fallback storage quota errors without losing saved history', async ({ page }) => {
  await page.addInitScript(() => {
    indexedDB.open = () => { throw new Error('IndexedDB unavailable') }
  })
  await openApp(page)
  await recordShower(page)
  const original = await page.evaluate(() => localStorage.getItem('shower-tracker-data-v1'))
  await page.getByRole('button', { name: 'Close notification', exact: true }).click()
  await expect(page.getByTestId('toast')).toHaveCount(0)
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage full', 'QuotaExceededError') }
  })
  await page.getByRole('button', { name: 'Record shower', exact: true }).click()
  await expect(page.getByTestId('toast').filter({ hasText: 'Failed to record shower' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('shower-tracker-data-v1'))).toBe(original)
  expect((await exportData(page)).showers).toHaveLength(1)
})
