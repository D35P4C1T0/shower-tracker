import { test, expect, type Page } from '@playwright/test'

async function openApp(page: Page) {
  await page.goto('/')
  const onboarding = page.getByTestId('onboarding-dialog')
  await page.waitForSelector('text=Shower Tracker')
  if (await onboarding.isVisible()) await onboarding.getByRole('button', { name: 'Get started' }).click()
  await expect(page.getByRole('button', { name: 'Record shower', exact: true })).toBeVisible()
}

async function exportData(page: Page) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Export / Import Data', exact: true }).click()
  const download = page.waitForEvent('download')
  await page.getByTestId('export-data').click()
  const file = await download
  const stream = await file.createReadStream()
  const chunks = []
  for await (const chunk of stream!) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString())
}

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
  await page.getByRole('button', { name: 'Toggle theme', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Dark', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  const data = await exportData(page)
  expect(data.showers).toHaveLength(1)
  expect(data.settings.theme).toBe('dark')
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('legacy theme survives migration and imported theme takes precedence', async ({ page }) => {
  await page.goto('/')
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
  await openApp(page)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    const cache = await caches.open('another-app-offline')
    await cache.put('/another-app-document', new Response('keep'))
  })
  await page.route('**/version.json', route => route.fulfill({
    json: { version: '9.9.9', buildId: '9.9.9-new-release' }
  }))
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.getByText('Version 9.9.9 is available!')).toBeVisible()
  await page.getByRole('button', { name: 'Update Now', exact: true }).click()
  await expect(page).toHaveURL(/app-version=9.9.9-new-release/)
  expect(await page.evaluate(async () => {
    const cache = await caches.open('another-app-offline')
    return (await cache.match('/another-app-document'))?.text()
  })).toBe('keep')
})
