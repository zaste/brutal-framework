/**
 * Error handling system for BRUTAL foundation
 */

import type { ErrorInfo } from '../types.js';

// Error codes
export const ErrorCodes = {
  // Configuration errors
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
  CONFIG_INVALID: 'CONFIG_INVALID',
  
  // Registry errors
  PACKAGE_NOT_FOUND: 'PACKAGE_NOT_FOUND',
  PACKAGE_ALREADY_REGISTERED: 'PACKAGE_ALREADY_REGISTERED',
  PACKAGE_VERSION_MISMATCH: 'PACKAGE_VERSION_MISMATCH',
  
  // Polyfill errors
  POLYFILL_LOAD_FAILED: 'POLYFILL_LOAD_FAILED',
  POLYFILL_ALREADY_REGISTERED: 'POLYFILL_ALREADY_REGISTERED',
  
  // Environment errors
  ENV_NOT_SUPPORTED: 'ENV_NOT_SUPPORTED',
  ENV_PROFILE_NOT_FOUND: 'ENV_PROFILE_NOT_FOUND',
  
  // General errors
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  OPERATION_FAILED: 'OPERATION_FAILED',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  TIMEOUT: 'TIMEOUT'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Base error class for BRUTAL framework
 */
export class BrutalError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly timestamp: number;
  
  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'BrutalError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
    
    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BrutalError);
    }
  }
  
  toJSON(): ErrorInfo {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * Configuration error
 */
export class ConfigError extends BrutalError {
  constructor(message: string, details?: unknown) {
    super(ErrorCodes.CONFIG_INVALID, message, details);
    this.name = 'ConfigError';
  }
}

/**
 * Registry error
 */
export class RegistryError extends BrutalError {
  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(code, message, details);
    this.name = 'RegistryError';
  }
}

/**
 * Create error factory
 */
export const createError = (
  code: ErrorCode, 
  message: string, 
  details?: unknown
): BrutalError => {
  return new BrutalError(code, message, details);
};

/**
 * Error handler registry
 */
interface ErrorHandler {
  (error: BrutalError): void;
}

class ErrorHandlerRegistry {
  private handlers: Set<ErrorHandler> = new Set();
  
  register(handler: ErrorHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
  
  handle(error: BrutalError): void {
    for (const handler of this.handlers) {
      try {
        handler(error);
      } catch (e) {
        // Prevent error handler from throwing
        console.error('Error in error handler:', e);
      }
    }
  }
  
  clear(): void {
    this.handlers.clear();
  }
}

export const errorHandlers = new ErrorHandlerRegistry();

/**
 * Assert utility with error throwing
 */
export function assert(
  condition: any,
  message: string,
  code: ErrorCode = ErrorCodes.INVALID_ARGUMENT
): asserts condition {
  if (!condition) {
    throw createError(code, message);
  }
}

/**
 * Try-catch wrapper with error info
 */
export async function tryAsync<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<[T | undefined, BrutalError | undefined]> {
  try {
    const result = await fn();
    return [result, undefined];
  } catch (error) {
    const brutalError = error instanceof BrutalError 
      ? error 
      : createError(
          ErrorCodes.OPERATION_FAILED,
          error instanceof Error ? error.message : String(error),
          error
        );
    
    return [fallback, brutalError];
  }
}

/**
 * Synchronous try-catch wrapper
 */
export function trySync<T>(
  fn: () => T,
  fallback?: T
): [T | undefined, BrutalError | undefined] {
  try {
    const result = fn();
    return [result, undefined];
  } catch (error) {
    const brutalError = error instanceof BrutalError 
      ? error 
      : createError(
          ErrorCodes.OPERATION_FAILED,
          error instanceof Error ? error.message : String(error),
          error
        );
    
    return [fallback, brutalError];
  }
}

/**
 * Error boundary for catching and handling errors
 */
export function errorBoundary<T extends Function>(
  fn: T,
  errorHandler?: (error: BrutalError) => void
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result && typeof result.then === 'function') {
        return result.catch((error: any) => {
          const brutalError = error instanceof BrutalError
            ? error
            : createError(
                ErrorCodes.OPERATION_FAILED,
                error?.message || String(error),
                error
              );
          
          if (errorHandler) {
            errorHandler(brutalError);
          } else {
            errorHandlers.handle(brutalError);
          }
          
          throw brutalError;
        });
      }
      
      return result;
    } catch (error) {
      const brutalError = error instanceof BrutalError
        ? error
        : createError(
            ErrorCodes.OPERATION_FAILED,
            error instanceof Error ? error.message : String(error),
            error
          );
      
      if (errorHandler) {
        errorHandler(brutalError);
      } else {
        errorHandlers.handle(brutalError);
      }
      
      throw brutalError;
    }
  }) as any;
}