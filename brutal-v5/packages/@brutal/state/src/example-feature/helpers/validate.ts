import type { ExampleOptions } from '../../types.js';

/**
 * Validates feature options
 */
export function validateOptions(options: Required<ExampleOptions>): void {
  if (options.maxRetries < 0) {
    throw new Error('maxRetries must be non-negative');
  }

  if (options.maxRetries > 10) {
    throw new Error('maxRetries cannot exceed 10');
  }
}

/**
 * Format error messages
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  return String(error);
}
