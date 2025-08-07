import { describe, it, expect } from '@jest/globals';
import { createAsyncComponent, Portal, LazyComponent } from '../../src/index.js';

describe('Integration: Enhanced Components flow', () => {
  it('should handle async component loading', async () => {
    const AsyncComp = createAsyncComponent({
      loader: async () => {
        return () => document.createElement('div');
      }
    });
    
    const instance = new AsyncComp();
    expect(instance).toBeDefined();
  });

  it('should handle portal creation', () => {
    const portal = new Portal();
    expect(portal).toBeDefined();
  });

  it('should handle lazy loading', () => {
    const lazy = new LazyComponent();
    expect(lazy).toBeDefined();
  });
});
