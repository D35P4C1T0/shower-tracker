import { test, expect } from '@playwright/test'
import { openApp, exportData } from './helpers'

test('two tabs keep fallback writes after reload even when IndexedDB returns', async ({ page, context }) => {
  await context.addInitScript(() => {
    if (localStorage.getItem('shower-tracker-data-v1') === null) {
      indexedDB.open = () => { throw new Error('IndexedDB unavailable') }
    }
    localStorage.setItem('shower-tracker-onboarding-complete', 'true')
  })
  const other = await context.newPage()
  await Promise.all([openApp(page), openApp(other)])
  await Promise.all([
    page.getByRole('button', { name: 'Record shower', exact: true }).click(),
    other.getByRole('button', { name: 'Record shower', exact: true }).click(),
  ])
  await Promise.all([
    expect(page.getByText('Shower recorded!', { exact: true })).toBeVisible(),
    expect(other.getByText('Shower recorded!', { exact: true })).toBeVisible(),
  ])
  await page.reload()
  expect((await exportData(page)).showers).toHaveLength(2)
})

test('IndexedDB tracking and themes work with localStorage blocked', async ({ page, context }) => {
  await context.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage blocked') }
    Storage.prototype.setItem = () => { throw new Error('Storage blocked') }
    Storage.prototype.removeItem = () => { throw new Error('Storage blocked') }
  })
  await openApp(page)
  await page.getByRole('button', { name: 'Record shower', exact: true }).click()
  await expect(page.getByText('Shower recorded!', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Toggle theme', exact: true }).press('Enter')
  await page.getByRole('menuitem', { name: 'Dark', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  const data = await exportData(page)
  expect(data.showers).toHaveLength(1)
  expect(data.settings.theme).toBe('dark')
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('legacy theme survives migration and imported theme takes precedence', async ({ page }) => {
  await openApp(page)
  await page.evaluate(() => {
    localStorage.setItem('shower-tracker-theme', 'dark')
    localStorage.setItem('shower-tracker-onboarding-complete', 'true')
  })
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  const data = await exportData(page)
  expect(data.settings.theme).toBe('dark')
  await page.getByTestId('import-data-text').fill(JSON.stringify({
    ...data, settings: { ...data.settings, theme: 'light' }
  }))
  await page.getByTestId('import-data').click()
  await expect(page.locator('html')).toHaveClass(/light/)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/light/)
  expect(await page.evaluate(() => localStorage.getItem('shower-tracker-theme'))).toBeNull()
})

test('new version prompts for an update and preserves another app cache', async ({ page }) => {
  // Browser routing cannot consistently intercept requests controlled by a service worker.
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window)
    window.fetch = (input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      if (new URL(url, location.href).pathname.endsWith('/version.json')) {
        return Promise.resolve(Response.json({ version: '9.9.9', buildId: '9.9.9-new-release' }))
      }
      return originalFetch(input, init)
    }
  })
  await openApp(page)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    const cache = await caches.open('another-app-offline')
    await cache.put('/another-app-document', new Response('keep'))
  })
  await expect(page.getByText('Version 9.9.9 is available!')).toBeVisible()
  await page.getByRole('button', { name: 'Update Now', exact: true }).click()
  await expect(page).toHaveURL(/app-version=9.9.9-new-release/)
  expect(await page.evaluate(async () => {
    const cache = await caches.open('another-app-offline')
    return (await cache.match('/another-app-document'))?.text()
  })).toBe('keep')
})
