/**
 * Async loading enhancer using composition pattern
 */

import type { BrutalComponent } from '@brutal/components';
import type { ComponentEnhancer } from '../compose.js';

export interface AsyncOptions {
  loader: () => Promise<any>;
  loading?: typeof BrutalComponent;
  error?: typeof BrutalComponent;
  delay?: number;
  timeout?: number;
}

/**
 * Enhancer that adds async loading capabilities
 */
export function withAsyncLoading(options: AsyncOptions): ComponentEnhancer {
  return (Component: typeof BrutalComponent) => {
    return class extends Component {
      private loadingState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
      private componentClass?: typeof BrutalComponent;
      private loadPromise?: Promise<void>;
      private delayTimer?: number;
      private timeoutTimer?: number;

      protected async init(): Promise<void> {
        this.loadingState = 'loading';
        this.loadPromise = this.loadComponent();
        
        if (options.delay && options.loading) {
          this.delayTimer = window.setTimeout(() => {
            if (this.loadingState === 'loading') {
              this.renderLoading();
            }
          }, options.delay);
        } else if (options.loading) {
          this.renderLoading();
        }
        
        if (options.timeout) {
          this.timeoutTimer = window.setTimeout(() => {
            if (this.loadingState === 'loading') {
              this.handleError(new Error('Component loading timeout'));
            }
          }, options.timeout);
        }
        
        await this.loadPromise;
      }

      private async loadComponent(): Promise<void> {
        try {
          const ComponentClass = await options.loader();
          this.componentClass = ComponentClass;
          this.loadingState = 'loaded';
          
          if (this.delayTimer) clearTimeout(this.delayTimer);
          if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
          
          this.render();
        } catch (error) {
          this.handleError(error);
        }
      }

      private handleError(error: unknown): void {
        this.loadingState = 'error';
        
        if (this.delayTimer) clearTimeout(this.delayTimer);
        if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
        
        this.renderError(error);
      }

      private renderLoading(): void {
        if (options.loading) {
          this.innerHTML = '';
          const loading = new options.loading();
          this.appendChild(loading);
        }
      }

      private renderError(error: unknown): void {
        if (options.error) {
          this.innerHTML = '';
          const errorComponent = new options.error();
          if ('error' in errorComponent) {
            (errorComponent as any).error = error;
          }
          this.appendChild(errorComponent);
        }
      }

      protected render(): void {
        if (this.loadingState === 'loaded' && this.componentClass) {
          this.innerHTML = '';
          const component = new this.componentClass();
          
          // Transfer attributes
          Array.from(this.attributes).forEach(attr => {
            if (attr.name !== 'is') {
              component.setAttribute(attr.name, attr.value);
            }
          });
          
          this.appendChild(component);
        }
      }

      disconnectedCallback(): void {
        if (this.delayTimer) clearTimeout(this.delayTimer);
        if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
        
        this.loadingState = 'idle';
        this.loadPromise = undefined;
        
        super.disconnectedCallback?.();
      }
    };
  };
}