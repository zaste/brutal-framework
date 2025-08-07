/**
 * Route guard system for navigation control
 */

import type { RouteContext } from '@brutal/routing';

export interface GuardContext extends RouteContext {
  from: string;
  to: string;
  params: Record<string, string>;
  query: URLSearchParams;
}

export interface GuardResult {
  allowed: boolean;
  redirect?: string;
  error?: string;
}

export type GuardFunction = (context: GuardContext) => GuardResult | Promise<GuardResult>;

export class RouteGuard {
  private guards: Map<string, GuardFunction[]> = new Map();
  
  addGuard(path: string, guard: GuardFunction): void {
    const guards = this.guards.get(path) || [];
    guards.push(guard);
    this.guards.set(path, guards);
  }

  async checkGuards(context: GuardContext): Promise<GuardResult> {
    const guards = this.getGuardsForPath(context.to);
    
    for (const guard of guards) {
      const result = await guard(context);
      if (!result.allowed) {
        return result;
      }
    }
    
    return { allowed: true };
  }

  private getGuardsForPath(path: string): GuardFunction[] {
    const guards: GuardFunction[] = [];
    
    // Exact match
    if (this.guards.has(path)) {
      guards.push(...this.guards.get(path)!);
    }
    
    // Pattern matching (e.g., /user/:id)
    for (const [pattern, patternGuards] of this.guards) {
      if (this.matchesPattern(path, pattern)) {
        guards.push(...patternGuards);
      }
    }
    
    return guards;
  }

  private matchesPattern(path: string, pattern: string): boolean {
    const pathParts = path.split('/').filter(Boolean);
    const patternParts = pattern.split('/').filter(Boolean);
    
    if (pathParts.length !== patternParts.length) {
      return false;
    }
    
    return patternParts.every((part, i) => 
      part.startsWith(':') || part === pathParts[i]
    );
  }
}

export function createGuard(guard: GuardFunction): GuardFunction {
  return guard;
}