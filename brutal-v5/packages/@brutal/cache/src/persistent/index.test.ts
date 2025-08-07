import { describe, it, expect } from '@jest/globals';
import { persistent } from './index.js';

describe('persistent', () => {
  it('should be defined', () => {
    expect(persistent).toBeDefined();
    expect(persistent.name).toBe('persistent');
  });

  // TODO: Add more tests
});
