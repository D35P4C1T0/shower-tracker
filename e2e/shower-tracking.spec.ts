import { test, expect } from '@playwright/test'

test.describe('Shower Tracking E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for app to load
    await page.waitForSelector('text=Shower Tracker')
  })

  test('should record a shower and display it in calendar', async ({ page }) => {
    // Record a shower
    await page.click('button:has-text("Record it")')
    
    // Wait for success message
    await expect(page.locator('text=Shower recorded')).toBeVisible()
    
    // Navigate to calendar
    await page.click('button[aria-label="Calendar"]')
    
    // Check that today's date has a shower indicator
    const today = new Date()
    const todayButton = page.locator(`button[data-date="${today.toISOString().split('T')[0]}"]`)
    await expect(todayButton).toHaveClass(/has-shower/)
  })

  test('should update settings and persist changes', async ({ page }) => {
    // Navigate to settings
    await page.click('button[aria-label="Settings"]')
    
    // Toggle notifications
    await page.click('button[role="switch"]:has-text("Enable Notifications")')
    
    // Set notification threshold
    await page.fill('input[type="number"]', '5')
    
    // Change theme
    await page.click('button:has-text("Theme")')
    await page.click('text=Dark')
    
    // Verify dark theme is applied
    await expect(page.locator('html')).toHaveClass(/dark/)
    
    // Refresh page and verify settings persist
    await page.reload()
    await page.waitForSelector('text=Shower Tracker')
    
    // Navigate back to settings
    await page.click('button[aria-label="Settings"]')
    
    // Verify settings are still applied
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.locator('input[type="number"]')).toHaveValue('5')
  })

  test('should display time since last shower', async ({ page }) => {
    // Record a shower first
    await page.click('button:has-text("Record it")')
    await expect(page.locator('text=Shower recorded')).toBeVisible()
    
    // Navigate back to home
    await page.click('button[aria-label="Home"]')
    
    // Should show time since last shower
    await expect(page.locator('text=Last shower')).toBeVisible()
    await expect(page.locator('text=seconds ago')).toBeVisible()
  })

  test('should handle offline functionality', async ({ page, context }) => {
    // Record a shower while online
    await page.click('button:has-text("Record it")')
    await expect(page.locator('text=Shower recorded')).toBeVisible()
    
    // Go offline
    await context.setOffline(true)
    
    // App should still be functional
    await page.click('button[aria-label="Calendar"]')
    await expect(page.locator('text=January')).toBeVisible()
    
    // Should show offline indicator
    await expect(page.locator('text=Offline')).toBeVisible()
    
    // Go back online
    await context.setOffline(false)
    
    // Offline indicator should disappear
    await expect(page.locator('text=Offline')).not.toBeVisible()
  })

  test('should support PWA installation flow', async ({ page, context }) => {
    // Mock beforeinstallprompt event
    await page.addInitScript(() => {
      let deferredPrompt: any
      
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        deferredPrompt = e
        
        // Trigger custom install prompt
        const event = new CustomEvent('showinstallprompt')
        window.dispatchEvent(event)
      })
      
      // Mock the prompt method
      if (deferredPrompt) {
        deferredPrompt.prompt = () => Promise.resolve()
        deferredPrompt.userChoice = Promise.resolve({ outcome: 'accepted' })
      }
    })
    
    // Look for install prompt (may vary by platform)
    const installButton = page.locator('button:has-text("Install")')
    if (await installButton.isVisible()) {
      await installButton.click()
      
      // Should show installation success or hide prompt
      await expect(installButton).not.toBeVisible()
    }
  })

  test('should handle calendar navigation', async ({ page }) => {
    await page.click('button[aria-label="Calendar"]')
    
    // Navigate to next month
    await page.click('button[aria-label="Next month"]')
    
    // Should show next month
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const monthName = nextMonth.toLocaleString('default', { month: 'long' })
    await expect(page.locator(`text=${monthName}`)).toBeVisible()
    
    // Navigate back to previous month
    await page.click('button[aria-label="Previous month"]')
    
    // Should show current month
    const currentMonth = new Date().toLocaleString('default', { month: 'long' })
    await expect(page.locator(`text=${currentMonth}`)).toBeVisible()
  })

  test('should show shower details when clicking calendar date', async ({ page }) => {
    // Record a shower first
    await page.click('button:has-text("Record it")')
    await expect(page.locator('text=Shower recorded')).toBeVisible()
    
    // Navigate to calendar
    await page.click('button[aria-label="Calendar"]')
    
    // Click on today's date
    const today = new Date()
    const todayButton = page.locator(`button[data-date="${today.toISOString().split('T')[0]}"]`)
    await todayButton.click()
    
    // Should show shower details modal
    await expect(page.locator('text=Shower Details')).toBeVisible()
    await expect(page.locator('text=10:00 AM')).toBeVisible() // Assuming shower was recorded at this time
    
    // Close modal
    await page.click('button[aria-label="Close"]')
    await expect(page.locator('text=Shower Details')).not.toBeVisible()
  })

  test('should support keyboard navigation', async ({ page }) => {
    // Test keyboard navigation on main page
    await page.keyboard.press('Tab')
    
    // Record button should be focused
    const recordButton = page.locator('button:has-text("Record it")')
    await expect(recordButton).toBeFocused()
    
    // Press Enter to activate
    await page.keyboard.press('Enter')
    await expect(page.locator('text=Shower recorded')).toBeVisible()
    
    // Navigate to calendar with keyboard
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab') // Navigate to calendar button
    await page.keyboard.press('Enter')
    
    // Should be on calendar page
    await expect(page.locator('text=January')).toBeVisible()
  })

  test('should handle error states gracefully', async ({ page }) => {
    // Mock database error
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Database error' })
      })
    })
    
    // Try to record a shower
    await page.click('button:has-text("Record it")')
    
    // Should show error message
    await expect(page.locator('text=Error')).toBeVisible()
    
    // App should still be functional for other operations
    await page.click('button[aria-label="Calendar"]')
    await expect(page.locator('text=January')).toBeVisible()
  })
})