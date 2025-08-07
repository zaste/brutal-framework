import { describe, it, expect } from '@jest/globals';
import { 
  VERSION, 
  PACKAGE_NAME,
  registry,
  configLoader,
  polyfillStrategy,
  envProfiles,
  utils,
  primitives,
  createError,
  ErrorCodes,
  debug
} from './index.js';

describe('Foundation exports', () => {
  it('should export VERSION constant', () => {
  expect(VERSION).toBe('__VERSION__');
  });

  it('should export correct package name', () => {
  expect(PACKAGE_NAME).toBe('@brutal/foundation');
  });

  it('should export registry system', () => {
  expect(registry).toBeDefined();
  expect(registry.register).toBeDefined();
  expect(registry.get).toBeDefined();
  expect(registry.isLoaded).toBeDefined();
  });

  it('should export config loader', () => {
  expect(configLoader).toBeDefined();
  expect(configLoader.load).toBeDefined();
  expect(configLoader.get).toBeDefined();
  });

  it('should export polyfill strategy', () => {
  expect(polyfillStrategy).toBeDefined();
  expect(polyfillStrategy.register).toBeDefined();
  expect(polyfillStrategy.loadRequired).toBeDefined();
  });

  it('should export environment profiles', () => {
  expect(envProfiles).toBeDefined();
  expect(envProfiles.current).toBeDefined();
  expect(envProfiles.isDevelopment).toBeDefined();
  expect(envProfiles.isProduction).toBeDefined();
  });

  it('should export utility functions', () => {
  expect(utils).toBeDefined();
  expect(utils.isObject).toBeDefined();
  expect(utils.debounce).toBeDefined();
  expect(utils.deepMerge).toBeDefined();
  });

  it('should export primitives', () => {
  expect(primitives).toBeDefined();
  expect(primitives.EventEmitter).toBeDefined();
  expect(primitives.Observable).toBeDefined();
  expect(primitives.Cache).toBeDefined();
  });

  it('should export error system', () => {
  expect(createError).toBeDefined();
  expect(ErrorCodes).toBeDefined();
  expect(ErrorCodes.CONFIG_NOT_FOUND).toBe('CONFIG_NOT_FOUND');
  });

  it('should export debug utilities', () => {
  expect(debug).toBeDefined();
  expect(debug.info).toBeDefined();
  expect(debug.error).toBeDefined();
  });
});