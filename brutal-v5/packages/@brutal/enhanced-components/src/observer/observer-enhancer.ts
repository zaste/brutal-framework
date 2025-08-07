/**
 * Observer enhancers using composition pattern
 */

import type { BrutalComponent } from '@brutal/components';
import type { ComponentEnhancer } from '../compose.js';

/**
 * Enhancer for lazy loading when visible
 */
export function withLazyLoading(
  loadContent: () => void | Promise<void>,
  options: IntersectionObserverInit = {}
): ComponentEnhancer {
  return (Component: typeof BrutalComponent) => {
    return class extends Component {
      private observer?: IntersectionObserver;
      private hasLoaded = false;

      protected init(): void {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !this.hasLoaded) {
              this.hasLoaded = true;
              this.observer?.disconnect();
              
              const result = loadContent.call(this);
              if (result instanceof Promise) {
                result.catch(error => {
                  console.error('Lazy load failed:', error);
                  this.dispatchEvent(new CustomEvent('error', { detail: error }));
                });
              }
            }
          });
        }, options);

        this.observer.observe(this);
      }

      disconnectedCallback(): void {
        this.observer?.disconnect();
        super.disconnectedCallback?.();
      }
    };
  };
}

/**
 * Enhancer for visibility tracking
 */
export function withVisibilityTracking(
  threshold = 0.5
): ComponentEnhancer {
  return (Component: typeof BrutalComponent) => {
    return class extends Component {
      private observer?: IntersectionObserver;
      private visibilityStart?: number;
      private totalVisibleTime = 0;
      private isCurrentlyVisible = false;

      protected init(): void {
        this.observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            const wasVisible = this.isCurrentlyVisible;
            this.isCurrentlyVisible = entry.intersectionRatio >= threshold;

            if (this.isCurrentlyVisible && !wasVisible) {
              this.visibilityStart = Date.now();
              this.dispatchEvent(new CustomEvent('visible'));
            } else if (!this.isCurrentlyVisible && wasVisible && this.visibilityStart) {
              this.totalVisibleTime += Date.now() - this.visibilityStart;
              this.setAttribute('data-visible-time', this.totalVisibleTime.toString());
              this.dispatchEvent(new CustomEvent('hidden', {
                detail: { totalTime: this.totalVisibleTime }
              }));
            }
          });
        }, { threshold });

        this.observer.observe(this);
      }

      getVisibleTime(): number {
        let total = this.totalVisibleTime;
        if (this.isCurrentlyVisible && this.visibilityStart) {
          total += Date.now() - this.visibilityStart;
        }
        return total;
      }

      disconnectedCallback(): void {
        if (this.isCurrentlyVisible && this.visibilityStart) {
          this.totalVisibleTime += Date.now() - this.visibilityStart;
        }
        this.observer?.disconnect();
        super.disconnectedCallback?.();
      }
    };
  };
}