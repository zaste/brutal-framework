import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { 
  debug,
  createDebug,
  configureDebug,
  DebugLevels,
  PerformanceMeasure,
  getMemoryUsage,
  getStackTrace,
  inspect,
  debugAPI
} from './index.js';

describe('Debug utilities', () => {
  // Save original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  beforeEach(() => {
    // Reset console methods
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    
    // Reset debug config
    configureDebug({
      enabled: false,
      level: 'INFO',
      namespaces: new Set(['*']),
      timestamp: false,
      colors: false
    });
  });
  
  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });
  
  describe('configureDebug', () => {
    it('should enable debug output', () => {
      configureDebug({ enabled: true });
      debug.info('test message');
      expect(console.log).toHaveBeenCalled();
    });
    
    it('should respect debug level', () => {
      configureDebug({ enabled: true, level: 'ERROR' });
      debug.info('info message');
      debug.error('error message');
      
      expect(console.log).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('error message'));
    });
    
    it('should filter by namespace', () => {
      configureDebug({ 
        enabled: true, 
        namespaces: new Set(['brutal:test']) 
      });
      
      const testDebug = createDebug('brutal:test');
      const otherDebug = createDebug('other:namespace');
      
      testDebug.info('test message');
      otherDebug.info('other message');
      
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test message'));
    });
    
    it('should support wildcard namespaces', () => {
      configureDebug({ 
        enabled: true, 
        namespaces: new Set(['brutal:*']) 
      });
      
      const testDebug = createDebug('brutal:test');
      const subDebug = createDebug('brutal:test:sub');
      const otherDebug = createDebug('other:namespace');
      
      testDebug.info('test message');
      subDebug.info('sub message');
      otherDebug.info('other message');
      
      expect(console.log).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('createDebug', () => {
    it('should create debug instance with all log methods', () => {
      const testDebug = createDebug('test');
      
      expect(testDebug.error).toBeDefined();
      expect(testDebug.warn).toBeDefined();
      expect(testDebug.info).toBeDefined();
      expect(testDebug.debug).toBeDefined();
      expect(testDebug.trace).toBeDefined();
    });
    
    it('should include namespace in output', () => {
      configureDebug({ enabled: true });
      const testDebug = createDebug('test:namespace');
      
      testDebug.info('test message');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[test:namespace]')
      );
    });
    
    it('should format multiple arguments', () => {
      configureDebug({ enabled: true });
      const testDebug = createDebug('test');
      
      testDebug.info('message', { foo: 'bar' }, 123);
      
      // The debug formatter pretty-prints JSON, so check for the content
      const callArg = (console.log as jest.Mock).mock.calls[0][0];
      expect(callArg).toContain('message');
      expect(callArg).toContain('"foo"');
      expect(callArg).toContain('"bar"');
      expect(callArg).toContain('123');
    });
  });
  
  describe('PerformanceMeasure', () => {
    it('should measure performance between marks', () => {
      const measure = new PerformanceMeasure();
      
      measure.mark('start');
      // Simulate some work
      const arr = new Array(1000).fill(0).map((_, i) => i * 2);
      measure.mark('end');
      
      const duration = measure.measure('operation', 'start', 'end');
      
      expect(duration).toBeGreaterThan(0);
      expect(measure.getMeasure('operation')).toBe(duration);
    });
    
    it('should measure from mark to now', () => {
      const measure = new PerformanceMeasure();
      
      measure.mark('start');
      const duration = measure.measure('operation', 'start');
      
      expect(duration).toBeGreaterThan(0);
    });
    
    it('should return all measures', () => {
      const measure = new PerformanceMeasure();
      
      measure.mark('start1');
      measure.mark('end1');
      measure.measure('op1', 'start1', 'end1');
      
      measure.mark('start2');
      measure.mark('end2');
      measure.measure('op2', 'start2', 'end2');
      
      const all = measure.getAllMeasures();
      
      expect(all.op1).toBeDefined();
      expect(all.op2).toBeDefined();
    });
    
    it('should clear marks and measures', () => {
      const measure = new PerformanceMeasure();
      
      measure.mark('start');
      measure.measure('op', 'start');
      measure.clear();
      
      expect(measure.getMeasure('op')).toBeUndefined();
      expect(measure.getAllMeasures()).toEqual({});
    });
  });
  
  describe('getMemoryUsage', () => {
    it('should return memory usage in Node.js', () => {
      const usage = getMemoryUsage();
      
      if (typeof process !== 'undefined' && process.memoryUsage) {
        expect(usage).toBeDefined();
        expect(usage?.heapUsed).toBeGreaterThan(0);
        expect(usage?.heapTotal).toBeGreaterThan(0);
      } else {
        expect(usage).toBeNull();
      }
    });
  });
  
  describe('getStackTrace', () => {
    it('should return stack trace', () => {
      const stack = getStackTrace(5);
      
      expect(Array.isArray(stack)).toBe(true);
      expect(stack.length).toBeLessThanOrEqual(5);
      stack.forEach(line => {
        expect(line).toMatch(/^at /);
      });
    });
  });
  
  describe('inspect', () => {
    it('should stringify objects', () => {
      const obj = { foo: 'bar', nested: { value: 123 } };
      const result = inspect(obj);
      
      expect(result).toContain('"foo"');
      expect(result).toContain('"bar"');
      expect(result).toContain('"value"');
      expect(result).toContain('123');
    });
    
    it('should handle circular references', () => {
      const obj: any = { foo: 'bar' };
      obj.circular = obj;
      
      const result = inspect(obj);
      
      expect(result).toContain('[Circular]');
    });
    
    it('should handle functions', () => {
      const obj = { 
        fn: function namedFunc() {},
        arrow: () => {}
      };
      
      const result = inspect(obj);
      
      expect(result).toContain('[Function: namedFunc]');
      expect(result).toContain('[Function: arrow]');
    });
    
    it('should handle undefined values', () => {
      const obj = { foo: undefined };
      const result = inspect(obj);
      
      expect(result).toContain('[undefined]');
    });
  });
  
  describe('debugAPI', () => {
    it('should expose all debug utilities', () => {
      expect(debugAPI.configure).toBe(configureDebug);
      expect(debugAPI.create).toBe(createDebug);
      expect(debugAPI.measure).toBeInstanceOf(PerformanceMeasure);
      expect(debugAPI.getMemoryUsage).toBe(getMemoryUsage);
      expect(debugAPI.getStackTrace).toBe(getStackTrace);
      expect(debugAPI.inspect).toBe(inspect);
    });
  });
});