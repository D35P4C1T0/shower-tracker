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
  });

  describe('observeWebVitals', () => {
    it('should run in development environment', () => {
      vi.stubEnv('NODE_ENV', 'development');
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
    it('logs metrics in development environment', () => {
      vi.stubEnv('NODE_ENV', 'development');
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
      
      logWebVitals();
      
      expect(mockConsoleLog).toHaveBeenCalledWith('[Performance] TTFB: 50.00ms (good)');
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
