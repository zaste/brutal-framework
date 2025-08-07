import { describe, it, expect } from '@jest/globals';
import { invalidation } from './index.js';

describe('invalidation', () => {
  it('should be defined', () => {
    expect(invalidation).toBeDefined();
    expect(invalidation.name).toBe('invalidation');
  });

  // TODO: Add more tests
});
