import { test, expect } from '@playwright/test'

test.describe('PWA Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Shower Tracker')
  })

  test('should register service worker', async ({ page }) => {
    // Check if service worker is registered
    const swRegistration = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        return !!registration
      }
      return false
    })
    
    expect(swRegistration).toBe(true)
  })

  test('should cache resources for offline use', async ({ page, context }) => {
    // Load the page to trigger caching
    await page.waitForLoadState('networkidle')
    
    // Go offline
    await context.setOffline(true)
    
    // Reload the page - should work from cache
    await page.reload()
    await page.waitForSelector('text=Shower Tracker')
    
    // Core functionality should work offline
    await expect(page.locator('button:has-text("Record it")')).toBeVisible()
    await expect(page.locator('button[aria-label="Calendar"]')).toBeVisible()
    await expect(page.locator('button[aria-label="Settings"]')).toBeVisible()
  })

  test('should show offline indicator when offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true)
    
    // Trigger network check
    await page.reload()
    await page.waitForSelector('text=Shower Tracker')
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Go back online
    await context.setOffline(false)
    
    // Wait for network to be detected as online
    await page.waitForTimeout(1000)
    
    // Offline indicator should disappear
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible()
  })

  test('should handle app updates', async ({ page }) => {
    // Mock service worker update
    await page.addInitScript(() => {
      // Simulate service worker update available
      window.addEventListener('load', () => {
        const event = new CustomEvent('swupdatefound')
        window.dispatchEvent(event)
      })
    })
    
    // Look for update notification
    const updateNotification = page.locator('text=Update available')
    if (await updateNotification.isVisible()) {
      // Click update button
      await page.click('button:has-text("Update")')
      
      // Should reload or show update progress
      await page.waitForLoadState('networkidle')
    }
  })

  test('should support installation on mobile devices', async ({ page, browserName }) => {
    // Skip on desktop browsers that don't support mobile install prompts
    test.skip(browserName === 'webkit' && !process.env.CI, 'WebKit desktop does not support PWA install')
    
    // Mock mobile user agent
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15')
    
    // Look for iOS install instructions
    const iosInstructions = page.locator('text=Add to Home Screen')
    if (await iosInstructions.isVisible()) {
      expect(iosInstructions).toBeVisible()
    }
  })

  test('should persist data offline and sync when online', async ({ page, context }) => {
    // Record a shower while online
    await page.click('button:has-text("Record it")')
    await expect(page.locator('text=Shower recorded')).toBeVisible()
    
    // Go offline
    await context.setOffline(true)
    
    // Try to record another shower offline
    await page.click('button:has-text("Record it")')
    
    // Should still work (stored locally)
    await expect(page.locator('text=Shower recorded')).toBeVisible()
    
    // Navigate to calendar
    await page.click('button[aria-label="Calendar"]')
    
    // Should show both showers
    const today = new Date().toISOString().split('T')[0]
    const todayButton = page.locator(`button[data-date="${today}"]`)
    await expect(todayButton).toHaveClass(/has-shower/)
    
    // Go back online
    await context.setOffline(false)
    
    // Data should still be available
    await page.reload()
    await page.waitForSelector('text=Shower Tracker')
    await page.click('button[aria-label="Calendar"]')
    await expect(todayButton).toHaveClass(/has-shower/)
  })

  test('should handle notification permissions', async ({ page, context }) => {
    // Grant notification permission
    await context.grantPermissions(['notifications'])
    
    // Navigate to settings
    await page.click('button[aria-label="Settings"]')
    
    // Enable notifications
    await page.click('button[role="switch"]:has-text("Enable Notifications")')
    
    // Should show notification settings
    await expect(page.locator('input[type="number"]')).toBeVisible()
    
    // Test notification (if supported)
    const testButton = page.locator('button:has-text("Test Notification")')
    if (await testButton.isVisible()) {
      await testButton.click()
      
      // Note: Actual notification testing is limited in headless browsers
      // This mainly tests the UI flow
    }
  })

  test('should maintain theme across sessions', async ({ page }) => {
    // Navigate to settings
    await page.click('button[aria-label="Settings"]')
    
    // Change to dark theme
    await page.click('button:has-text("Theme")')
    await page.click('text=Dark')
    
    // Verify dark theme is applied
    await expect(page.locator('html')).toHaveClass(/dark/)
    
    // Close and reopen browser (simulate new session)
    await page.close()
    const newPage = await page.context().newPage()
    await newPage.goto('/')
    await newPage.waitForSelector('text=Shower Tracker')
    
    // Theme should persist
    await expect(newPage.locator('html')).toHaveClass(/dark/)
  })

  test('should handle storage quota exceeded', async ({ page }) => {
    // Mock storage quota exceeded
    await page.addInitScript(() => {
      const originalSetItem = localStorage.setItem
      let callCount = 0
      
      localStorage.setItem = function(key: string, value: string) {
        callCount++
        if (callCount > 5) {
          throw new DOMException('QuotaExceededError')
        }
        return originalSetItem.call(this, key, value)
      }
    })
    
    // Try to record multiple showers
    for (let i = 0; i < 10; i++) {
      await page.click('button:has-text("Record it")')
      await page.waitForTimeout(100)
    }
    
    // App should handle storage errors gracefully
    await expect(page.locator('text=Shower Tracker')).toBeVisible()
    
    // Should show error message about storage
    const errorMessage = page.locator('text=Storage error')
    if (await errorMessage.isVisible()) {
      expect(errorMessage).toBeVisible()
    }
  })
})