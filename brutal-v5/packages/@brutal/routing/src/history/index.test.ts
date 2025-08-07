import { describe, it, expect } from '@jest/globals';
import { history } from './index.js';

describe('history', () => {
  it('should be defined', () => {
    expect(history).toBeDefined();
    expect(history.name).toBe('history');
  });

  // TODO: Add more tests
});
