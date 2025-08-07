/**
 * Types for middleware system
 */

export interface MiddlewareContext<T> {
  /** Current state */
  getState: () => T;
  /** Set state */
  setState: (state: Partial<T>) => void;
  /** Action being processed */
  action?: {
    type: string;
    payload?: unknown;
  };
}

export type Middleware<T> = (
  context: MiddlewareContext<T>,
  next: () => void
) => void | Promise<void>;

export interface MiddlewarePipeline<T> {
  /** Add middleware to pipeline */
  use(middleware: Middleware<T>): void;
  /** Remove middleware from pipeline */
  remove(middleware: Middleware<T>): void;
  /** Execute middleware pipeline */
  execute(context: MiddlewareContext<T>, final: () => void): Promise<void>;
  /** Clear all middleware */
  clear(): void;
}