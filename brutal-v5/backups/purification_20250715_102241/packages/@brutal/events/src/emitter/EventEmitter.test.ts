/**
 * Tests for EventEmitter
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { EventEmitter } from './EventEmitter.js';
import type { EventMap } from '../types/index.js';

interface TestEvents extends EventMap {
  test: { value: number };
  error: Error;
  data: string;
  empty: void;
}

describe('EventEmitter', () => {
  let emitter: EventEmitter<TestEvents>;
  
  beforeEach(() => {
    emitter = new EventEmitter<TestEvents>();
  });
  
  describe('basic functionality', () => {
    it('should emit and receive events', () => {
      const handler = jest.fn();
      emitter.on('test', handler);
      
      emitter.emit('test', { value: 42 });
      
      expect(handler).toHaveBeenCalledWith({ value: 42 }, 'test');
    });
    
    it('should support multiple listeners', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      emitter.on('test', handler1);
      emitter.on('test', handler2);
      
      emitter.emit('test', { value: 42 });
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
    
    it('should remove listeners', () => {
      const handler = jest.fn();
      const off = emitter.on('test', handler);
      
      off();
      emitter.emit('test', { value: 42 });
      
      expect(handler).not.toHaveBeenCalled();
    });
    
    it('should remove specific listener with off', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      emitter.on('test', handler1);
      emitter.on('test', handler2);
      emitter.off('test', handler1);
      
      emitter.emit('test', { value: 42 });
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });
  
  describe('once listeners', () => {
    it('should fire once listeners only once', () => {
      const handler = jest.fn();
      emitter.once('test', handler);
      
      emitter.emit('test', { value: 1 });
      emitter.emit('test', { value: 2 });
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ value: 1 }, 'test');
    });
    
    it('should remove once listener on manual off', () => {
      const handler = jest.fn();
      const off = emitter.once('test', handler);
      
      off();
      emitter.emit('test', { value: 42 });
      
      expect(handler).not.toHaveBeenCalled();
    });
  });
  
  describe('wildcard events', () => {
    it('should support wildcard listeners', () => {
      const handler = jest.fn();
      emitter.on('*', handler);
      
      emitter.emit('test', { value: 42 });
      emitter.emit('data', 'hello');
      
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith({ value: 42 }, 'test');
      expect(handler).toHaveBeenCalledWith('hello', 'data');
    });
    
    it('should not trigger wildcard on wildcard emit', () => {
      const handler = jest.fn();
      emitter.on('*', handler);
      
      emitter.emit('*' as any, null);
      
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('async events', () => {
    it('should handle async events', async () => {
      const asyncEmitter = new EventEmitter<TestEvents>({ async: true });
      const results: number[] = [];
      
      asyncEmitter.on('test', async (data) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        results.push(data.value);
      });
      
      asyncEmitter.on('test', async (data) => {
        await new Promise(resolve => setTimeout(resolve, 5));
        results.push(data.value * 2);
      });
      
      await asyncEmitter.emitAsync('test', { value: 10 });
      
      expect(results).toContain(10);
      expect(results).toContain(20);
    });
  });
  
  describe('error handling', () => {
    it('should catch errors in handlers', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      emitter.on('test', () => {
        throw new Error('Handler error');
      });
      
      emitter.emit('test', { value: 42 });
      
      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
    
    it('should show verbose errors when enabled', () => {
      const verboseEmitter = new EventEmitter<TestEvents>({ verboseErrors: true });
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      
      verboseEmitter.on('test', () => {
        throw error;
      });
      
      verboseEmitter.emit('test', { value: 42 });
      
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("Error in event handler for 'test':"),
        error
      );
      consoleError.mockRestore();
    });
  });
  
  describe('listener management', () => {
    it('should track listener count', () => {
      expect(emitter.listenerCount('test')).toBe(0);
      
      const off1 = emitter.on('test', () => {});
      expect(emitter.listenerCount('test')).toBe(1);
      
      const off2 = emitter.on('test', () => {});
      expect(emitter.listenerCount('test')).toBe(2);
      
      off1();
      expect(emitter.listenerCount('test')).toBe(1);
      
      off2();
      expect(emitter.listenerCount('test')).toBe(0);
    });
    
    it('should get total listener count', () => {
      emitter.on('test', () => {});
      emitter.on('data', () => {});
      emitter.on('error', () => {});
      
      expect(emitter.listenerCount()).toBe(3);
    });
    
    it('should warn on max listeners exceeded', () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
      const limitedEmitter = new EventEmitter<TestEvents>({ maxListeners: 2 });
      
      limitedEmitter.on('test', () => {});
      limitedEmitter.on('test', () => {});
      limitedEmitter.on('test', () => {}); // This should warn
      
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('MaxListenersExceeded')
      );
      consoleWarn.mockRestore();
    });
  });
  
  describe('event names', () => {
    it('should return all event names', () => {
      emitter.on('test', () => {});
      emitter.on('data', () => {});
      emitter.once('error', () => {});
      
      const names = emitter.eventNames();
      expect(names).toContain('test');
      expect(names).toContain('data');
      expect(names).toContain('error');
    });
  });
  
  describe('clear', () => {
    it('should clear all listeners', () => {
      emitter.on('test', () => {});
      emitter.on('data', () => {});
      emitter.on('error', () => {});
      
      emitter.clear();
      
      expect(emitter.listenerCount()).toBe(0);
      expect(emitter.eventNames()).toHaveLength(0);
    });
    
    it('should clear specific event listeners', () => {
      emitter.on('test', () => {});
      emitter.on('data', () => {});
      
      emitter.clear('test');
      
      expect(emitter.listenerCount('test')).toBe(0);
      expect(emitter.listenerCount('data')).toBe(1);
    });
  });
  
  describe('waitFor', () => {
    it('should wait for event', async () => {
      setTimeout(() => {
        emitter.emit('test', { value: 42 });
      }, 10);
      
      const data = await emitter.waitFor('test');
      expect(data).toEqual({ value: 42 });
    });
    
    it('should timeout waiting for event', async () => {
      await expect(
        emitter.waitFor('test', 10)
      ).rejects.toThrow('Timeout waiting for event: test');
    });
  });
});