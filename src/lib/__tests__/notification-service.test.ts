import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationService } from '../notification-service'
import type { UserSettings } from '../../types'

describe('NotificationService', () => {
  let mockNotification: any
  let mockRequestPermission: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup notification constructor mock
    mockNotification = vi.fn().mockImplementation(function(title: string, options?: NotificationOptions) {
      return {
        title,
        ...options,
        close: vi.fn(),
        onclick: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }
    })
    
    // Setup request permission mock
    mockRequestPermission = vi.fn().mockResolvedValue('granted')
    
    // Set static properties
    mockNotification.permission = 'default'
    mockNotification.requestPermission = mockRequestPermission
    
    // Set on window
    Object.defineProperty(window, 'Notification', {
      value: mockNotification,
      writable: true,
      configurable: true
    })

    // Mock navigator.serviceWorker
    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({
          getNotifications: vi.fn().mockResolvedValue([])
        })
      },
      writable: true,
      configurable: true
    })
  })

  describe('isSupported', () => {
    it('should return true when Notification is available', () => {
      expect(NotificationService.isSupported()).toBe(true)
    })

    it('should return false when Notification is not available', () => {
      // @ts-ignore - intentionally setting to undefined for test
      delete (window as any).Notification
      
      expect(NotificationService.isSupported()).toBe(false)
    })
  })

  describe('getPermission', () => {
    it('should return current permission status', () => {
      mockNotification.permission = 'granted'
      expect(NotificationService.getPermission()).toBe('granted')
    })

    it('should return denied when notifications not supported', () => {
      // @ts-ignore - intentionally setting to undefined for test
      delete (window as any).Notification
      
      expect(NotificationService.getPermission()).toBe('denied')
    })
  })

  describe('requestPermission', () => {
    it('should request permission when not granted', async () => {
      mockNotification.permission = 'default'
      mockRequestPermission.mockResolvedValue('granted')
      
      const result = await NotificationService.requestPermission()
      
      expect(mockRequestPermission).toHaveBeenCalled()
      expect(result).toBe('granted')
    })

    it('should return granted immediately if already granted', async () => {
      mockNotification.permission = 'granted'
      
      const result = await NotificationService.requestPermission()
      
      expect(mockRequestPermission).not.toHaveBeenCalled()
      expect(result).toBe('granted')
    })

    it('should return denied when not supported', async () => {
      // @ts-ignore - intentionally setting to undefined for test
      delete (window as any).Notification
      
      const result = await NotificationService.requestPermission()
      
      expect(result).toBe('denied')
    })

    it('should handle request permission errors', async () => {
      mockNotification.permission = 'default'
      mockRequestPermission.mockRejectedValue(new Error('Permission denied'))
      
      const result = await NotificationService.requestPermission()
      
      expect(result).toBe('denied')
    })
  })

  describe('showNotification', () => {
    it('should show notification with correct options', async () => {
      mockNotification.permission = 'granted'
      
      const options = {
        title: 'Test Title',
        body: 'Test Body',
        icon: '/test-icon.png',
        badge: '/vite.svg',
        tag: 'shower-reminder',
        requireInteraction: false,
        silent: false,
        renotify: true
      }
      
      const result = await NotificationService.showNotification(options)
      
      expect(result).toBe(true)
      expect(mockNotification).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/test-icon.png',
        badge: '/vite.svg',
        tag: 'shower-reminder',
        requireInteraction: false,
        silent: false
      })
    })

    it('should use default values for missing options', async () => {
      mockNotification.permission = 'granted'
      
      const options = {
        title: 'Test Title',
        body: 'Test Body'
      }
      
      await NotificationService.showNotification(options)
      
      expect(mockNotification).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/vite.svg',
        badge: '/vite.svg',
        tag: 'shower-reminder',
        requireInteraction: false,
        silent: false
      })
    })

    it('should return false when permission not granted', async () => {
      mockNotification.permission = 'denied'
      
      const options = {
        title: 'Test Title',
        body: 'Test Body'
      }
      
      const result = await NotificationService.showNotification(options)
      
      expect(result).toBe(false)
      expect(mockNotification).not.toHaveBeenCalled()
    })

    it('should return false when not supported', async () => {
      // @ts-ignore - intentionally setting to undefined for test
      delete (window as any).Notification
      
      const options = {
        title: 'Test Title',
        body: 'Test Body'
      }
      
      const result = await NotificationService.showNotification(options)
      
      expect(result).toBe(false)
    })
  })

  describe('generateReminderMessage', () => {
    it('should generate message for 1 day', () => {
      const message = NotificationService.generateReminderMessage(1)
      expect(message).toEqual({
        title: '🚿 Shower Reminder',
        body: "It's been a day since your last shower. Time to freshen up!"
      })
    })

    it('should generate message for 2 days', () => {
      const message = NotificationService.generateReminderMessage(2)
      expect(message).toEqual({
        title: '🚿 Shower Reminder',
        body: "It's been 2 days since your last shower. Your skin will thank you!"
      })
    })

    it('should generate message for 3 days', () => {
      const message = NotificationService.generateReminderMessage(3)
      expect(message).toEqual({
        title: '🚿 Shower Reminder',
        body: "It's been 3 days since your last shower. Time for some self-care!"
      })
    })

    it('should generate message for 5 days', () => {
      const message = NotificationService.generateReminderMessage(5)
      expect(message).toEqual({
        title: '🚿 Shower Reminder',
        body: "It's been 5 days since your last shower. Let's get clean!"
      })
    })

    it('should generate message for 10 days', () => {
      const message = NotificationService.generateReminderMessage(10)
      expect(message).toEqual({
        title: '🚿 Shower Time!',
        body: "It's been 10 days since your last shower. Your friends are starting to notice! 😅"
      })
    })

    it('should generate message for 20+ days', () => {
      const message = NotificationService.generateReminderMessage(20)
      expect(message).toEqual({
        title: '🚿 Urgent Shower Reminder!',
        body: "It's been 20 days since your last shower. Time for an intervention! 🛁"
      })
    })
  })

  describe('shouldSendNotification', () => {
    const mockSettings: UserSettings = {
      theme: 'light',
      firstDayOfWeek: 0,
      notificationsEnabled: true,
      notificationThresholdDays: 24,
      projectInfo: {
        githubRepo: 'test/repo',
        author: 'Test Author'
      }
    }

    it('should return false when notifications disabled', () => {
      const settings = { ...mockSettings, notificationsEnabled: false }
      const result = NotificationService.shouldSendNotification(
        settings,
        new Date(),
        new Date()
      )
      
      expect(result).toBe(false)
    })

    it('should return false when permission not granted', () => {
      mockNotification.permission = 'denied'
      
      const result = NotificationService.shouldSendNotification(
        mockSettings,
        new Date(),
        new Date()
      )
      
      expect(result).toBe(false)
    })

    it('should return false when no last shower', () => {
      mockNotification.permission = 'granted'
      
      const result = NotificationService.shouldSendNotification(
        mockSettings,
        null,
        null
      )
      
      expect(result).toBe(false)
    })

    it('should return false when threshold not exceeded', () => {
      mockNotification.permission = 'granted'
      const now = new Date()
      const lastShower = new Date(now.getTime() - 12 * 60 * 60 * 1000) // 12 hours ago
      
      const result = NotificationService.shouldSendNotification(
        mockSettings,
        lastShower,
        new Date()
      )
      
      expect(result).toBe(false)
    })

    it('should return true when threshold exceeded and no recent check', () => {
      const mockNotification = {
        permission: 'granted' as NotificationPermission
      }
      Object.defineProperty(window, 'Notification', {
        writable: true,
        value: mockNotification,
        configurable: true
      })
      
      // Ensure navigator.serviceWorker is available for isSupported check
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        value: {
          register: vi.fn().mockResolvedValue({}),
          ready: Promise.resolve({}),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      })
      
      const now = new Date()
      const lastShower = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000) // 25 days ago
      
      // Debug the conditions
      expect(NotificationService.isSupported()).toBe(true)
      expect(NotificationService.getPermission()).toBe('granted')
      expect(mockSettings.notificationsEnabled).toBe(true)
      expect(mockSettings.notificationThresholdDays).toBe(24)
      
      const timeSinceLastShower = now.getTime() - lastShower.getTime()
      const daysSinceLastShower = timeSinceLastShower / (1000 * 60 * 60 * 24)
      expect(daysSinceLastShower).toBeGreaterThan(24)
      
      const result = NotificationService.shouldSendNotification(
        mockSettings,
        lastShower,
        null
      )
      
      expect(result).toBe(true)
    })

    it('should return false when recent notification check', () => {
      mockNotification.permission = 'granted'
      const now = new Date()
      const lastShower = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000) // 25 days ago
      const lastCheck = new Date(now.getTime() - 1 * 60 * 60 * 1000) // 1 hour ago
      
      const result = NotificationService.shouldSendNotification(
        mockSettings,
        lastShower,
        lastCheck
      )
      
      expect(result).toBe(false)
    })

    it('should return true when last check was over 12 hours ago', () => {
      const mockNotification = {
        permission: 'granted' as NotificationPermission
      }
      Object.defineProperty(window, 'Notification', {
        writable: true,
        value: mockNotification,
        configurable: true
      })
      
      // Ensure navigator.serviceWorker is available for isSupported check
      Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        value: {
          register: vi.fn().mockResolvedValue({}),
          ready: Promise.resolve({}),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
      })
      
      const now = new Date()
      const lastShower = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000) // 25 days ago
      const lastCheck = new Date(now.getTime() - 13 * 60 * 60 * 1000) // 13 hours ago
      
      const result = NotificationService.shouldSendNotification(
        mockSettings,
        lastShower,
        lastCheck
      )
      
      expect(result).toBe(true)
    })
  })

  describe('getPermissionStatusMessage', () => {
    it('should return appropriate message for granted permission', () => {
      mockNotification.permission = 'granted'
      
      const message = NotificationService.getPermissionStatusMessage()
      
      expect(message).toBe('Notifications are enabled and working.')
    })

    it('should return appropriate message for denied permission', () => {
      mockNotification.permission = 'denied'
      
      const message = NotificationService.getPermissionStatusMessage()
      
      expect(message).toContain('blocked')
    })

    it('should return appropriate message for default permission', () => {
      mockNotification.permission = 'default'
      
      const message = NotificationService.getPermissionStatusMessage()
      
      expect(message).toBe('Click to enable notifications for shower reminders.')
    })
  })

  describe('getFallbackMessage', () => {
    it('should return fallback message for 1 day', () => {
      const message = NotificationService.getFallbackMessage(1)
      expect(message).toBe("⏰ Reminder: It's been a day since your last shower!")
    })

    it('should return fallback message for 2 days', () => {
      const message = NotificationService.getFallbackMessage(2)
      expect(message).toBe("⏰ Reminder: It's been 2 days since your last shower!")
    })

    it('should return fallback message for 10 days', () => {
      const message = NotificationService.getFallbackMessage(10)
      expect(message).toBe("⏰ Urgent: It's been 10 days since your last shower!")
    })
  })
})