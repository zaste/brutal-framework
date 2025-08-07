import { describe, it, expect } from '@jest/globals';
import { selectors } from './index.js';

describe('selectors', () => {
  it('should be defined', () => {
    expect(selectors).toBeDefined();
    expect(selectors.name).toBe('selectors');
  });

  // TODO: Add more tests
});
