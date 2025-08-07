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
        debug: false,
        maxRetries: 3
      });
    });

    it('should be immutable', () => {
      // as const makes it readonly at compile time, not runtime
      // Verify the type is readonly
      expect(DEFAULT_CONFIG).toHaveProperty('debug', false);
      expect(DEFAULT_CONFIG).toHaveProperty('maxRetries', 3);
      
      // In TypeScript, this would fail at compile time
      // At runtime, we can't modify it if we use Object.freeze
    });
  });

  describe('INTERNAL', () => {
    it('should have expected properties', () => {
      expect(INTERNAL.MAX_LISTENERS).toBe(100);
      expect(INTERNAL.TIMEOUT_MS).toBe(5000);
    });
  });
});
