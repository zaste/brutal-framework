import { describe, it, expect } from '@jest/globals';
import {
  BrutalError,
  ConfigError,
  RegistryError,
  ErrorCodes,
  createError,
  errorHandlers,
  assert,
  tryAsync,
  trySync,
  errorBoundary
} from './index.js';

describe('BrutalError', () => {
  it('should create proper error instances', () => {
    const error = new BrutalError(
      ErrorCodes.CONFIG_NOT_FOUND,
      'Configuration file not found',
      { path: '/config.json' }
    );
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BrutalError);
    expect(error.name).toBe('BrutalError');
    expect(error.code).toBe('CONFIG_NOT_FOUND');
    expect(error.message).toBe('Configuration file not found');
    expect(error.details).toEqual({ path: '/config.json' });
    expect(error.timestamp).toBeGreaterThan(0);
    expect(error.stack).toBeDefined();
  });

  it('toJSON should serialize correctly', () => {
    const error = new BrutalError(
      ErrorCodes.INVALID_ARGUMENT,
      'Invalid input',
      { field: 'name' }
    );
    
    const json = error.toJSON();
    
    expect(json.code).toBe('INVALID_ARGUMENT');
    expect(json.message).toBe('Invalid input');
    expect(json.details).toEqual({ field: 'name' });
    expect(json.timestamp).toBeDefined();
    expect(json.stack).toBeDefined();
  });
});

describe('ConfigError', () => {
  it('should be a specialized error', () => {
    const error = new ConfigError('Invalid configuration', { key: 'debug' });
    
    expect(error).toBeInstanceOf(ConfigError);
    expect(error).toBeInstanceOf(BrutalError);
    expect(error.name).toBe('ConfigError');
    expect(error.code).toBe('CONFIG_INVALID');
  });
});

describe('RegistryError', () => {
  it('should be a specialized error', () => {
    const error = new RegistryError(
      ErrorCodes.PACKAGE_NOT_FOUND,
      'Package not found',
      { package: '@brutal/test' }
    );
    
    expect(error).toBeInstanceOf(RegistryError);
    expect(error.name).toBe('RegistryError');
    expect(error.code).toBe('PACKAGE_NOT_FOUND');
  });
});

describe('createError', () => {
  it('should create error instances', () => {
    const error = createError(
      ErrorCodes.OPERATION_FAILED,
      'Operation failed',
      { reason: 'timeout' }
    );
    
    expect(error).toBeInstanceOf(BrutalError);
    expect(error.code).toBe('OPERATION_FAILED');
  });
});

describe('errorHandlers', () => {
  it('should register and handle errors', () => {
    const handled: BrutalError[] = [];
    
    const unregister = errorHandlers.register((error) => {
      handled.push(error);
    });
    
    const error = createError(ErrorCodes.TIMEOUT, 'Request timeout');
    errorHandlers.handle(error);
    
    expect(handled).toHaveLength(1);
    expect(handled[0]).toBe(error);
    
    unregister();
    errorHandlers.handle(error);
    
    expect(handled).toHaveLength(1); // Not called again
  });
});

describe('assert', () => {
  it('should throw on false condition', () => {
    expect(() => {
      assert(true, 'Should not throw');
    }).not.toThrow();
    
    expect(() => {
      assert(false, 'Should throw');
    }).toThrow(BrutalError);
    
    try {
      assert(false, 'Custom message', ErrorCodes.CONFIG_INVALID);
    } catch (error: any) {
      expect(error.code).toBe('CONFIG_INVALID');
      expect(error.message).toBe('Custom message');
    }
  });
});

describe('tryAsync', () => {
  it('should handle async operations', async () => {
    // Success case
    const [result1, error1] = await tryAsync(async () => {
      return 'success';
    });
    
    expect(result1).toBe('success');
    expect(error1).toBeUndefined();
    
    // Error case
    const [result2, error2] = await tryAsync(async () => {
      throw new Error('async error');
    });
    
    expect(result2).toBeUndefined();
    expect(error2).toBeInstanceOf(BrutalError);
    expect(error2?.message).toBe('async error');
    
    // With fallback
    const [result3, error3] = await tryAsync(async () => {
      throw new Error('error');
    }, 'fallback');
    
    expect(result3).toBe('fallback');
    expect(error3).toBeDefined();
  });
});

describe('trySync', () => {
  it('should handle sync operations', () => {
    // Success case
    const [result1, error1] = trySync(() => {
      return 'success';
    });
    
    expect(result1).toBe('success');
    expect(error1).toBeUndefined();
    
    // Error case
    const [result2, error2] = trySync(() => {
      throw new Error('sync error');
    });
    
    expect(result2).toBeUndefined();
    expect(error2).toBeInstanceOf(BrutalError);
    expect(error2?.message).toBe('sync error');
  });
});

describe('errorBoundary', () => {
  it('should wrap functions', () => {
    const errors: BrutalError[] = [];
    
    // Sync function
    const wrapped = errorBoundary(
      (x: number) => {
        if (x < 0) throw new Error('Negative not allowed');
        return x * 2;
      },
      (error) => errors.push(error)
    );
    
    expect(wrapped(5)).toBe(10);
    expect(errors).toHaveLength(0);
    
    expect(() => wrapped(-1)).toThrow(BrutalError);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Negative not allowed');
  });

  it('should handle async functions', async () => {
    const errors: BrutalError[] = [];
    
    const wrappedAsync = errorBoundary(
      async (x: number) => {
        if (x < 0) throw new Error('Async negative');
        return x * 2;
      },
      (error) => errors.push(error)
    );
    
    const result = await wrappedAsync(5);
    expect(result).toBe(10);
    
    try {
      await wrappedAsync(-1);
    } catch (error: any) {
      expect(error).toBeInstanceOf(BrutalError);
      expect(errors).toHaveLength(1);
    }
  });
});