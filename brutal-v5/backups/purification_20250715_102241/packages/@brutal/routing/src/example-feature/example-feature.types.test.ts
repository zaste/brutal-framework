import { describe, it, expect } from '@jest/globals';
import type { FeatureState, ProcessOptions } from './example-feature.types.js';

describe('example-feature types', () => {
  describe('FeatureState', () => {
    it('should represent valid state', () => {
      const state: FeatureState = {
        initialized: true,
        processing: false,
        errorCount: 0
      };
      
      expect(state.initialized).toBe(true);
      expect(state.processing).toBe(false);
      expect(state.errorCount).toBe(0);
    });
  });

  describe('ProcessOptions', () => {
    it('should accept timeout', () => {
      const options: ProcessOptions = {
        timeout: 5000
      };
      
      expect(options.timeout).toBe(5000);
      expect(options.signal).toBeUndefined();
    });

    it('should accept AbortSignal', () => {
      const controller = new AbortController();
      const options: ProcessOptions = {
        signal: controller.signal
      };
      
      expect(options.signal).toBe(controller.signal);
      expect(options.timeout).toBeUndefined();
    });
  });
});
