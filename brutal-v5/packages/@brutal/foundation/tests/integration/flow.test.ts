import { describe, it, expect } from '@jest/globals';
import {
  registry,
  configLoader,
  polyfillStrategy,
  envProfiles,
  createError,
  ErrorCodes,
  utils
} from '../../src/index.js';

describe('Integration: Foundation flow', () => {
  it('should handle registry and config together', () => {
    // Register a package
    registry.register('@brutal/test-pkg', '1.0.0');
    
    // Configure it
    configLoader.load({
      packages: {
        '@brutal/test-pkg': {
          enabled: true,
          options: { debug: true }
        }
      }
    });
    
    // Verify both work together
    expect(registry.isLoaded('@brutal/test-pkg')).toBe(true);
    expect(configLoader.get('packages.@brutal/test-pkg.enabled')).toBe(true);
  });

  it('should handle environment-based configuration', () => {
    const env = envProfiles.current();
    
    configLoader.load({
      [env.name]: {
        apiUrl: 'http://localhost:3000'
      }
    });
    
    expect(configLoader.get(`${env.name}.apiUrl`)).toBe('http://localhost:3000');
  });

  it('should handle errors with proper context', () => {
    const error = createError(
      ErrorCodes.CONFIG_NOT_FOUND,
      'Missing config file',
      { path: '/config.json' }
    );
    
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('CONFIG_NOT_FOUND');
    expect(error.details).toEqual({ path: '/config.json' });
  });

  it('should debounce multiple config updates', async () => {
    let updateCount = 0;
    const updateHandler = utils.debounce(() => {
      updateCount++;
    }, 50);
    
    // Trigger multiple updates
    updateHandler();
    updateHandler();
    updateHandler();
    
    // Should not have executed yet
    expect(updateCount).toBe(0);
    
    // Wait for debounce
    await utils.delay(60);
    
    // Should have executed once
    expect(updateCount).toBe(1);
  });

  it('should handle polyfill loading in order', async () => {
    const loadOrder: string[] = [];
    
    polyfillStrategy.register({
      feature: 'high-priority',
      test: () => false,
      load: async () => { loadOrder.push('high'); },
      priority: 100
    });
    
    polyfillStrategy.register({
      feature: 'low-priority',
      test: () => false,
      load: async () => { loadOrder.push('low'); },
      priority: 10
    });
    
    await polyfillStrategy.loadRequired();
    
    // High priority should load first
    expect(loadOrder).toEqual(['high', 'low']);
  });
});