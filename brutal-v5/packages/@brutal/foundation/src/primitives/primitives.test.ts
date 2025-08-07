import { describe, it, expect } from '@jest/globals';
import {
  EventEmitter,
  Observable,
  AsyncQueue,
  Deferred,
  Cache,
  ObjectPool,
  StateMachine
} from './index.js';

describe('EventEmitter', () => {
  it('should handle events correctly', () => {
    const emitter = new EventEmitter<{
      test: [string, number];
      other: [];
    }>();
    
    const results: string[] = [];
    
    const unsubscribe = emitter.on('test', (msg, num) => {
      results.push(`${msg}-${num}`);
    });
    
    emitter.emit('test', 'hello', 1);
    emitter.emit('test', 'world', 2);
    
    expect(results).toEqual(['hello-1', 'world-2']);
    
    unsubscribe();
    emitter.emit('test', 'ignored', 3);
    
    expect(results).toEqual(['hello-1', 'world-2']);
  });

  it('once should fire only once', () => {
    const emitter = new EventEmitter<{ event: [string] }>();
    let count = 0;
    
    emitter.once('event', () => count++);
    
    emitter.emit('event', 'test');
    emitter.emit('event', 'test');
    emitter.emit('event', 'test');
    
    expect(count).toBe(1);
  });
});

describe('Observable', () => {
  it('should notify subscribers on change', () => {
    const obs = new Observable(10);
    const changes: Array<[number, number]> = [];
    
    const unsub = obs.subscribe((value, oldValue) => {
      changes.push([value, oldValue]);
    });
    
    expect(obs.get()).toBe(10);
    
    obs.set(20);
    obs.set(30);
    obs.update(v => v + 5);
    
    expect(changes).toEqual([
      [20, 10],
      [30, 20],
      [35, 30]
    ]);
    
    unsub();
    obs.set(40);
    
    expect(changes.length).toBe(3);
  });
});

describe('AsyncQueue', () => {
  it('should handle push/pop correctly', async () => {
    const queue = new AsyncQueue<number>();
    
    queue.push(1);
    queue.push(2);
    queue.push(3);
    
    expect(queue.size()).toBe(3);
    
    const val1 = await queue.pop();
    const val2 = await queue.pop();
    const val3 = await queue.pop();
    
    expect([val1, val2, val3]).toEqual([1, 2, 3]);
    expect(queue.size()).toBe(0);
  });

  it('should wait for items when empty', async () => {
    const queue = new AsyncQueue<string>();
    
    // Start waiting for an item
    const promise = queue.pop();
    
    // Push item after a delay
    setTimeout(() => queue.push('delayed'), 10);
    
    const result = await promise;
    expect(result).toBe('delayed');
  });
});

describe('Deferred', () => {
  it('should resolve correctly', async () => {
    const deferred = new Deferred<string>();
    
    expect(deferred.isSettled()).toBe(false);
    
    setTimeout(() => {
      deferred.resolve('success');
    }, 10);
    
    const result = await deferred.promise;
    expect(result).toBe('success');
    expect(deferred.isSettled()).toBe(true);
  });

  it('should reject correctly', async () => {
    const deferred = new Deferred<string>();
    
    setTimeout(() => {
      deferred.reject(new Error('failed'));
    }, 10);
    
    try {
      await deferred.promise;
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toBe('failed');
    }
  });
});

describe('Cache', () => {
  it('should store and retrieve values', () => {
    const cache = new Cache<string, number>();
    
    cache.set('a', 1);
    cache.set('b', 2);
    
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBeUndefined();
    expect(cache.has('a')).toBe(true);
    expect(cache.has('c')).toBe(false);
  });

  it('should expire items with TTL', async () => {
    const cache = new Cache<string, string>(50); // 50ms default TTL
    
    cache.set('temp', 'value');
    expect(cache.get('temp')).toBe('value');
    
    await new Promise(resolve => setTimeout(resolve, 60));
    
    expect(cache.get('temp')).toBeUndefined();
    expect(cache.has('temp')).toBe(false);
  });
});

describe('ObjectPool', () => {
  it('should reuse objects', () => {
    let created = 0;
    const pool = new ObjectPool(
      () => ({ id: ++created, data: null }),
      (obj) => { obj.data = null; },
      2
    );
    
    const obj1 = pool.acquire();
    const obj2 = pool.acquire();
    
    expect(obj1.id).toBe(1);
    expect(obj2.id).toBe(2);
    
    pool.release(obj1);
    pool.release(obj2);
    
    const obj3 = pool.acquire();
    expect(obj3.id).toBe(2); // Reused from pool
    expect(created).toBe(2);
  });
});

describe('StateMachine', () => {
  it('should handle transitions', () => {
    type States = 'idle' | 'loading' | 'loaded' | 'error';
    type Events = 'fetch' | 'success' | 'fail' | 'reset';
    
    const machine = new StateMachine<States, Events>('idle', [
      { from: 'idle', event: 'fetch', to: 'loading' },
      { from: 'loading', event: 'success', to: 'loaded' },
      { from: 'loading', event: 'fail', to: 'error' },
      { from: 'loaded', event: 'reset', to: 'idle' },
      { from: 'error', event: 'reset', to: 'idle' }
    ]);
    
    const transitions: Array<[States, States, Events]> = [];
    
    machine.onTransition((from, to, event) => {
      transitions.push([from, to, event]);
    });
    
    expect(machine.getState()).toBe('idle');
    expect(machine.canTransition('fetch')).toBe(true);
    expect(machine.canTransition('success')).toBe(false);
    
    expect(machine.transition('fetch')).toBe(true);
    expect(machine.getState()).toBe('loading');
    
    expect(machine.transition('success')).toBe(true);
    expect(machine.getState()).toBe('loaded');
    
    expect(machine.transition('fail')).toBe(false); // Invalid from 'loaded'
    
    expect(transitions).toEqual([
      ['idle', 'loading', 'fetch'],
      ['loading', 'loaded', 'success']
    ]);
  });
});