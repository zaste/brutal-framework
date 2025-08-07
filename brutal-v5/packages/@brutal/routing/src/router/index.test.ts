import { describe, it, expect } from '@jest/globals';
import { router } from './index.js';

describe('router', () => {
  it('should be defined', () => {
    expect(router).toBeDefined();
    expect(router.name).toBe('router');
  });

  // TODO: Add more tests
});
