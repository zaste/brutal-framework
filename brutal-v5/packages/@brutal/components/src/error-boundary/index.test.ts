import { describe, it, expect } from '@jest/globals';
import { errorBoundary } from './index.js';

describe('error-boundary', () => {
  it('should be defined', () => {
    expect(errorBoundary).toBeDefined();
    expect(errorBoundary.name).toBe('error-boundary');
  });

  // TODO: Add more tests
});
