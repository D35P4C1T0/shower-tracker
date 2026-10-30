import { test, expect } from '@playwright/test'
import { openApp, recordShower, todayButton } from './helpers'

test.beforeEach(async ({ page }) => {
  await openApp(page)
})

test('records a shower and displays it in calendar @smoke', async ({ page }) => {
  await recordShower(page)
  await page.getByRole('button', { name: 'Calendar', exact: true }).click()
  await expect(await todayButton(page)).toHaveClass(/has-shower/)
})

test('persists theme and calendar settings after reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  const settings = page.getByTestId('settings-page')
  await settings.getByRole('button', { name: 'Toggle theme', exact: true }).press('Enter')
  await page.getByRole('menuitem', { name: 'Dark', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByRole('combobox', { name: 'First day of week' }).click()
  await page.getByRole('option', { name: 'Monday', exact: true }).click()
  await expect(page.getByText('First day of week updated successfully.')).toBeVisible()
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'First day of week' })).toHaveText('Monday')
})

test('displays time since last shower @smoke', async ({ page }) => {
  await recordShower(page)
  await expect(page.getByTestId('last-shower-time')).toContainText('Logged on')
  await expect(page.getByText(/^\d+ seconds? ago$/)).toBeVisible()
})

test('navigates offline and restores online status', async ({ page, context }) => {
  await recordShower(page)
  await context.setOffline(true)
  // Firefox's network emulation does not reliably emit status events in an open page.
  await page.evaluate(() => window.dispatchEvent(new Event('offline')))
  await expect(page.getByTestId('offline-indicator')).toBeVisible()
  await page.getByRole('button', { name: 'Calendar', exact: true }).click()
  await expect(await todayButton(page)).toHaveClass(/has-shower/)
  await context.setOffline(false)
  await page.evaluate(() => window.dispatchEvent(new Event('online')))
  await expect(page.getByTestId('offline-indicator')).not.toBeVisible()
})

test('remembers onboarding completion', async ({ page }) => {
  await expect(page.getByTestId('onboarding-dialog')).not.toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('shower-tracker-onboarding-complete'))).toBe('true')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Record shower', exact: true })).toBeEnabled()
  await expect(page.getByTestId('onboarding-dialog')).not.toBeVisible()
})

test('navigates calendar months including month-end @smoke', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-01-31T12:00:00'))
  await page.getByRole('button', { name: 'Calendar', exact: true }).click()
  await expect(page.getByTestId('calendar-month')).toHaveText('January')
  await page.getByRole('button', { name: 'Next month', exact: true }).click()
  await expect(page.getByTestId('calendar-month')).toHaveText('February')
  await page.getByRole('button', { name: 'Previous month', exact: true }).click()
  await expect(page.getByTestId('calendar-month')).toHaveText('January')
})

test('edits notes and deletes a shower from calendar details', async ({ page }) => {
  await recordShower(page)
  await page.getByRole('button', { name: 'Calendar', exact: true }).click()
  await (await todayButton(page)).click()
  const details = page.getByTestId('shower-details')
  await expect(details).toContainText('1 shower recorded')
  await details.getByRole('button', { name: 'Edit shower', exact: true }).click()
  await page.getByTestId('edit-shower-notes').fill('After exercise')
  await page.getByTestId('save-shower-time').click()
  await expect(page.getByTestId('edit-time-dialog')).not.toBeVisible()
  await expect(details).toContainText('After exercise')
  await details.getByRole('button', { name: 'Edit shower', exact: true }).click()
  await page.getByTestId('delete-shower-from-edit').click()
  await expect(details).toContainText('No showers recorded')
  await expect(await todayButton(page)).not.toHaveClass(/has-shower/)
  await page.getByRole('button', { name: 'Close details', exact: true }).click()
  await expect(details).not.toBeVisible()
})

test('records and navigates using the keyboard', async ({ page }) => {
  const record = page.getByRole('button', { name: 'Record shower', exact: true })
  await record.focus()
  await expect(record).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Shower recorded!', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Calendar', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(await todayButton(page)).toHaveClass(/has-shower/)
})

test('rejects future shower edits without losing the original', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-01-15T12:00:00'))
  await recordShower(page)
  await page.getByRole('button', { name: 'Calendar', exact: true }).click()
  await (await todayButton(page)).click()
  await page.getByRole('button', { name: 'Edit shower', exact: true }).click()
  await page.getByTestId('edit-shower-time-input').fill('23:59')
  await page.getByTestId('save-shower-time').click()
  await expect(page.getByText('Cannot record a shower in the future', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByTestId('shower-details')).toContainText('1 shower recorded')
})
