import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ExampleFeature } from './example-feature.js';

describe('ExampleFeature', () => {
  let feature: ExampleFeature;

  beforeEach(() => {
    feature = new ExampleFeature();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      expect(feature).toBeInstanceOf(ExampleFeature);
    });

    it('should accept custom options', () => {
      const customFeature = new ExampleFeature({ debug: true });
      expect(customFeature).toBeInstanceOf(ExampleFeature);
    });
  });

  describe('execute', () => {
    it('should process input successfully', async () => {
      const result = await feature.execute('test');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('Processed: test');
      expect(result.error).toBeUndefined();
    });

    it('should handle empty input', async () => {
      const result = await feature.execute('');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('Processed: ');
    });
    it('should log when debug is enabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const debugFeature = new ExampleFeature({ debug: true });
      
      await debugFeature.execute('test-debug');
      
      expect(consoleSpy).toHaveBeenCalledWith('[plugins] Executing with:', 'test-debug');
      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      // Mock process method to throw error
      jest.spyOn(feature as any, 'process').mockRejectedValueOnce(new Error('Process failed'));
      
      const result = await feature.execute('fail');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Process failed');
      expect(result.data).toBeUndefined();
    });

    it('should handle non-Error objects in catch block', async () => {
      // Mock process method to throw non-Error object
      jest.spyOn(feature as any, 'process').mockRejectedValueOnce('String error');
      
      const result = await feature.execute('fail');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Unknown error');
      expect(result.data).toBeUndefined();
    });
  });
});
