import { describe, it, expect } from '@jest/globals';
import { store } from './index.js';

describe('store', () => {
  it('should be defined', () => {
    expect(store).toBeDefined();
    expect(store.name).toBe('store');
  });

  // TODO: Add more tests
});
