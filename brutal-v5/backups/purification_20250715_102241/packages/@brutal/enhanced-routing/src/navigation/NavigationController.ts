/**
 * Navigation controller for programmatic navigation
 */

import type { EnhancedRouter } from '../router/EnhancedRouter.js';

export interface NavigationOptions {
  replace?: boolean;
  state?: any;
  scroll?: boolean | ScrollToOptions;
}

export class NavigationController {
  private router: EnhancedRouter;
  private history: string[] = [];
  private maxHistorySize = 50;
  
  constructor(router: EnhancedRouter) {
    this.router = router;
    
    // Track navigation history
    this.router.on('route:change', ({ to }) => {
      this.addToHistory(to);
    });
  }

  async push(path: string, options?: NavigationOptions): Promise<boolean> {
    const result = await this.router.navigate(path, { replace: false });
    
    if (result && options?.state) {
      window.history.replaceState(
        { ...window.history.state, ...options.state },
        '',
        window.location.href
      );
    }
    
    if (result && options?.scroll !== false) {
      this.handleScroll(options?.scroll);
    }
    
    return result;
  }

  async replace(path: string, options?: NavigationOptions): Promise<boolean> {
    const result = await this.router.navigate(path, { replace: true });
    
    if (result && options?.state) {
      window.history.replaceState(
        { ...window.history.state, ...options.state },
        '',
        window.location.href
      );
    }
    
    if (result && options?.scroll !== false) {
      this.handleScroll(options?.scroll);
    }
    
    return result;
  }

  back(): void {
    this.router.back();
  }

  forward(): void {
    this.router.forward();
  }

  go(delta: number): void {
    this.router.go(delta);
  }

  getHistory(): string[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  canGoBack(): boolean {
    return window.history.length > 1;
  }

  canGoForward(): boolean {
    // This is approximate - browser doesn't expose forward history
    return false;
  }

  getCurrentPath(): string {
    return this.router.getCurrentRoute() || '/';
  }

  isActive(path: string, exact = false): boolean {
    const current = this.getCurrentPath();
    
    if (exact) {
      return current === path;
    }
    
    return current.startsWith(path);
  }

  private addToHistory(path: string): void {
    // Don't add duplicate consecutive entries
    if (this.history[this.history.length - 1] !== path) {
      this.history.push(path);
      
      // Maintain max history size
      if (this.history.length > this.maxHistorySize) {
        this.history = this.history.slice(-this.maxHistorySize);
      }
    }
  }

  private handleScroll(scroll?: boolean | ScrollToOptions): void {
    if (scroll === true) {
      window.scrollTo(0, 0);
    } else if (typeof scroll === 'object') {
      window.scrollTo(scroll);
    }
  }
}

// Hook for component usage
let navigationController: NavigationController | null = null;

export function useNavigation(router?: EnhancedRouter): NavigationController {
  if (!navigationController && router) {
    navigationController = new NavigationController(router);
  }
  
  if (!navigationController) {
    throw new Error('Navigation controller not initialized. Pass router to useNavigation()');
  }
  
  return navigationController;
}