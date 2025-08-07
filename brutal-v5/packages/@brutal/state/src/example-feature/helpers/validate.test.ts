import { describe, it, expect } from '@jest/globals';
import { validateOptions, formatError } from './validate.js';

describe('validateOptions', () => {
  it('should accept valid options', () => {
    expect(() => {
      validateOptions({ debug: false, maxRetries: 3 });
    }).not.toThrow();
  });

  it('should reject negative maxRetries', () => {
    expect(() => {
      validateOptions({ debug: false, maxRetries: -1 });
    }).toThrow('maxRetries must be non-negative');
  });

  it('should reject excessive maxRetries', () => {
    expect(() => {
      validateOptions({ debug: false, maxRetries: 11 });
    }).toThrow('maxRetries cannot exceed 10');
  });
});

describe('formatError', () => {
  it('should format Error instances', () => {
    const error = new Error('Test error');
    expect(formatError(error)).toBe('Test error');
  });

  it('should format non-Error values', () => {
    expect(formatError('string error')).toBe('string error');
    expect(formatError(123)).toBe('123');
    expect(formatError(null)).toBe('null');
  });
});
