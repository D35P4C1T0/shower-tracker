import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectPlatform, supportsInstallPrompt } from '../platform-utils';

// Store original values
const originalWindow = global.window;

beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock navigator
  const mockNavigator = {
    userAgent: '',
    standalone: false
  };
  
  Object.defineProperty(global, 'navigator', {
    value: mockNavigator,
    writable: true,
    configurable: true
  });
  
  // Mock window with navigator reference
  Object.defineProperty(global, 'window', {
    value: {
      ...originalWindow,
      navigator: mockNavigator,
      matchMedia: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }),
      MSStream: undefined
    },
    writable: true,
    configurable: true
  });
  
  // Mock document
  Object.defineProperty(global, 'document', {
    value: {
      referrer: ''
    },
    writable: true,
    configurable: true
  });
});

describe('detectPlatform', () => {
  it('should detect Android devices', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
      configurable: true
    });
    
    const platform = detectPlatform();
    
    expect(platform.isAndroid).toBe(true);
    expect(platform.isIOS).toBe(false);
    expect(platform.isMobile).toBe(true);
  });

  it('should detect iOS devices', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true
    });
    
    const platform = detectPlatform();
    
    expect(platform.isAndroid).toBe(false);
    expect(platform.isIOS).toBe(true);
    expect(platform.isMobile).toBe(true);
  });

  it('should detect iPad devices', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true
    });
    
    const platform = detectPlatform();
    
    expect(platform.isAndroid).toBe(false);
    expect(platform.isIOS).toBe(true);
    expect(platform.isMobile).toBe(true);
  });

  it('should detect desktop devices', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      configurable: true
    });
    
    const platform = detectPlatform();
    
    expect(platform.isAndroid).toBe(false);
    expect(platform.isIOS).toBe(false);
    expect(platform.isMobile).toBe(false);
  });

  it('should detect standalone mode via display-mode', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
      configurable: true
    });
    
    global.window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    
    const platform = detectPlatform();
    
    expect(platform.isStandalone).toBe(true);
    expect(platform.canInstall).toBe(false);
  });

  it('should detect standalone mode via navigator.standalone', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true
    });
    
    Object.defineProperty(global.navigator, 'standalone', {
      value: true,
      configurable: true
    });
    
    const platform = detectPlatform();
    
    expect(platform.isStandalone).toBe(true);
    expect(platform.canInstall).toBe(false);
  });

  it('should detect standalone mode via android-app referrer', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
      configurable: true
    });
    
    Object.defineProperty(global.document, 'referrer', {
      value: 'android-app://com.example.app',
      configurable: true
    });
    
    const platform = detectPlatform();
    
    expect(platform.isStandalone).toBe(true);
    expect(platform.canInstall).toBe(false);
  });

  it('should allow installation on Android when not standalone', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
      configurable: true
    });
    
    global.window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    
    const platform = detectPlatform();
    
    expect(platform.isStandalone).toBe(false);
    expect(platform.canInstall).toBe(true);
  });

  it('should allow installation on iOS when not standalone', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true
    });
    
    Object.defineProperty(global.navigator, 'standalone', {
      value: false,
      configurable: true
    });
    
    const platform = detectPlatform();
    
    expect(platform.isStandalone).toBe(false);
    expect(platform.canInstall).toBe(true);
  });

  it('should not allow installation on desktop', () => {
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      configurable: true
    });
    
    const platform = detectPlatform();
    
    expect(platform.canInstall).toBe(false);
  });
});

describe('supportsInstallPrompt', () => {
  it('should return true when BeforeInstallPromptEvent exists', () => {
    (global.window as any).BeforeInstallPromptEvent = class {};
    
    expect(supportsInstallPrompt()).toBe(true);
  });

  it('should return true when onbeforeinstallprompt exists', () => {
    (global.window as any).onbeforeinstallprompt = null;
    
    expect(supportsInstallPrompt()).toBe(true);
  });

  it('should return false when neither exists', () => {
    delete (global.window as any).BeforeInstallPromptEvent;
    delete (global.window as any).onbeforeinstallprompt;
    
    expect(supportsInstallPrompt()).toBe(false);
  });
});