/**
 * Observer-enhanced components for BRUTAL
 * 
 * @deprecated Consider using withLazyLoading and withVisibilityTracking enhancers for new code
 */

import { BrutalComponent } from '@brutal/components';

export interface ObserverOptions {
  /** Intersection observer options */
  intersection?: IntersectionObserverInit;
  /** Resize observer options */
  resize?: ResizeObserverOptions;
  /** Mutation observer options */
  mutation?: MutationObserverInit;
  /** Performance observer options */
  performance?: PerformanceObserverInit;
}

/**
 * Component with built-in observer support
 */
export class ObserverComponent extends BrutalComponent {
  protected intersectionObserver?: IntersectionObserver;
  protected resizeObserver?: ResizeObserver;
  protected mutationObserver?: MutationObserver;
  protected performanceObserver?: PerformanceObserver;
  
  protected observerOptions: ObserverOptions = {};

  protected init(): void {
    this.setupObservers();
  }

  protected setupObservers(): void {
    // Set up intersection observer if requested
    if (this.observerOptions.intersection !== undefined) {
      this.setupIntersectionObserver();
    }
    
    // Set up resize observer if requested
    if (this.observerOptions.resize !== undefined) {
      this.setupResizeObserver();
    }
    
    // Set up mutation observer if requested
    if (this.observerOptions.mutation !== undefined) {
      this.setupMutationObserver();
    }
    
    // Set up performance observer if requested
    if (this.observerOptions.performance !== undefined) {
      this.setupPerformanceObserver();
    }
  }

  private setupIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => this.onIntersection(entries),
      this.observerOptions.intersection
    );
    
    this.intersectionObserver.observe(this);
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(
      (entries) => this.onResize(entries)
    );
    
    this.resizeObserver.observe(this, this.observerOptions.resize);
  }

  private setupMutationObserver(): void {
    this.mutationObserver = new MutationObserver(
      (mutations) => this.onMutation(mutations)
    );
    
    this.mutationObserver.observe(this, this.observerOptions.mutation);
  }

  private setupPerformanceObserver(): void {
    this.performanceObserver = new PerformanceObserver(
      (list) => this.onPerformance(list)
    );
    
    this.performanceObserver.observe(this.observerOptions.performance!);
  }

  /**
   * Called when intersection changes
   */
  protected onIntersection(entries: IntersectionObserverEntry[]): void {
    // Override in subclass
  }

  /**
   * Called when size changes
   */
  protected onResize(entries: ResizeObserverEntry[]): void {
    // Override in subclass
  }

  /**
   * Called when mutations occur
   */
  protected onMutation(mutations: MutationRecord[]): void {
    // Override in subclass
  }

  /**
   * Called when performance entries are recorded
   */
  protected onPerformance(list: PerformanceObserverEntryList): void {
    // Override in subclass
  }

  /**
   * Check if element is currently intersecting
   */
  isIntersecting(): boolean {
    if (!this.intersectionObserver) return false;
    
    let intersecting = false;
    this.intersectionObserver.takeRecords().forEach(entry => {
      if (entry.target === this) {
        intersecting = entry.isIntersecting;
      }
    });
    
    return intersecting;
  }

  /**
   * Get current size from resize observer
   */
  getObservedSize(): { width: number; height: number } | null {
    if (!this.resizeObserver) return null;
    
    const entries = this.resizeObserver.takeRecords();
    const entry = entries.find(e => e.target === this);
    
    if (entry && entry.contentRect) {
      return {
        width: entry.contentRect.width,
        height: entry.contentRect.height
      };
    }
    
    return null;
  }

  disconnectedCallback(): void {
    // Clean up observers
    this.intersectionObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    this.performanceObserver?.disconnect();
    
    super.disconnectedCallback?.();
  }
}

/**
 * Lazy loading component using intersection observer
 */
export class LazyComponent extends ObserverComponent {
  private loaded = false;
  private loadThreshold = 0.1;
  private loadRootMargin = '50px';
  
  protected observerOptions: ObserverOptions = {
    intersection: {
      threshold: this.loadThreshold,
      rootMargin: this.loadRootMargin
    }
  };

  protected init(): void {
    super.init();
    
    // Check attributes
    const threshold = this.getAttribute('load-threshold');
    if (threshold) {
      this.loadThreshold = parseFloat(threshold);
    }
    
    const rootMargin = this.getAttribute('load-margin');
    if (rootMargin) {
      this.loadRootMargin = rootMargin;
    }
    
    // Show placeholder
    this.renderPlaceholder();
  }

  protected onIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting && !this.loaded) {
        this.load();
      }
    });
  }

  private async load(): Promise<void> {
    this.loaded = true;
    
    // Stop observing once loaded
    this.intersectionObserver?.unobserve(this);
    
    try {
      await this.loadContent();
      this.render();
    } catch (error) {
      this.renderError(error);
    }
  }

  /**
   * Override to implement content loading
   */
  protected async loadContent(): Promise<void> {
    // Override in subclass
  }

  /**
   * Render placeholder while not loaded
   */
  protected renderPlaceholder(): void {
    this.innerHTML = '<div class="lazy-placeholder">Loading...</div>';
  }

  /**
   * Render error state
   */
  protected renderError(error: unknown): void {
    this.innerHTML = `<div class="lazy-error">Failed to load: ${error}</div>`;
  }

  protected render(): void {
    // Override to render loaded content
  }
}

/**
 * Component that tracks visibility time
 */
export class VisibilityTracker extends ObserverComponent {
  private visibleTime = 0;
  private lastVisibleTimestamp = 0;
  private visibilityTimer?: number;
  
  protected observerOptions: ObserverOptions = {
    intersection: {
      threshold: [0, 0.5, 1.0]
    }
  };

  protected onIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        this.startTracking();
      } else {
        this.stopTracking();
      }
    });
  }

  private startTracking(): void {
    if (this.lastVisibleTimestamp === 0) {
      this.lastVisibleTimestamp = Date.now();
      
      this.visibilityTimer = window.setInterval(() => {
        this.visibleTime = Date.now() - this.lastVisibleTimestamp;
        this.onVisibilityUpdate(this.visibleTime);
      }, 100);
    }
  }

  private stopTracking(): void {
    if (this.lastVisibleTimestamp > 0) {
      this.visibleTime += Date.now() - this.lastVisibleTimestamp;
      this.lastVisibleTimestamp = 0;
      
      if (this.visibilityTimer) {
        clearInterval(this.visibilityTimer);
        this.visibilityTimer = undefined;
      }
      
      this.onVisibilityEnd(this.visibleTime);
    }
  }

  /**
   * Called periodically while visible
   */
  protected onVisibilityUpdate(timeVisible: number): void {
    // Override in subclass
  }

  /**
   * Called when element becomes not visible
   */
  protected onVisibilityEnd(totalTimeVisible: number): void {
    // Override in subclass
  }

  /**
   * Get total time visible
   */
  getVisibleTime(): number {
    if (this.lastVisibleTimestamp > 0) {
      return this.visibleTime + (Date.now() - this.lastVisibleTimestamp);
    }
    return this.visibleTime;
  }

  disconnectedCallback(): void {
    this.stopTracking();
    super.disconnectedCallback();
  }
}