/**
 * Edge Cases and Error Boundaries Handler for Custom Elements
 * Based on Chromium custom_element_test.cc patterns and WPT edge case testing
 * 
 * Handles:
 * - Constructor exceptions
 * - Invalid attribute values
 * - Memory leaks prevention
 * - Rapid creation/destruction cycles
 * - Deep nesting scenarios
 * - Browser compatibility edge cases
 */

export class EdgeCaseHandler {
  static errors = new Map();
  static performanceMetrics = new Map();

  /**
   * Safe Custom Element base class with error boundaries
   */
  static createSafeCustomElement(ElementClass, elementName) {
    class SafeCustomElement extends HTMLElement {
      constructor() {
        try {
          super();
          this._isValid = true;
          this._errorCount = 0;
          this._createdAt = Date.now();
          
          // Apply original constructor if provided
          if (ElementClass && ElementClass.prototype.constructor !== HTMLElement) {
            ElementClass.prototype.constructor.call(this);
          }
        } catch (error) {
          this._isValid = false;
          this._errorCount++;
          EdgeCaseHandler.logError(elementName, 'constructor', error);
        }
      }

      connectedCallback() {
        try {
          if (ElementClass && ElementClass.prototype.connectedCallback) {
            ElementClass.prototype.connectedCallback.call(this);
          }
          this._connectedAt = Date.now();
        } catch (error) {
          this._errorCount++;
          EdgeCaseHandler.logError(elementName, 'connectedCallback', error);
        }
      }

      disconnectedCallback() {
        try {
          if (ElementClass && ElementClass.prototype.disconnectedCallback) {
            ElementClass.prototype.disconnectedCallback.call(this);
          }
          this._disconnectedAt = Date.now();
          this._cleanup();
        } catch (error) {
          this._errorCount++;
          EdgeCaseHandler.logError(elementName, 'disconnectedCallback', error);
        }
      }

      attributeChangedCallback(name, oldValue, newValue) {
        try {
          // Validate attribute values
          const validatedValue = this._validateAttribute(name, newValue);
          
          if (ElementClass && ElementClass.prototype.attributeChangedCallback) {
            ElementClass.prototype.attributeChangedCallback.call(this, name, oldValue, validatedValue);
          }
        } catch (error) {
          this._errorCount++;
          EdgeCaseHandler.logError(elementName, 'attributeChangedCallback', error);
        }
      }

      adoptedCallback() {
        try {
          if (ElementClass && ElementClass.prototype.adoptedCallback) {
            ElementClass.prototype.adoptedCallback.call(this);
          }
        } catch (error) {
          this._errorCount++;
          EdgeCaseHandler.logError(elementName, 'adoptedCallback', error);
        }
      }

      /**
       * Validate and sanitize attribute values
       */
      _validateAttribute(name, value) {
        // Handle null/undefined
        if (value == null) {
          return '';
        }

        // Convert to string safely
        if (typeof value === 'object') {
          try {
            return JSON.stringify(value);
          } catch {
            return '[object Object]';
          }
        }

        return String(value);
      }

      /**
       * Cleanup resources to prevent memory leaks
       */
      _cleanup() {
        // Clear any timers
        if (this._timers) {
          this._timers.forEach(timer => clearTimeout(timer));
          this._timers.clear();
        }

        // Clear event listeners
        if (this._eventListeners) {
          this._eventListeners.forEach(({ target, event, handler }) => {
            target.removeEventListener(event, handler);
          });
          this._eventListeners.clear();
        }

        // Clear observers
        if (this._observers) {
          this._observers.forEach(observer => observer.disconnect());
          this._observers.clear();
        }
      }

      /**
       * Safe timer creation with automatic cleanup
       */
      safeSetTimeout(callback, delay) {
        if (!this._timers) this._timers = new Set();
        
        const timer = setTimeout(() => {
          try {
            callback();
          } catch (error) {
            EdgeCaseHandler.logError(elementName, 'timer', error);
          } finally {
            this._timers.delete(timer);
          }
        }, delay);
        
        this._timers.add(timer);
        return timer;
      }

      /**
       * Safe event listener with automatic cleanup
       */
      safeAddEventListener(target, event, handler, options) {
        if (!this._eventListeners) this._eventListeners = new Set();
        
        const safeHandler = (e) => {
          try {
            handler(e);
          } catch (error) {
            EdgeCaseHandler.logError(elementName, 'eventHandler', error);
          }
        };
        
        target.addEventListener(event, safeHandler, options);
        this._eventListeners.add({ target, event, handler: safeHandler });
      }

      /**
       * Get error count for debugging
       */
      getErrorCount() {
        return this._errorCount;
      }

      /**
       * Check if element is in valid state
       */
      isValid() {
        return this._isValid;
      }
    }

    return SafeCustomElement;
  }

  /**
   * Log errors with context and frequency tracking
   */
  static logError(elementName, phase, error) {
    const key = `${elementName}:${phase}`;
    
    if (!this.errors.has(key)) {
      this.errors.set(key, {
        count: 0,
        firstOccurrence: Date.now(),
        lastOccurrence: Date.now(),
        samples: []
      });
    }

    const errorData = this.errors.get(key);
    errorData.count++;
    errorData.lastOccurrence = Date.now();
    
    // Keep only last 5 error samples to prevent memory leaks
    if (errorData.samples.length >= 5) {
      errorData.samples.shift();
    }
    
    errorData.samples.push({
      message: error.message,
      stack: error.stack,
      timestamp: Date.now()
    });

    // Only log to console if error frequency is reasonable
    if (errorData.count <= 10 || errorData.count % 100 === 0) {
      console.error(`[EdgeCaseHandler] ${elementName} ${phase}:`, error.message);
    }
  }

  /**
   * Handle rapid creation/destruction cycles
   */
  static createRateLimitedElement(ElementClass, elementName, maxCreationsPerSecond = 1000) {
    const creationTimes = [];
    
    return class RateLimitedElement extends this.createSafeCustomElement(ElementClass, elementName) {
      constructor() {
        const now = Date.now();
        
        // Clean old timestamps (older than 1 second)
        while (creationTimes.length > 0 && creationTimes[0] < now - 1000) {
          creationTimes.shift();
        }
        
        // Check rate limit
        if (creationTimes.length >= maxCreationsPerSecond) {
          console.warn(`[EdgeCaseHandler] Rate limit exceeded for ${elementName}: ${creationTimes.length} creations in last second`);
        }
        
        creationTimes.push(now);
        super();
      }
    };
  }

  /**
   * Handle deep nesting with depth limits
   */
  static createDepthLimitedElement(ElementClass, elementName, maxDepth = 100) {
    return class DepthLimitedElement extends this.createSafeCustomElement(ElementClass, elementName) {
      connectedCallback() {
        this._calculateDepth();
        
        if (this._depth > maxDepth) {
          console.warn(`[EdgeCaseHandler] Maximum nesting depth exceeded for ${elementName}: ${this._depth}`);
          return;
        }
        
        super.connectedCallback();
      }

      _calculateDepth() {
        let depth = 0;
        let parent = this.parentElement;
        
        while (parent && depth < maxDepth + 10) { // +10 safety margin
          if (parent.tagName === this.tagName) {
            depth++;
          }
          parent = parent.parentElement;
        }
        
        this._depth = depth;
      }

      getDepth() {
        return this._depth || 0;
      }
    };
  }

  /**
   * Memory leak detection and prevention
   */
  static trackMemoryUsage(elementName) {
    if (!this.performanceMetrics.has(elementName)) {
      this.performanceMetrics.set(elementName, {
        createdCount: 0,
        connectedCount: 0,
        disconnectedCount: 0,
        memorySnapshots: []
      });
    }

    const metrics = this.performanceMetrics.get(elementName);
    
    return {
      onCreate: () => {
        metrics.createdCount++;
        if (typeof performance !== 'undefined' && performance.memory) {
          metrics.memorySnapshots.push({
            type: 'create',
            timestamp: Date.now(),
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize
          });
          
          // Keep only last 100 snapshots
          if (metrics.memorySnapshots.length > 100) {
            metrics.memorySnapshots.shift();
          }
        }
      },
      
      onConnect: () => {
        metrics.connectedCount++;
      },
      
      onDisconnect: () => {
        metrics.disconnectedCount++;
      },
      
      getMetrics: () => ({ ...metrics })
    };
  }

  /**
   * Browser compatibility helpers
   */
  static getBrowserCompatibility() {
    const checks = {
      customElements: typeof customElements !== 'undefined',
      shadowDOM: typeof ShadowRoot !== 'undefined',
      templates: typeof HTMLTemplateElement !== 'undefined',
      es6Classes: (() => {
        try {
          eval('class Test {}');
          return true;
        } catch {
          return false;
        }
      })(),
      observedAttributes: (() => {
        try {
          class Test extends HTMLElement {
            static get observedAttributes() { return []; }
          }
          return true;
        } catch {
          return false;
        }
      })()
    };

    return checks;
  }

  /**
   * Safe custom element registration with fallbacks
   */
  static safeDefine(name, ElementClass, options = {}) {
    try {
      // Check if already defined
      if (customElements.get(name)) {
        console.warn(`[EdgeCaseHandler] Element ${name} already defined, skipping registration`);
        return false;
      }

      // Validate name
      if (!name.includes('-')) {
        throw new Error(`Invalid custom element name: ${name}. Must contain a hyphen.`);
      }

      // Create safe wrapper
      const SafeElementClass = this.createSafeCustomElement(ElementClass, name);
      
      // Register with error handling
      customElements.define(name, SafeElementClass, options);
      
      console.log(`[EdgeCaseHandler] Successfully registered ${name}`);
      return true;
    } catch (error) {
      this.logError(name, 'registration', error);
      return false;
    }
  }

  /**
   * Get error summary for debugging
   */
  static getErrorSummary() {
    const summary = {};
    
    for (const [key, data] of this.errors.entries()) {
      summary[key] = {
        count: data.count,
        firstOccurrence: new Date(data.firstOccurrence).toISOString(),
        lastOccurrence: new Date(data.lastOccurrence).toISOString(),
        latestError: data.samples[data.samples.length - 1]?.message
      };
    }
    
    return summary;
  }

  /**
   * Get performance metrics summary
   */
  static getPerformanceMetrics() {
    const summary = {};
    
    for (const [elementName, metrics] of this.performanceMetrics.entries()) {
      summary[elementName] = {
        ...metrics,
        memorySnapshots: metrics.memorySnapshots.length
      };
    }
    
    return summary;
  }

  /**
   * Clear all tracking data (useful for testing)
   */
  static clearTracking() {
    this.errors.clear();
    this.performanceMetrics.clear();
  }
}

// Export commonly used patterns
export const SafeCustomElement = EdgeCaseHandler.createSafeCustomElement;
export const RateLimitedElement = EdgeCaseHandler.createRateLimitedElement;
export const DepthLimitedElement = EdgeCaseHandler.createDepthLimitedElement;