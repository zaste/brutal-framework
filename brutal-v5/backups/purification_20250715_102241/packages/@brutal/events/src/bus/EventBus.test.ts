/**
 * Tests for EventBus
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { EventBus } from './index.js';
import type { EventMap } from '../types/index.js';

interface TestEvents extends EventMap {
  'user:login': { id: string; name: string };
  'user:logout': { id: string };
  'data:update': { type: string; payload: any };
  'error': Error;
}

describe('EventBus', () => {
  let bus: EventBus<TestEvents>;
  
  beforeEach(() => {
    bus = new EventBus<TestEvents>();
  });
  
  describe('basic functionality', () => {
    it('should extend EventEmitter', () => {
      expect(bus.on).toBeDefined();
      expect(bus.emit).toBeDefined();
      expect(bus.off).toBeDefined();
    });
  });
  
  describe('channels', () => {
    it('should create and return channels', () => {
      const userChannel = bus.channel<{ created: { id: string } }>('user');
      expect(userChannel).toBeDefined();
      expect(userChannel.on).toBeDefined();
      expect(userChannel.emit).toBeDefined();
      
      // Should return same channel
      const sameChannel = bus.channel('user');
      expect(sameChannel).toBe(userChannel);
    });
    
    it('should remove channels', () => {
      const channel = bus.channel('temp');
      expect(channel).toBeDefined();
      
      bus.removeChannel('temp');
      
      // Getting the channel again should create a new one
      const newChannel = bus.channel('temp');
      expect(newChannel).not.toBe(channel);
    });
  });
  
  describe('history', () => {
    it('should track event history when using send method', () => {
      const historyBus = new EventBus<TestEvents>({ history: true });
      
      historyBus.send('user:login', { id: '1', name: 'Alice' });
      historyBus.send('user:logout', { id: '1' });
      historyBus.send('data:update', { type: 'config', payload: {} });
      
      const history = historyBus.getHistory();
      expect(history).toHaveLength(3);
      expect(history[0].event).toBe('user:login');
      expect(history[1].event).toBe('user:logout');
      expect(history[2].event).toBe('data:update');
    });
    
    it('should filter history', () => {
      const historyBus = new EventBus<TestEvents>({ history: true });
      
      historyBus.send('user:login', { id: '1', name: 'Alice' });
      historyBus.send('user:logout', { id: '1' });
      historyBus.send('data:update', { type: 'config', payload: {} });
      
      const userHistory = historyBus.getHistory({
        event: 'user:login'
      });
      
      expect(userHistory).toHaveLength(1);
      expect(userHistory[0].event).toBe('user:login');
    });
    
    it('should limit history size', () => {
      const historyBus = new EventBus<TestEvents>({ 
        history: true, 
        maxHistory: 2 
      });
      
      historyBus.send('user:login', { id: '1', name: 'Alice' });
      historyBus.send('user:logout', { id: '1' });
      historyBus.send('data:update', { type: 'config', payload: {} });
      
      const history = historyBus.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].event).toBe('user:logout');
      expect(history[1].event).toBe('data:update');
    });
    
    it('should clear history', () => {
      const historyBus = new EventBus<TestEvents>({ history: true });
      
      historyBus.send('user:login', { id: '1', name: 'Alice' });
      historyBus.send('user:logout', { id: '1' });
      
      historyBus.clearHistory();
      
      expect(historyBus.getHistory()).toHaveLength(0);
    });
  });
  
  describe('metadata', () => {
    it('should pass metadata through history', () => {
      const historyBus = new EventBus<TestEvents>({ history: true });
      
      historyBus.send('user:login', { id: '123', name: 'John' }, {
        source: 'auth-service',
        target: 'user-service'
      });
      
      const history = historyBus.getHistory();
      expect(history[0].source).toBe('auth-service');
      expect(history[0].target).toBe('user-service');
    });
  });
  
  describe('destroy', () => {
    it('should clean up everything', () => {
      const historyBus = new EventBus<TestEvents>({ history: true });
      
      // Add some data
      historyBus.channel('test');
      historyBus.send('user:login', { id: '1', name: 'Alice' });
      historyBus.on('test' as any, jest.fn());
      
      historyBus.destroy();
      
      expect(historyBus.getHistory()).toHaveLength(0);
      expect(historyBus.listenerCount()).toBe(0);
    });
  });
});