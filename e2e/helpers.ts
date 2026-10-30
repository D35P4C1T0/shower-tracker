import { expect, type Page } from '@playwright/test'

export async function openApp(page: Page) {
  // Dismiss the delayed iOS install overlay during unrelated flows, including reloads.
  await page.addLocatorHandler(page.getByRole('button', { name: 'Got it', exact: true }), async button => {
    await button.click()
  })
  await page.goto('/')
  const record = page.getByRole('button', { name: 'Record shower', exact: true })
  await expect(page.locator('h1')).toHaveText('Shower Tracker')
  const onboarding = page.getByTestId('onboarding-dialog')
  if (await onboarding.isVisible()) {
    await onboarding.getByRole('button', { name: 'Get started' }).click()
  }
  await expect(record).toBeEnabled()
}

export async function recordShower(page: Page) {
  await page.getByRole('button', { name: 'Record shower', exact: true }).click()
  await expect(page.getByText('Shower recorded!', { exact: true })).toBeVisible()
}

export async function todayButton(page: Page) {
  const today = await page.evaluate(() => {
    const date = new Date()
    return [date.getFullYear(), `${date.getMonth() + 1}`.padStart(2, '0'), `${date.getDate()}`.padStart(2, '0')].join('-')
  })
  return page.locator(`button[data-date="${today}"]`)
}

export async function exportData(page: Page) {
  await page.bringToFront()
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Export / Import Data', exact: true }).click()
  const [file] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('export-data').click()
  ])
  const stream = await file.createReadStream()
  const chunks = []
  for await (const chunk of stream!) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString())
}

export async function waitForOfflineReady(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }))
    }
  })
}
