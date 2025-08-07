import { describe, it, expect } from '@jest/globals';
import { guards } from './index.js';

describe('guards', () => {
  it('should be defined', () => {
    expect(guards).toBeDefined();
    expect(guards.name).toBe('guards');
  });

  // TODO: Add more tests
});
