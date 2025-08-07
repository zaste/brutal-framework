import { describe, it, expect } from '@jest/globals';
import { memory } from './index.js';

describe('memory', () => {
  it('should be defined', () => {
    expect(memory).toBeDefined();
    expect(memory.name).toBe('memory');
  });

  // TODO: Add more tests
});
