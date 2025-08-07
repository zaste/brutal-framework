import { describe, it, expect, beforeEach } from '@jest/globals';
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
  });
});
