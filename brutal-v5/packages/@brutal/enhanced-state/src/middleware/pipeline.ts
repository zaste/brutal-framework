/**
 * Middleware pipeline implementation
 */

import type { Middleware, MiddlewarePipeline, MiddlewareContext } from './types.js';

export class Pipeline<T> implements MiddlewarePipeline<T> {
  private middlewares: Middleware<T>[] = [];

  use(middleware: Middleware<T>): void {
    this.middlewares.push(middleware);
  }

  remove(middleware: Middleware<T>): void {
    const index = this.middlewares.indexOf(middleware);
    if (index !== -1) {
      this.middlewares.splice(index, 1);
    }
  }

  async execute(context: MiddlewareContext<T>, final: () => void): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index >= this.middlewares.length) {
        final();
        return;
      }

      const middleware = this.middlewares[index++];
      await middleware(context, next);
    };

    await next();
  }

  clear(): void {
    this.middlewares = [];
  }

  getMiddlewares(): Middleware<T>[] {
    return [...this.middlewares];
  }
}

/**
 * Common middleware factories
 */
export const middleware = {
  /**
   * Logger middleware
   */
  logger<T>(): Middleware<T> {
    return (context, next) => {
      const prevState = context.getState();
      console.log('[Middleware] Before:', prevState);
      
      next();
      
      const nextState = context.getState();
      console.log('[Middleware] After:', nextState);
      if (context.action) {
        console.log('[Middleware] Action:', context.action);
      }
    };
  },

  /**
   * Validator middleware
   */
  validator<T>(validate: (state: T) => boolean | string): Middleware<T> {
    return (context, next) => {
      next();
      
      const state = context.getState();
      const result = validate(state);
      
      if (result !== true) {
        throw new Error(
          typeof result === 'string' 
            ? result 
            : 'State validation failed'
        );
      }
    };
  },

  /**
   * Throttle middleware
   */
  throttle<T>(ms: number): Middleware<T> {
    let lastRun = 0;
    
    return (context, next) => {
      const now = Date.now();
      
      if (now - lastRun < ms) {
        return; // Skip this update
      }
      
      lastRun = now;
      next();
    };
  }
};