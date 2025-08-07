/**
 * Environment profiles for BRUTAL
 * Browser-compatible environment detection
 */

import type { EnvironmentProfile } from '../types.js';

// Environment detection that works in both Node.js and browsers
function getEnvironment(): string {
  // Browser detection
  if (typeof window !== 'undefined') {
    // Check for common development indicators
    if (window.location?.hostname === 'localhost' || 
        window.location?.hostname === '127.0.0.1' ||
        window.location?.protocol === 'file:') {
      return 'development';
    }
    
    // Check for explicit environment set on window
    if ((window as any).__BRUTAL_ENV__) {
      return (window as any).__BRUTAL_ENV__;
    }
    
    // Default to production in browser
    return 'production';
  }
  
  // Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV || 'development';
  }
  
  // Default fallback
  return 'production';
}

export const envProfiles = {
  profiles: new Map<string, EnvironmentProfile>([
    ['development', {
      name: 'development',
      debug: true,
      minify: false,
      sourceMaps: true,
      features: {
        devtools: true,
        hotReload: true,
        verbose: true
      }
    }],
    ['production', {
      name: 'production',
      debug: false,
      minify: true,
      sourceMaps: false,
      features: {
        devtools: false,
        hotReload: false,
        verbose: false
      }
    }],
    ['test', {
      name: 'test',
      debug: false,
      minify: false,
      sourceMaps: true,
      features: {
        devtools: false,
        hotReload: false,
        verbose: true
      }
    }]
  ]),
  
  get(name: string): EnvironmentProfile | undefined {
    return this.profiles.get(name);
  },
  
  current(): EnvironmentProfile {
    const env = getEnvironment();
    return this.profiles.get(env) || this.profiles.get('development')!;
  },
  
  set(name: string, profile: EnvironmentProfile): void {
    this.profiles.set(name, profile);
  },
  
  isProduction(): boolean {
    return this.current().name === 'production';
  },
  
  isDevelopment(): boolean {
    return this.current().name === 'development';
  },
  
  isTest(): boolean {
    return this.current().name === 'test';
  },
  
  // Allow runtime environment override (useful for testing)
  override(name: string): void {
    if (typeof window !== 'undefined') {
      (window as any).__BRUTAL_ENV__ = name;
    } else if (typeof process !== 'undefined' && process.env) {
      process.env.NODE_ENV = name;
    }
  }
};
