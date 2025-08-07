import { describe, it, expect } from '@jest/globals';
import type { 
  FoundationConfig,
  PackageInfo,
  PolyfillConfig,
  EnvironmentProfile,
  ErrorInfo,
  DebugInfo,
  Nullable,
  Optional,
  MaybePromise,
  DeepPartial,
  DeepReadonly
} from './types.js';

describe('Types', () => {
  it('FoundationConfig should accept valid config', () => {
  const config: FoundationConfig = {
    debug: true,
    environment: 'development',
    customValue: 'test'
  };
  expect(config.debug).toBe(true);
  expect(config.environment).toBe('development');
  expect(config.customValue).toBe('test');
  });

  it('PackageInfo should represent package metadata', () => {
  const pkg: PackageInfo = {
    name: '@brutal/test',
    version: '1.0.0',
    loaded: true,
    dependencies: ['@brutal/foundation'],
    metadata: { author: 'test' }
  };
  expect(pkg.name).toBe('@brutal/test');
  expect(pkg.dependencies).toContain('@brutal/foundation');
  });

  it('PolyfillConfig should define polyfill requirements', () => {
  const polyfill: PolyfillConfig = {
    feature: 'Promise',
    test: () => typeof Promise !== 'undefined',
    load: async () => { /* load polyfill */ },
    priority: 100
  };
  expect(polyfill.feature).toBe('Promise');
  expect(polyfill.test()).toBe(true);
  expect(polyfill.priority).toBe(100);
  });

  it('EnvironmentProfile should define environment settings', () => {
  const profile: EnvironmentProfile = {
    name: 'production',
    debug: false,
    minify: true,
    sourceMaps: false
  };
  expect(profile.name).toBe('production');
  expect(profile.debug).toBe(false);
  expect(profile.minify).toBe(true);
  });

  it('ErrorInfo should represent error details', () => {
  const error: ErrorInfo = {
    code: 'TEST_ERROR',
    message: 'Test error occurred',
    details: { field: 'value' },
    timestamp: Date.now(),
    stack: 'Error stack trace'
  };
  expect(error.code).toBe('TEST_ERROR');
  expect(error.details).toEqual({ field: 'value' });
  });

  it('Utility types should work correctly', () => {
  // Nullable
  const nullable: Nullable<string> = null;
  const nonNull: Nullable<string> = 'value';
  expect(nullable).toBe(null);
  expect(nonNull).toBe('value');
  
  // Optional
  const optional: Optional<number> = undefined;
  const defined: Optional<number> = 42;
  expect(optional).toBe(undefined);
  expect(defined).toBe(42);
  
  // MaybePromise
  const sync: MaybePromise<string> = 'sync';
  const async: MaybePromise<string> = Promise.resolve('async');
  expect(sync).toBe('sync');
  expect(async).toBeInstanceOf(Promise);
  });

  it('DeepPartial should make nested properties optional', () => {
  interface Config {
    server: {
      host: string;
      port: number;
    };
    debug: boolean;
  }
  
  const partial: DeepPartial<Config> = {
    server: { host: 'localhost' }
    // port and debug are optional
  };
  
  expect(partial.server?.host).toBe('localhost');
  expect(partial.server?.port).toBeUndefined();
  });

  it('DeepReadonly should make nested properties readonly', () => {
  interface MutableConfig {
    server: {
      host: string;
      port: number;
    };
  }
  
  const config: DeepReadonly<MutableConfig> = {
    server: {
      host: 'localhost',
      port: 3000
    }
  };
  
  // TypeScript would prevent these at compile time:
  // config.server.host = 'other'; // Error!
  // config.server = { host: 'other', port: 4000 }; // Error!
  
  expect(config.server.host).toBe('localhost');
  });
});