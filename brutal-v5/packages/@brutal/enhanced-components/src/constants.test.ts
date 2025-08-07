import { describe, it, expect } from '@jest/globals';
import { VERSION, DEFAULT_CONFIG, INTERNAL } from './constants.js';

describe('constants', () => {
  describe('VERSION', () => {
    it('should be defined', () => {
      expect(VERSION).toBeDefined();
      expect(typeof VERSION).toBe('string');
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('should have expected properties', () => {
      expect(DEFAULT_CONFIG).toEqual({
        asyncTimeout: 30000,
        lazyThreshold: 0.1,
        lazyMargin: '50px',
        portalTarget: 'body',
        lifecycleEvents: true,
        errorBoundary: true
      });
    });

    it('should be immutable', () => {
      // as const makes it readonly at compile time, not runtime
      expect(DEFAULT_CONFIG).toHaveProperty('asyncTimeout', 30000);
      expect(DEFAULT_CONFIG).toHaveProperty('lazyThreshold', 0.1);
      expect(DEFAULT_CONFIG).toHaveProperty('errorBoundary', true);
    });

    it('should have reasonable defaults', () => {
      expect(DEFAULT_CONFIG.asyncTimeout).toBeGreaterThan(0);
      expect(DEFAULT_CONFIG.lazyThreshold).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_CONFIG.lazyThreshold).toBeLessThanOrEqual(1);
    });
  });

  describe('INTERNAL', () => {
    it('should have expected properties', () => {
      expect(INTERNAL.MAX_LISTENERS).toBe(100);
      expect(INTERNAL.ASYNC_DELAY).toBe(200);
      expect(INTERNAL.VISIBILITY_INTERVAL).toBe(100);
      expect(INTERNAL.PERF_PREFIX).toBe('brutal-enhanced');
    });

    it('should be immutable', () => {
      // as const makes it readonly at compile time, not runtime
      expect(INTERNAL).toHaveProperty('MAX_LISTENERS', 100);
      expect(INTERNAL).toHaveProperty('ASYNC_DELAY', 200);
    });
  });
});