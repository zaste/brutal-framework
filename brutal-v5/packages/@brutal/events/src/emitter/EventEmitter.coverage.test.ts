/**
 * Additional tests for EventEmitter to improve coverage
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { EventEmitter } from './EventEmitter.js';
import type { EventMap } from '../types/index.js';

interface TestEvents extends EventMap {
  test: { value: number };
  error: Error;
  data: string;
}

describe('EventEmitter - Additional Coverage', () => {
  let emitter: EventEmitter<TestEvents>;
  
  beforeEach(() => {
    emitter = new EventEmitter<TestEvents>();
  });
  
  describe('off method edge cases', () => {
    it('should remove all listeners when no handler specified', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      emitter.on('test', handler1);
      emitter.on('test', handler2);
      emitter.once('test', jest.fn());
      
      expect(emitter.listenerCount('test')).toBe(3);
      
      // Remove all listeners for 'test'
      emitter.off('test');
      
      expect(emitter.listenerCount('test')).toBe(0);
      
      emitter.emit('test', { value: 42 });
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
    
    it('should handle off with non-existent event', () => {
      // Should not throw
      expect(() => emitter.off('test')).not.toThrow();
      expect(() => emitter.off('test', jest.fn())).not.toThrow();
    });
  });
  
  describe('waitFor edge cases', () => {
    it('should handle immediate emission', async () => {
      // Emit before waitFor
      setTimeout(() => {
        emitter.emit('test', { value: 99 });
      }, 0);
      
      const result = await emitter.waitFor('test');
      expect(result).toEqual({ value: 99 });
    });
    
    it('should clean up listener on timeout', async () => {
      const initialCount = emitter.listenerCount('test');
      
      try {
        await emitter.waitFor('test', 10);
      } catch (e) {
        // Expected timeout
      }
      
      expect(emitter.listenerCount('test')).toBe(initialCount);
    });
  });
  
  describe('wildcard edge cases', () => {
    it('should handle wildcard emit suppression', () => {
      const wildcardHandler = jest.fn();
      emitter.on('*', wildcardHandler);
      
      // Emit a wildcard event (which should only call wildcard handlers once)
      emitter.emit('*' as any, null);
      
      expect(wildcardHandler).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('once listener edge cases', () => {
    it('should handle once listeners in async mode', async () => {
      const asyncEmitter = new EventEmitter<TestEvents>({ async: true });
      const handler = jest.fn();
      
      asyncEmitter.once('test', handler);
      
      await asyncEmitter.emitAsync('test', { value: 1 });
      await asyncEmitter.emitAsync('test', { value: 2 });
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ value: 1 }, 'test');
    });
  });
  
  describe('async error handling', () => {
    it('should handle errors in async handlers', async () => {
      const asyncEmitter = new EventEmitter<TestEvents>({ async: true });
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      asyncEmitter.on('test', async () => {
        throw new Error('Async handler error');
      });
      
      await asyncEmitter.emitAsync('test', { value: 42 });
      
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
    
    it('should handle errors in async wildcard handlers', async () => {
      const asyncEmitter = new EventEmitter<TestEvents>({ async: true });
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      asyncEmitter.on('*', async () => {
        throw new Error('Async wildcard error');
      });
      
      await asyncEmitter.emitAsync('test', { value: 42 });
      
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });
});