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
      expect(() => {
        // @ts-expect-error - testing immutability
        DEFAULT_CONFIG.debug = true;
      }).toThrow();
    });
  });

  describe('INTERNAL', () => {
    it('should have expected properties', () => {
      expect(INTERNAL.MAX_LISTENERS).toBe(100);
      expect(INTERNAL.TIMEOUT_MS).toBe(5000);
    });
  });
});
