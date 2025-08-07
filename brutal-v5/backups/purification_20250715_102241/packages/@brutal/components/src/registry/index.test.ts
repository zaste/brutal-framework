import { describe, it, expect } from '@jest/globals';
import { registry } from './index.js';

describe('registry', () => {
  it('should be defined', () => {
    expect(registry).toBeDefined();
    expect(registry.name).toBe('registry');
  });

  // TODO: Add more tests
});
