import { describe, it, expect } from '@jest/globals';
import { routes } from './index.js';

describe('routes', () => {
  it('should be defined', () => {
    expect(routes).toBeDefined();
    expect(routes.name).toBe('routes');
  });

  // TODO: Add more tests
});
