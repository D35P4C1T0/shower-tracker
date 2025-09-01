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

// Mock React DOM entirely to prevent client issues
vi.mock('react-dom', () => ({
  render: vi.fn(),
  unmountComponentAtNode: vi.fn(),
  findDOMNode: vi.fn(),
  createPortal: vi.fn((children) => children),
  flushSync: vi.fn((fn) => fn())
}))

// Minimal setup for testing
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

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

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

// Mock Notification API
global.Notification = class MockNotification {
  static permission: NotificationPermission = 'default'
  static requestPermission = vi.fn().mockResolvedValue('granted')
  
  constructor(public title: string, public options?: NotificationOptions) {}
  
  close = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
} as any

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

// Mock URL methods
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mocked-url')
})

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn()
})
// Ensure Date.now is available for JSDOM
if (typeof Date.now !== 'function') {
  Date.now = () => new Date().getTime()
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn()
}

// Mock document properties for React DOM
Object.defineProperty(document, 'fonts', {
  value: {
    ready: Promise.resolve(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
})

// Mock location for React Router
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn()
  },
  writable: true
})

// Mock window.history for React Router
Object.defineProperty(window, 'history', {
  value: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
    length: 1,
    state: null
  },
  writable: true
})