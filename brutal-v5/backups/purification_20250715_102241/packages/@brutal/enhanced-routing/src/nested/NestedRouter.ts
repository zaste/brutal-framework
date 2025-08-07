/**
 * Nested routing support for complex route hierarchies
 */

import type { Router, Route } from '@brutal/routing';

export interface NestedRouteConfig {
  path: string;
  component?: any;
  children?: NestedRouteConfig[];
  meta?: Record<string, any>;
  name?: string;
  redirect?: string;
}

export class NestedRouter {
  private routes: Map<string, NestedRouteConfig> = new Map();
  private parentRouter: Router;
  
  constructor(parentRouter: Router) {
    this.parentRouter = parentRouter;
  }

  addNestedRoute(config: NestedRouteConfig, parentPath = ''): void {
    const fullPath = this.joinPaths(parentPath, config.path);
    
    // Store the route config
    this.routes.set(fullPath, config);
    
    // Register with parent router if has component
    if (config.component) {
      this.parentRouter.add({
        path: fullPath,
        component: config.component,
        meta: config.meta,
        name: config.name
      } as Route);
    }
    
    // Handle redirect
    if (config.redirect) {
      this.parentRouter.add({
        path: fullPath,
        redirect: this.joinPaths(parentPath, config.redirect)
      } as Route);
    }
    
    // Process children
    if (config.children) {
      for (const child of config.children) {
        this.addNestedRoute(child, fullPath);
      }
    }
  }

  getRouteConfig(path: string): NestedRouteConfig | undefined {
    return this.routes.get(path);
  }

  getParentRoute(path: string): NestedRouteConfig | undefined {
    const segments = path.split('/').filter(Boolean);
    
    while (segments.length > 0) {
      segments.pop();
      const parentPath = '/' + segments.join('/');
      
      if (this.routes.has(parentPath)) {
        return this.routes.get(parentPath);
      }
    }
    
    return undefined;
  }

  getChildRoutes(parentPath: string): NestedRouteConfig[] {
    const children: NestedRouteConfig[] = [];
    
    for (const [path, config] of this.routes) {
      if (path !== parentPath && path.startsWith(parentPath)) {
        const remaining = path.slice(parentPath.length);
        const segments = remaining.split('/').filter(Boolean);
        
        // Direct child only
        if (segments.length === 1) {
          children.push(config);
        }
      }
    }
    
    return children;
  }

  getAllRoutes(): Map<string, NestedRouteConfig> {
    return new Map(this.routes);
  }

  private joinPaths(parent: string, child: string): string {
    if (!parent || parent === '/') {
      return child.startsWith('/') ? child : `/${child}`;
    }
    
    const normalizedParent = parent.endsWith('/') ? parent.slice(0, -1) : parent;
    const normalizedChild = child.startsWith('/') ? child.slice(1) : child;
    
    return `${normalizedParent}/${normalizedChild}`;
  }
}

export function createNestedRoute(
  router: Router,
  config: NestedRouteConfig
): NestedRouter {
  const nestedRouter = new NestedRouter(router);
  nestedRouter.addNestedRoute(config);
  return nestedRouter;
}