import { describe, it, expect, beforeEach } from '@jest/globals';
import { polyfillStrategy } from './strategy.js';

describe('polyfillStrategy', () => {
  beforeEach(() => {
    polyfillStrategy.configs = [];
  });

  it('should register polyfill configs', () => {
    polyfillStrategy.register({
      feature: 'test',
      test: () => true,
      load: async () => {}
    });
    
    expect(polyfillStrategy.configs).toHaveLength(1);
  });

  it('should load required polyfills', async () => {
    let loaded = false;
    
    polyfillStrategy.register({
      feature: 'needed',
      test: () => false, // Needs polyfill
      load: async () => { loaded = true; }
    });
    
    polyfillStrategy.register({
      feature: 'not-needed',
      test: () => true, // Doesn't need polyfill
      load: async () => { throw new Error('Should not load'); }
    });
    
    await polyfillStrategy.loadRequired();
    expect(loaded).toBe(true);
  });
});
