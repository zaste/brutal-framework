import { describe, it, expect } from '@jest/globals';
import { middleware } from './index.js';

describe('middleware', () => {
  it('should be defined', () => {
    expect(middleware).toBeDefined();
    expect(middleware.name).toBe('middleware');
  });

  // TODO: Add more tests
});
