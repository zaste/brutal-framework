/**
 * Route matcher implementation
 */

import type { Route, RouteParams, RouteMatcher } from './types';

export type { RouteMatcher };

interface CompiledRoute extends Route {
  regex: RegExp;
  keys: string[];
}

export function compilePath(path: string): { regex: RegExp; keys: string[] } {
  const keys: string[] = [];
  let pattern = path
    // Escape special regex characters except : and *
    .replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
    // Convert :param to named capture groups
    .replace(/:(\w+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    })
    // Convert * to match everything
    .replace(/\*/g, '(.*)');
  
  // Add start and end anchors
  const regex = new RegExp(`^${pattern}$`);
  
  return { regex, keys };
}

export function matchPath(
  path: string,
  route: CompiledRoute
): { params: RouteParams } | null {
  const match = path.match(route.regex);
  
  if (!match) return null;
  
  const params: RouteParams = {};
  
  // Extract params from regex groups
  route.keys.forEach((key, index) => {
    params[key] = match[index + 1];
  });
  
  return { params };
}

export function createMatcher(routes: Route[]): RouteMatcher {
  const compiledRoutes: CompiledRoute[] = [];
  const namedRoutes = new Map<string, CompiledRoute>();
  
  function compileRoute(route: Route, parent?: Route): CompiledRoute {
    // Handle nested routes
    const path = parent ? `${parent.path}/${route.path}`.replace(/\/+/g, '/') : route.path;
    
    const { regex, keys } = compilePath(path);
    
    const compiled: CompiledRoute = {
      ...route,
      path,
      regex,
      keys,
      parent
    };
    
    // Store named route
    if (route.name) {
      namedRoutes.set(route.name, compiled);
    }
    
    // Compile children
    if (route.children) {
      compiled.children = route.children.map(child => compileRoute(child, compiled));
    }
    
    return compiled;
  }
  
  // Compile all routes
  routes.forEach(route => {
    compiledRoutes.push(compileRoute(route));
  });
  
  function findRoute(
    path: string,
    routes: CompiledRoute[]
  ): { params: RouteParams; route: CompiledRoute } | null {
    for (const route of routes) {
      const matched = matchPath(path, route);
      
      if (matched) {
        return { params: matched.params, route };
      }
      
      // Check children
      if (route.children) {
        const childMatch = findRoute(path, route.children);
        if (childMatch) return childMatch;
      }
    }
    
    return null;
  }
  
  return {
    match(path: string) {
      return findRoute(path, compiledRoutes);
    },
    
    addRoute(route: Route) {
      const compiled = compileRoute(route);
      compiledRoutes.push(compiled);
    },
    
    removeRoute(name: string) {
      const index = compiledRoutes.findIndex(r => r.name === name);
      if (index > -1) {
        compiledRoutes.splice(index, 1);
        namedRoutes.delete(name);
      }
    },
    
    getRoutes() {
      return compiledRoutes;
    }
  };
}