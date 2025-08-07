/**
 * Async component loader for BRUTAL
 * 
 * @deprecated Use withAsyncLoading enhancer instead
 */

import { BrutalComponent } from '@brutal/components';
import { withAsyncLoading } from './async-enhancer.js';

export interface AsyncComponentOptions {
  /** Component loader function */
  loader: () => Promise<typeof BrutalComponent>;
  /** Loading component to show while loading */
  loading?: typeof BrutalComponent;
  /** Error component to show on load failure */
  error?: typeof BrutalComponent;
  /** Loading delay before showing loading component (ms) */
  delay?: number;
  /** Timeout for loading (ms) */
  timeout?: number;
}

/**
 * Creates an async component that loads on demand
 * 
 * @deprecated Use withAsyncLoading enhancer instead
 */
export function createAsyncComponent(options: AsyncComponentOptions): typeof BrutalComponent {
  // Use the new enhancer internally for backward compatibility
  return withAsyncLoading(options)(BrutalComponent);
}

/**
 * Base class for async components
 * 
 * @deprecated Use withAsyncLoading enhancer instead
 */
export abstract class AsyncComponent extends BrutalComponent {
  private loadingState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
  private data: any = null;
  private error: Error | null = null;

  protected init(): void {
    this.loadingState = 'loading';
    this.render();
    this.startLoading();
  }

  private async startLoading(): Promise<void> {
    try {
      const result = this.loadData();
      
      // Check if it's an async generator
      if (result && typeof (result as any)[Symbol.asyncIterator] === 'function') {
        for await (const data of result as AsyncGenerator<any>) {
          this.data = data;
          this.loadingState = 'loaded';
          this.render();
        }
      } else {
        // It's a regular promise
        this.data = await result;
        this.loadingState = 'loaded';
        this.render();
      }
    } catch (err) {
      this.error = err as Error;
      this.loadingState = 'error';
      this.render();
    }
  }

  /**
   * Override to provide loading template
   */
  protected renderLoading(): string {
    return '<div class="loading">Loading...</div>';
  }

  /**
   * Override to provide error template
   */
  protected renderError(error: Error): string {
    return `<div class="error">Error: ${error.message}</div>`;
  }

  protected render(): void {
    switch (this.loadingState) {
      case 'loading':
        this.innerHTML = this.renderLoading();
        break;
      case 'loaded':
        this.innerHTML = this.renderContent(this.data);
        break;
      case 'error':
        this.innerHTML = this.renderError(this.error!);
        break;
    }
  }

  /**
   * Reload the component
   */
  async reload(): Promise<void> {
    this.loadingState = 'loading';
    this.error = null;
    this.data = null;
    this.render();
    await this.startLoading();
  }
  
  disconnectedCallback(): void {
    // Reset state for reconnection
    this.loadingState = 'idle';
    this.data = null;
    this.error = null;
    
    super.disconnectedCallback?.();
  }
  
  /**
   * Abstract method to load data
   */
  protected abstract loadData(): Promise<any> | AsyncGenerator<any>;
  
  /**
   * Abstract method to render content
   */
  protected abstract renderContent(data: any): string;
}