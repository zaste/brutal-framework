import { describe, it, expect, beforeEach } from '@jest/globals';
import { registry } from './registry.js';

describe('registry', () => {
  beforeEach(() => {
    registry.packages.clear();
  });

  it('should register packages', () => {
    registry.register('@brutal/test', '1.0.0');
    
    expect(registry.isLoaded('@brutal/test')).toBe(true);
    expect(registry.get('@brutal/test')).toEqual({
      name: '@brutal/test',
      version: '1.0.0',
      loaded: true
    });
  });

  it('should list all packages', () => {
    registry.register('@brutal/a', '1.0.0');
    registry.register('@brutal/b', '2.0.0');
    
    const list = registry.list();
    expect(list).toHaveLength(2);
    expect(list.map(p => p.name)).toContain('@brutal/a');
    expect(list.map(p => p.name)).toContain('@brutal/b');
  });

  it('should return false for non-existent packages', () => {
    expect(registry.isLoaded('@brutal/nonexistent')).toBe(false);
  });

  it('should return undefined for non-existent packages', () => {
    expect(registry.get('@brutal/nonexistent')).toBeUndefined();
  });
});
