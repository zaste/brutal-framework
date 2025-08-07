/**
 * Enhanced router combining guards, transitions, and nested routing
 */

import { createRouter, type Router, type Route } from '@brutal/routing';
import { EventEmitter } from '@brutal/events';
import { RouteGuard, type GuardContext, type GuardResult } from '../guards/RouteGuard.js';
import { RouteTransition, type TransitionOptions } from '../transitions/RouteTransition.js';
import { NestedRouter, type NestedRouteConfig } from '../nested/NestedRouter.js';

export interface RouteConfig extends Route {
  guards?: Array<(context: GuardContext) => GuardResult | Promise<GuardResult>>;
  transition?: TransitionOptions;
  children?: NestedRouteConfig[];
}

export interface EnhancedRouterOptions {
  base?: string;
  defaultTransition?: TransitionOptions;
  errorHandler?: (error: Error) => void;
}

export class EnhancedRouter {
  private router: Router;
  private events: EventEmitter;
  private guards: RouteGuard;
  private transition: RouteTransition;
  private nestedRouter: NestedRouter;
  private options: EnhancedRouterOptions;
  private currentRoute?: string;
  
  constructor(options: EnhancedRouterOptions = {}) {
    this.router = createRouter({ base: options.base });
    this.events = new EventEmitter();
    this.guards = new RouteGuard();
    this.transition = new RouteTransition(options.defaultTransition);
    this.nestedRouter = new NestedRouter(this.router);
    this.options = options;
    
    this.setupRouterHooks();
  }

  addRoute(config: RouteConfig): void {
    // Add guards if specified
    if (config.guards) {
      for (const guard of config.guards) {
        this.guards.addGuard(config.path, guard);
      }
    }
    
    // Handle nested routes
    if (config.children) {
      this.nestedRouter.addNestedRoute({
        path: config.path,
        component: config.component,
        children: config.children,
        meta: config.meta,
        name: config.name
      });
    } else {
      // Add regular route
      this.router.add(config);
    }
  }

  async navigate(to: string, options?: { replace?: boolean }): Promise<boolean> {
    try {
      // Create guard context
      const context: GuardContext = {
        from: this.currentRoute || '/',
        to,
        params: this.extractParams(to),
        query: new URLSearchParams(window.location.search),
        path: to,
        route: null as any // Will be set by router
      };
      
      // Check guards
      const guardResult = await this.guards.checkGuards(context);
      
      if (!guardResult.allowed) {
        if (guardResult.redirect) {
          return this.navigate(guardResult.redirect, options);
        }
        
        this.events.emit('navigation:blocked', {
          from: context.from,
          to: context.to,
          reason: guardResult.error
        });
        
        return false;
      }
      
      // Proceed with navigation
      this.router.navigate(to, options);
      return true;
      
    } catch (error) {
      if (this.options.errorHandler) {
        this.options.errorHandler(error as Error);
      }
      return false;
    }
  }

  back(): void {
    window.history.back();
  }

  forward(): void {
    window.history.forward();
  }

  go(delta: number): void {
    window.history.go(delta);
  }

  getCurrentRoute(): string | undefined {
    return this.currentRoute;
  }

  getNestedRouter(): NestedRouter {
    return this.nestedRouter;
  }

  on(event: string, handler: (...args: any[]) => void): void {
    this.events.on(event, handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.events.off(event, handler);
  }

  private setupRouterHooks(): void {
    // Track current route
    this.router.on('navigate', ({ path }) => {
      const previousRoute = this.currentRoute;
      this.currentRoute = path;
      
      this.events.emit('route:change', {
        from: previousRoute,
        to: path
      });
    });
    
    // Handle transitions
    this.router.on('before:render', async ({ from, to }) => {
      const fromElement = from ? document.querySelector(`[data-route="${from}"]`) as HTMLElement : null;
      const toElement = document.querySelector(`[data-route="${to}"]`) as HTMLElement;
      
      if (toElement) {
        await this.transition.transition(fromElement, toElement, from || '/', to);
      }
    });
  }

  private extractParams(path: string): Record<string, string> {
    // Simple param extraction - would be more complex in real implementation
    const params: Record<string, string> = {};
    const segments = path.split('/').filter(Boolean);
    
    segments.forEach((segment, index) => {
      if (segment.startsWith(':')) {
        params[segment.slice(1)] = segments[index] || '';
      }
    });
    
    return params;
  }

  start(): void {
    this.router.start();
  }

  stop(): void {
    this.router.stop();
  }
}

export function createEnhancedRouter(options?: EnhancedRouterOptions): EnhancedRouter {
  return new EnhancedRouter(options);
}