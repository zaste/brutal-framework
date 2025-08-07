/**
 * Tests for @brutal/events main exports
 */

import { describe, it, expect } from '@jest/globals';
import {
  EventEmitter,
  EventBus,
  globalBus,
  domEvents,
  emit,
  createEvent,
  PACKAGE_NAME,
  VERSION,
  DEFAULT_CONFIG
} from './index.js';

describe('@brutal/events exports', () => {
  it('should export EventEmitter', () => {
    expect(EventEmitter).toBeDefined();
    const emitter = new EventEmitter();
    expect(emitter).toBeInstanceOf(EventEmitter);
  });
  
  it('should export EventBus', () => {
    expect(EventBus).toBeDefined();
    const bus = new EventBus();
    expect(bus).toBeInstanceOf(EventBus);
  });
  
  it('should export globalBus', () => {
    expect(globalBus).toBeDefined();
    expect(globalBus).toBeInstanceOf(EventBus);
  });
  
  it('should export DOM event utilities', () => {
    expect(domEvents).toBeDefined();
    expect(typeof domEvents.on).toBe('function');
    expect(typeof domEvents.delegate).toBe('function');
    expect(typeof emit).toBe('function');
    expect(typeof createEvent).toBe('function');
  });
  
  it('should export package metadata', () => {
    expect(PACKAGE_NAME).toBe('@brutal/events');
    expect(VERSION).toBe('__VERSION__');
  });
  
  it('should export default config', () => {
    expect(DEFAULT_CONFIG).toEqual({
      debug: false,
      maxListeners: 100,
      wildcard: true,
      verboseErrors: false,
      async: false
    });
  });
});