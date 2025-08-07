import { describe, it, expect } from '@jest/globals';
import { envProfiles } from './profiles.js';

describe('envProfiles', () => {
  it('should have default profiles', () => {
    expect(envProfiles.get('development')).toBeDefined();
    expect(envProfiles.get('production')).toBeDefined();
    expect(envProfiles.get('test')).toBeDefined();
  });

  it('should return test profile in test environment', () => {
    const current = envProfiles.current();
    expect(current.name).toBe('test');
    expect(current.debug).toBe(false);
  });

  it('should return correct profile settings', () => {
    const prod = envProfiles.get('production');
    expect(prod?.debug).toBe(false);
    expect(prod?.features.devtools).toBe(false);
    
    const dev = envProfiles.get('development');
    expect(dev?.debug).toBe(true);
    expect(dev?.features.devtools).toBe(true);
  });

  it('should return development profile when NODE_ENV is undefined', () => {
    const originalEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    
    const current = envProfiles.current();
    expect(current.name).toBe('development');
    expect(current.debug).toBe(true);
    
    // Restore original value
    process.env.NODE_ENV = originalEnv;
  });

  it('should return development profile for unknown environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'unknown-env';
    
    const current = envProfiles.current();
    expect(current.name).toBe('development');
    
    // Restore original value
    process.env.NODE_ENV = originalEnv;
  });
});
