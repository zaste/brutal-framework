/**
 * Tests for @brutal/shared main exports
 */

import { describe, it, expect } from '@jest/globals';
import {
  PACKAGE_NAME,
  VERSION,
  DEFAULT_CONFIG,
  dom,
  utils
} from './index.js';

describe('@brutal/shared exports', () => {
  it('should export package metadata', () => {
    expect(PACKAGE_NAME).toBe('@brutal/shared');
    expect(VERSION).toBe('__VERSION__');
  });
  
  it('should export default config', () => {
    expect(DEFAULT_CONFIG).toEqual({
      debug: false,
      strict: false,
      silent: false
    });
  });
  
  it('should export DOM utilities', () => {
    expect(dom).toBeDefined();
    expect(typeof dom.$).toBe('function');
    expect(typeof dom.createElement).toBe('function');
  });
  
  it('should export shared utilities', () => {
    expect(utils).toBeDefined();
    expect(typeof utils.uniqueId).toBe('function');
    expect(typeof utils.debounce).toBe('function');
  });
});