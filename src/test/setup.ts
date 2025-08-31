import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import { vi } from 'vitest'

// Fix for React 19 compatibility
;(global as any).IS_REACT_ACT_ENVIRONMENT = true

// Mock React DOM to prevent issues
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn()
  }))
}))

// Mock document.createElement for React 19
const originalCreateElement = document.createElement
document.createElement = function(tagName: string, options?: any) {
  const element = originalCreateElement.call(this, tagName, options)
  // Ensure all elements have the necessary properties
  if (!element.style) {
    Object.defineProperty(element, 'style', {
      value: {},
      writable: true,
      enumerable: true,
      configurable: true
    })
  }
  return element
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock Notification API
global.Notification = class MockNotification {
  static permission: NotificationPermission = 'default'
  static requestPermission = vi.fn().mockResolvedValue('granted')
  
  constructor(public title: string, public options?: NotificationOptions) {}
  
  close = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
} as any

// Ensure Notification is available on window
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: global.Notification,
})

// Mock navigator
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    ...window.navigator,
    serviceWorker: {
      register: vi.fn().mockResolvedValue({}),
      ready: Promise.resolve({}),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    standalone: false,
  },
})

// Mock caches API
global.caches = {
  open: vi.fn().mockResolvedValue({
    addAll: vi.fn().mockResolvedValue(undefined),
    add: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    match: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(true),
  }),
  keys: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockResolvedValue(true),
  has: vi.fn().mockResolvedValue(false),
  match: vi.fn().mockResolvedValue(undefined),
} as any

// Mock beforeinstallprompt event
;(global as any).BeforeInstallPromptEvent = class MockBeforeInstallPromptEvent extends Event {
  prompt = vi.fn().mockResolvedValue({ outcome: 'accepted' })
  userChoice = Promise.resolve({ outcome: 'accepted' })
} as any

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((key: string) => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

// Mock URL methods
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mocked-url')
})

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn()
})

// Mock Date.now to prevent JSDOM issues
const originalDateNow = Date.now
Object.defineProperty(Date, 'now', {
  writable: true,
  value: vi.fn(() => originalDateNow())
})