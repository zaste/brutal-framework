/**
 * Public types for @brutal/enhanced-routing
 */

export interface ExampleOptions {
  /** Enable debug mode */
  debug?: boolean;
  /** Maximum retry attempts */
  maxRetries?: number;
}

export interface ExampleResult {
  /** Operation success */
  success: boolean;
  /** Result data */
  data?: unknown;
  /** Error if failed */
  error?: Error;
}

export type ExampleCallback = (result: ExampleResult) => void;
