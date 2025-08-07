import { describe, it, expect } from '@jest/globals';
import type { ExampleOptions, ExampleResult, ExampleCallback } from './types.js';

describe('types', () => {
  describe('ExampleOptions', () => {
    it('should accept valid options', () => {
      const options: ExampleOptions = {
        debug: true,
        maxRetries: 5
      };
      expect(options.debug).toBe(true);
      expect(options.maxRetries).toBe(5);
    });

    it('should accept partial options', () => {
      const options: ExampleOptions = {
        debug: true
      };
      expect(options.debug).toBe(true);
      expect(options.maxRetries).toBeUndefined();
    });
  });

  describe('ExampleResult', () => {
    it('should represent success', () => {
      const result: ExampleResult = {
        success: true,
        data: 'test data'
      };
      expect(result.success).toBe(true);
      expect(result.data).toBe('test data');
      expect(result.error).toBeUndefined();
    });

    it('should represent failure', () => {
      const result: ExampleResult = {
        success: false,
        error: new Error('Test error')
      };
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Test error');
      expect(result.data).toBeUndefined();
    });
  });

  describe('ExampleCallback', () => {
    it('should be callable with result', () => {
      const callback: ExampleCallback = (result) => {
        expect(result.success).toBeDefined();
      };
      
      callback({ success: true, data: 'test' });
    });
  });
});
