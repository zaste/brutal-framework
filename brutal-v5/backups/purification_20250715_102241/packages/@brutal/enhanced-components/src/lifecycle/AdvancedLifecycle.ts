/**
 * Advanced lifecycle hooks for BRUTAL components
 */

import { BrutalComponent } from '@brutal/components';
import { EventEmitter } from '@brutal/events';

export type LifecycleHook = 
  | 'beforeInit'
  | 'afterInit'
  | 'beforeConnect'
  | 'afterConnect'
  | 'beforeRender'
  | 'afterRender'
  | 'beforeUpdate'
  | 'afterUpdate'
  | 'beforeDisconnect'
  | 'afterDisconnect'
  | 'onError';

export interface LifecycleOptions {
  /** Enable lifecycle events */
  emitEvents?: boolean;
  /** Enable error boundaries */
  errorBoundary?: boolean;
  /** Enable performance tracking */
  trackPerformance?: boolean;
}

/**
 * Component with advanced lifecycle management
 */
export class LifecycleComponent extends BrutalComponent {
  private lifecycleEmitter = new EventEmitter();
  private lifecycleOptions: LifecycleOptions = {
    emitEvents: true,
    errorBoundary: true,
    trackPerformance: false
  };
  
  private renderCount = 0;
  private updateCount = 0;
  private performanceMarks = new Map<string, number>();

  constructor() {
    super();
    this.runLifecycleHook('beforeInit');
  }

  protected init(): void {
    try {
      // Read options from attributes first
      if (this.hasAttribute('no-events')) {
        this.lifecycleOptions.emitEvents = false;
      }
      if (this.hasAttribute('no-error-boundary')) {
        this.lifecycleOptions.errorBoundary = false;
      }
      if (this.hasAttribute('track-performance')) {
        this.lifecycleOptions.trackPerformance = true;
      }
      
      this.mark('init-start');
      
      this.onInit();
      this.runLifecycleHook('afterInit');
      
      this.measure('init-start', 'init-duration');
    } catch (error) {
      this.handleError(error, 'init');
    }
  }

  connectedCallback(): void {
    try {
      this.runLifecycleHook('beforeConnect');
      super.connectedCallback();
      this.runLifecycleHook('afterConnect');
      
      // Initial render
      this.performRender();
    } catch (error) {
      this.handleError(error, 'connect');
    }
  }

  disconnectedCallback(): void {
    try {
      this.runLifecycleHook('beforeDisconnect');
      this.onDisconnect();
      super.disconnectedCallback?.();
      this.runLifecycleHook('afterDisconnect');
    } catch (error) {
      this.handleError(error, 'disconnect');
    }
  }

  /**
   * Request component update
   */
  requestUpdate(): void {
    try {
      this.runLifecycleHook('beforeUpdate');
      this.updateCount++;
      
      this.mark('update-start');
      this.onUpdate();
      this.performRender();
      this.runLifecycleHook('afterUpdate');
      
      this.measure('update-start', `update-${this.updateCount}`);
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  private performRender(): void {
    try {
      this.runLifecycleHook('beforeRender');
      this.renderCount++;
      
      this.mark('render-start');
      this.render();
      this.runLifecycleHook('afterRender');
      
      this.measure('render-start', `render-${this.renderCount}`);
    } catch (error) {
      this.handleError(error, 'render');
    }
  }

  /**
   * Override these lifecycle methods in subclasses
   */
  protected onInit(): void {
    // Override in subclass
  }

  protected onUpdate(): void {
    // Override in subclass
  }

  protected onDisconnect(): void {
    // Override in subclass
  }

  protected render(): void {
    // Override in subclass
  }

  /**
   * Hook into lifecycle events
   */
  on(hook: LifecycleHook, handler: (...args: any[]) => void): () => void {
    return this.lifecycleEmitter.on(hook, handler);
  }

  /**
   * Remove lifecycle event listener
   */
  off(hook: LifecycleHook, handler: (...args: any[]) => void): void {
    this.lifecycleEmitter.off(hook, handler);
  }

  private runLifecycleHook(hook: LifecycleHook, ...args: any[]): void {
    if (this.lifecycleOptions.emitEvents) {
      this.lifecycleEmitter.emit(hook, this, ...args);
    }
  }

  private handleError(error: unknown, phase: string): void {
    const errorInfo = {
      error,
      phase,
      component: this,
      timestamp: Date.now()
    };
    
    this.runLifecycleHook('onError', errorInfo);
    
    if (this.lifecycleOptions.errorBoundary) {
      this.renderError(error, phase);
    } else {
      throw error;
    }
  }

  /**
   * Render error state
   */
  protected renderError(error: unknown, phase: string): void {
    this.innerHTML = `
      <div class="component-error">
        <h3>Component Error</h3>
        <p>Phase: ${phase}</p>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    `;
  }

  /**
   * Performance tracking
   */
  private mark(name: string): void {
    if (this.lifecycleOptions.trackPerformance) {
      this.performanceMarks.set(name, performance.now());
    }
  }

  private measure(startMark: string, measureName: string): void {
    if (this.lifecycleOptions.trackPerformance) {
      const start = this.performanceMarks.get(startMark);
      if (start) {
        const duration = performance.now() - start;
        this.lifecycleEmitter.emit('performance', {
          measure: measureName,
          duration,
          component: this
        });
      }
    }
  }

  /**
   * Get render statistics
   */
  getRenderStats(): {
    renderCount: number;
    updateCount: number;
    performance: Map<string, number>;
  } {
    return {
      renderCount: this.renderCount,
      updateCount: this.updateCount,
      performance: new Map(this.performanceMarks)
    };
  }
}

/**
 * Decorator to add lifecycle hooks to any component
 */
export function WithLifecycle(options: LifecycleOptions = {}) {
  return function <T extends new (...args: any[]) => BrutalComponent>(
    Base: T
  ): T & (new (...args: any[]) => LifecycleComponent) {
    return class extends Base {
      private lifecycleEmitter = new EventEmitter();
      private lifecycleOptions = options;
      
      constructor(...args: any[]) {
        super(...args);
        // Add lifecycle functionality
        Object.setPrototypeOf(this, LifecycleComponent.prototype);
      }
    } as any;
  };
}

/**
 * Hook to use lifecycle events in functional style
 */
export function useLifecycle(
  component: BrutalComponent,
  hooks: Partial<Record<LifecycleHook, (...args: any[]) => void>>
): () => void {
  const lifecycleComponent = component as unknown as LifecycleComponent;
  const unsubscribers: (() => void)[] = [];
  
  Object.entries(hooks).forEach(([hook, handler]) => {
    if (handler && lifecycleComponent.on) {
      const unsubscribe = lifecycleComponent.on(hook as LifecycleHook, handler);
      unsubscribers.push(unsubscribe);
    }
  });
  
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
}