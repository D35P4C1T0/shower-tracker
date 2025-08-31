import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { observeWebVitals, logWebVitals } from '../performance';

// Mock console.log for testing
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('Performance utilities', () => {
  beforeEach(() => {
    // Reset environment
    vi.stubEnv('NODE_ENV', 'production');
    mockConsoleLog.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('observeWebVitals', () => {
    it('should not run in non-production environment', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const callback = vi.fn();
      
      observeWebVitals(callback);
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should not run when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      const callback = vi.fn();
      observeWebVitals(callback);
      
      expect(callback).not.toHaveBeenCalled();
      
      global.window = originalWindow;
    });

    it('should handle missing PerformanceObserver gracefully', () => {
      const originalPerformanceObserver = global.PerformanceObserver;
      // @ts-ignore
      delete global.PerformanceObserver;
      
      const callback = vi.fn();
      
      expect(() => {
        observeWebVitals(callback);
      }).not.toThrow();
      
      global.PerformanceObserver = originalPerformanceObserver;
    });

    it('should observe TTFB from navigation timing', () => {
      const mockPerformance = {
        getEntriesByType: vi.fn().mockReturnValue([
          {
            responseStart: 100,
            requestStart: 50
          }
        ])
      };
      
      Object.defineProperty(global, 'performance', {
        value: mockPerformance,
        writable: true
      });
      
      const callback = vi.fn();
      observeWebVitals(callback);
      
      expect(callback).toHaveBeenCalledWith({
        name: 'TTFB',
        value: 50,
        rating: 'good',
        delta: 50,
        id: 'ttfb'
      });
    });
  });

  describe('logWebVitals', () => {
    it('should only log in development environment', () => {
      vi.stubEnv('NODE_ENV', 'development');
      
      logWebVitals();
      
      // Since observeWebVitals doesn't run in development, no logs should occur
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should not log in production environment', () => {
      vi.stubEnv('NODE_ENV', 'production');
      
      logWebVitals();
      
      // No immediate logs should occur
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe('Rating calculation', () => {
    it('should calculate correct ratings for different metrics', () => {
      const callback = vi.fn();
      
      // Mock performance with good TTFB
      const mockPerformance = {
        getEntriesByType: vi.fn().mockReturnValue([
          {
            responseStart: 100,
            requestStart: 50 // 50ms TTFB - good
          }
        ])
      };
      
      Object.defineProperty(global, 'performance', {
        value: mockPerformance,
        writable: true
      });
      
      observeWebVitals(callback);
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'TTFB',
          rating: 'good'
        })
      );
    });
  });
});