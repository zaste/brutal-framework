import { describe, it, expect } from '@jest/globals';
import { hooks } from './index.js';

describe('hooks', () => {
  it('should be defined', () => {
    expect(hooks).toBeDefined();
    expect(hooks.name).toBe('hooks');
  });

  // TODO: Add more tests
});
