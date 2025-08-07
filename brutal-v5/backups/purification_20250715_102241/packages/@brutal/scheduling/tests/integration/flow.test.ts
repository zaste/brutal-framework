import { describe, it, expect } from '@jest/globals';
import { ExampleFeature } from '../../src/example-feature/example-feature.js';
import { validInputs } from '../fixtures/example.fixture.js';

describe('Integration: ExampleFeature flow', () => {
  it('should handle multiple operations', async () => {
    const feature = new ExampleFeature();
    
    const results = await Promise.all(
      validInputs.map(input => feature.execute(input))
    );

    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.data).toMatch(/^Processed: /);
    });
  });
});
