/**
 * BRUTAL Framework V3 - Performance Gem #2: FragmentPool
 * Pre-warmed DOM fragments for instant rendering
 */

export class FragmentPool {
  constructor(options = {}) {
    // Configuration
    this.maxSize = options.maxSize || 1000;
    this.warmupSize = options.warmupSize || 100;
    this.warmupDelay = options.warmupDelay || 1000;
    this.enableAutoWarmup = options.autoWarmup !== false;
    
    // Fragment pools
    this.availableFragments = [];
    this.inUseFragments = new WeakMap();
    
    // Template cache
    this.templateCache = new Map();
    
    // Performance metrics
    this._metrics = {
      created: 0,
      reused: 0,
      checkedOut: 0,
      checkedIn: 0,
      hits: 0,
      misses: 0,
      avgCheckoutTime: 0,
      totalCheckoutTime: 0
    };
    
    // Warmup state
    this._warmupScheduled = false;
    this._isWarming = false;
    
    // Start warmup if enabled
    if (this.enableAutoWarmup) {
      this.scheduleWarmup();
    }
  }
  
  /**
   * Check out a fragment from the pool
   */
  checkout(template) {
    const start = performance.now();
    
    let fragment;
    
    // Try to get from pool
    if (this.availableFragments.length > 0) {
      fragment = this.availableFragments.pop();
      this._metrics.reused++;
      this._metrics.hits++;
    } else {
      // Create new fragment
      fragment = document.createDocumentFragment();
      this._metrics.created++;
      this._metrics.misses++;
    }
    
    // Apply template if provided
    if (template) {
      this._applyTemplate(fragment, template);
    }
    
    // Track usage
    this.inUseFragments.set(fragment, {
      checkoutTime: Date.now(),
      template: template
    });
    
    // Update metrics
    this._metrics.checkedOut++;
    const checkoutTime = performance.now() - start;
    this._updateCheckoutMetrics(checkoutTime);
    
    return fragment;
  }
  
  /**
   * Return a fragment to the pool
   */
  checkin(fragment) {
    // Validate fragment
    if (!fragment || !(fragment instanceof DocumentFragment)) {
      return;
    }
    
    // Check if it was checked out
    if (!this.inUseFragments.has(fragment)) {
      return;
    }
    
    // Clear the fragment
    this._clearFragment(fragment);
    
    // Remove from in-use tracking
    this.inUseFragments.delete(fragment);
    
    // Return to pool if not at capacity
    if (this.availableFragments.length < this.maxSize) {
      this.availableFragments.push(fragment);
    } else {
      // Properly dispose of excess fragments
      fragment.remove();
      fragment = null;
    }
    
    this._metrics.checkedIn++;
  }
  
  /**
   * Pre-warm the pool with fragments
   */
  async warmup(count = this.warmupSize) {
    if (this._isWarming) return;
    
    this._isWarming = true;
    
    const batchSize = 10;
    const batches = Math.ceil(count / batchSize);
    
    for (let i = 0; i < batches; i++) {
      // Use requestIdleCallback for non-blocking warmup
      await new Promise(resolve => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            this._createFragmentBatch(batchSize);
            resolve();
          }, { timeout: 50 });
        } else {
          setTimeout(() => {
            this._createFragmentBatch(batchSize);
            resolve();
          }, 0);
        }
      });
    }
    
    this._isWarming = false;
    
    if (window.__BRUTAL__?.debug) {
      }
  }
  
  /**
   * Schedule automatic warmup
   */
  scheduleWarmup() {
    if (this._warmupScheduled) return;
    
    this._warmupScheduled = true;
    
    // Wait for idle time or timeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.warmup();
      }, { timeout: this.warmupDelay });
    } else {
      setTimeout(() => {
        this.warmup();
      }, this.warmupDelay);
    }
  }
  
  /**
   * Create a batch of fragments
   */
  _createFragmentBatch(count) {
    const toCreate = Math.min(
      count,
      this.maxSize - this.availableFragments.length
    );
    
    for (let i = 0; i < toCreate; i++) {
      const fragment = document.createDocumentFragment();
      this.availableFragments.push(fragment);
      this._metrics.created++;
    }
  }
  
  /**
   * Apply template to fragment
   */
  _applyTemplate(fragment, template) {
    if (typeof template === 'string') {
      // Check template cache
      let templateEl = this.templateCache.get(template);
      
      if (!templateEl) {
        // Create and cache template element
        templateEl = document.createElement('template');
        templateEl.innerHTML = template;
        this.templateCache.set(template, templateEl);
      }
      
      // Clone template content
      fragment.appendChild(templateEl.content.cloneNode(true));
    } else if (template instanceof HTMLTemplateElement) {
      fragment.appendChild(template.content.cloneNode(true));
    } else if (template instanceof Node) {
      fragment.appendChild(template.cloneNode(true));
    }
  }
  
  /**
   * Clear a fragment
   */
  _clearFragment(fragment) {
    // Remove all child nodes
    while (fragment.firstChild) {
      fragment.removeChild(fragment.firstChild);
    }
  }
  
  /**
   * Update checkout time metrics
   */
  _updateCheckoutMetrics(time) {
    this._metrics.totalCheckoutTime += time;
    this._metrics.avgCheckoutTime = 
      this._metrics.totalCheckoutTime / this._metrics.checkedOut;
  }
  
  /**
   * Get current pool size
   */
  getPoolSize() {
    return this.availableFragments.length;
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this._metrics,
      poolSize: this.availableFragments.length,
      reuseRate: this._metrics.checkedOut > 0
        ? this._metrics.reused / this._metrics.checkedOut
        : 0,
      hitRate: this._metrics.hits + this._metrics.misses > 0
        ? this._metrics.hits / (this._metrics.hits + this._metrics.misses)
        : 0
    };
  }
  
  /**
   * Clear the pool
   */
  clear() {
    this.availableFragments = [];
    this.templateCache.clear();
    this._metrics.checkedIn = 0;
    this._metrics.checkedOut = 0;
  }
  
  /**
   * Create a fragment with builder function
   */
  build(builderFn) {
    const fragment = this.checkout();
    
    try {
      builderFn(fragment);
      return fragment;
    } catch (error) {
      // Return fragment to pool on error
      this.checkin(fragment);
      throw error;
    }
  }
  
  /**
   * Batch create multiple fragments
   */
  batchCheckout(count, template) {
    const fragments = [];
    
    for (let i = 0; i < count; i++) {
      fragments.push(this.checkout(template));
    }
    
    return fragments;
  }
  
  /**
   * Batch return multiple fragments
   */
  batchCheckin(fragments) {
    for (const fragment of fragments) {
      this.checkin(fragment);
    }
  }
  
  /**
   * Auto-return fragments after use
   */
  withFragment(template, callback) {
    const fragment = this.checkout(template);
    
    try {
      const result = callback(fragment);
      
      // Handle async callbacks
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          this.checkin(fragment);
        });
      }
      
      this.checkin(fragment);
      return result;
      
    } catch (error) {
      this.checkin(fragment);
      throw error;
    }
  }
  
  /**
   * Optimize pool size based on usage
   */
  optimize() {
    const metrics = this.getMetrics();
    
    // If reuse rate is low, reduce pool size
    if (metrics.reuseRate < 0.5 && this.availableFragments.length > 50) {
      const toRemove = Math.floor(this.availableFragments.length * 0.25);
      this.availableFragments.splice(0, toRemove);
    }
    
    // If miss rate is high, increase warmup
    if (metrics.hitRate < 0.8) {
      this.warmup(Math.min(50, this.maxSize - this.availableFragments.length));
    }
  }
}

// Create global fragment pool
export const fragmentPool = new FragmentPool({
  maxSize: 1000,
  warmupSize: 100,
  autoWarmup: true
});

// Export convenience methods
export const checkoutFragment = fragmentPool.checkout.bind(fragmentPool);
export const checkinFragment = fragmentPool.checkin.bind(fragmentPool);
export const withFragment = fragmentPool.withFragment.bind(fragmentPool);