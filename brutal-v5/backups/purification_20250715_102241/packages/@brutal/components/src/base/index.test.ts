import { describe, it, expect } from '@jest/globals';
import { base } from './index.js';

describe('base', () => {
  it('should be defined', () => {
    expect(base).toBeDefined();
    expect(base.name).toBe('base');
  });

  // TODO: Add more tests
});
