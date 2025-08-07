/**
 * Event Handling Optimization Framework for Shadow DOM
 * Week 2 Day 8: Cross-boundary event performance optimization
 * Based on Chromium event handling patterns and performance analysis
 */

class EventHandlingOptimizer {
  static eventCache = new Map();
  static delegationMap = new Map();
  static crossBoundaryHandlers = new Map();
  
  // Performance metrics tracking
  static metrics = {
    eventBinding: [],
    eventDispatching: [],
    crossBoundary: [],
    delegation: []
  };

  /**
   * Optimize event handling across Shadow DOM boundaries
   * Based on Chromium event path optimization patterns
   */
  static optimizeCrossBoundaryEvents(shadowRoot, eventConfig = {}) {
    const startTime = performance.now();
    
    const config = {
      delegation: true,
      capture: false,
      passive: true,
      once: false,
      preventBubbling: false,
      ...eventConfig
    };

    // Set up optimized event delegation
    if (config.delegation) {
      this._setupEventDelegation(shadowRoot, config);
    }

    // Configure cross-boundary event handling
    this._configureCrossBoundaryHandling(shadowRoot, config);
    
    const endTime = performance.now();
    this.metrics.eventBinding.push(endTime - startTime);
    
    return {
      shadowRoot,
      config,
      boundaryId: this._generateBoundaryId(shadowRoot)
    };
  }

  /**
   * Create optimized custom events for component communication
   */
  static createOptimizedCustomEvent(type, detail = null, options = {}) {
    const startTime = performance.now();
    
    const config = {
      bubbles: true,
      composed: true,
      cancelable: false,
      ...options
    };

    // Use cached event constructor if available
    const cacheKey = `${type}-${JSON.stringify(config)}`;
    if (this.eventCache.has(cacheKey)) {
      const cachedEvent = this.eventCache.get(cacheKey);
      const event = new CustomEvent(type, { ...config, detail });
      
      const endTime = performance.now();
      this.metrics.eventDispatching.push(endTime - startTime);
      return event;
    }

    // Create and cache event configuration
    const event = new CustomEvent(type, { ...config, detail });
    this.eventCache.set(cacheKey, { type, config });
    
    const endTime = performance.now();
    this.metrics.eventDispatching.push(endTime - startTime);
    
    return event;
  }

  /**
   * Optimized event delegation for better performance
   */
  static addDelegatedEventListener(shadowRoot, eventType, selector, handler, options = {}) {
    const startTime = performance.now();
    
    const config = {
      passive: true,
      capture: false,
      ...options
    };

    const delegationKey = `${eventType}-${selector}`;
    
    if (!this.delegationMap.has(delegationKey)) {
      // Create delegated handler
      const delegatedHandler = (event) => {
        const target = event.target.closest(selector);
        if (target && shadowRoot.contains(target)) {
          handler.call(target, event);
        }
      };

      shadowRoot.addEventListener(eventType, delegatedHandler, config);
      this.delegationMap.set(delegationKey, {
        handler: delegatedHandler,
        shadowRoot,
        handlers: [handler]
      });
    } else {
      // Add to existing delegation
      const delegation = this.delegationMap.get(delegationKey);
      delegation.handlers.push(handler);
    }
    
    const endTime = performance.now();
    this.metrics.delegation.push(endTime - startTime);
    
    return delegationKey;
  }

  /**
   * Remove delegated event listener
   */
  static removeDelegatedEventListener(delegationKey, handler) {
    if (this.delegationMap.has(delegationKey)) {
      const delegation = this.delegationMap.get(delegationKey);
      const index = delegation.handlers.indexOf(handler);
      
      if (index > -1) {
        delegation.handlers.splice(index, 1);
        
        // Clean up if no handlers left
        if (delegation.handlers.length === 0) {
          delegation.shadowRoot.removeEventListener(
            delegationKey.split('-')[0], 
            delegation.handler
          );
          this.delegationMap.delete(delegationKey);
        }
      }
    }
  }

  /**
   * Fast event communication between components
   */
  static createEventBridge(sourceElement, targetElement, eventType) {
    const startTime = performance.now();
    
    const bridgeId = `bridge-${Date.now()}-${Math.random()}`;
    
    const bridgeHandler = (event) => {
      const bridgedEvent = this.createOptimizedCustomEvent(
        `bridge:${eventType}`,
        { 
          originalEvent: event,
          sourceElement,
          bridgeId 
        },
        { 
          bubbles: false, 
          composed: false 
        }
      );
      
      targetElement.dispatchEvent(bridgedEvent);
    };

    sourceElement.addEventListener(eventType, bridgeHandler, { passive: true });
    
    const endTime = performance.now();
    this.metrics.crossBoundary.push(endTime - startTime);
    
    return {
      bridgeId,
      destroy: () => {
        sourceElement.removeEventListener(eventType, bridgeHandler);
      }
    };
  }

  /**
   * Optimize focus management across Shadow DOM boundaries
   */
  static optimizeFocusManagement(shadowRoot, options = {}) {
    const config = {
      trapFocus: false,
      restoreFocus: true,
      skipHidden: true,
      ...options
    };

    // Fast focus navigation
    const focusableSelector = 'input, button, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    if (config.trapFocus) {
      this._setupFocusTrap(shadowRoot, focusableSelector);
    }

    // Optimized focus delegation
    const focusHandler = (event) => {
      if (config.skipHidden) {
        const focusable = shadowRoot.querySelectorAll(focusableSelector);
        for (const element of focusable) {
          const style = getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden') {
            continue;
          }
          element.focus();
          break;
        }
      }
    };

    shadowRoot.host.addEventListener('focus', focusHandler, { passive: true });
    
    return {
      destroy: () => {
        shadowRoot.host.removeEventListener('focus', focusHandler);
      }
    };
  }

  /**
   * Performance metrics collection
   */
  static getPerformanceMetrics() {
    const calculateStats = (values) => {
      if (values.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };
      
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      return { avg, min, max, count: values.length };
    };

    return {
      eventBinding: calculateStats(this.metrics.eventBinding),
      eventDispatching: calculateStats(this.metrics.eventDispatching),
      crossBoundary: calculateStats(this.metrics.crossBoundary),
      delegation: calculateStats(this.metrics.delegation),
      cacheEfficiency: {
        events: this.eventCache.size,
        delegations: this.delegationMap.size,
        crossBoundaryHandlers: this.crossBoundaryHandlers.size
      }
    };
  }

  // Private optimization methods

  static _setupEventDelegation(shadowRoot, config) {
    // Common event types for delegation
    const commonEvents = ['click', 'input', 'change', 'submit'];
    
    commonEvents.forEach(eventType => {
      const delegatedHandler = (event) => {
        // Fast event processing without excessive DOM traversal
        this._processDelegatedEvent(event, shadowRoot);
      };
      
      shadowRoot.addEventListener(eventType, delegatedHandler, {
        passive: config.passive,
        capture: config.capture
      });
    });
  }

  static _configureCrossBoundaryHandling(shadowRoot, config) {
    const boundaryId = this._generateBoundaryId(shadowRoot);
    
    // Set up retargeting for cross-boundary events
    const retargetHandler = (event) => {
      if (event.composed && config.preventBubbling) {
        event.stopPropagation();
      }
    };

    shadowRoot.addEventListener('*', retargetHandler, { 
      capture: true,
      passive: true 
    });
    
    this.crossBoundaryHandlers.set(boundaryId, retargetHandler);
  }

  static _processDelegatedEvent(event, shadowRoot) {
    // Fast event processing without complex delegation lookup
    const target = event.target;
    if (shadowRoot.contains(target)) {
      // Event is within our shadow boundary, process normally
      return true;
    }
    return false;
  }

  static _generateBoundaryId(shadowRoot) {
    return `boundary-${shadowRoot.host.tagName}-${Date.now()}`;
  }

  static _setupFocusTrap(shadowRoot, focusableSelector) {
    const focusableElements = shadowRoot.querySelectorAll(focusableSelector);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const trapHandler = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            event.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            event.preventDefault();
          }
        }
      }
    };

    shadowRoot.addEventListener('keydown', trapHandler);
    return trapHandler;
  }

  /**
   * Reset all caches and metrics (useful for testing)
   */
  static reset() {
    this.eventCache.clear();
    this.delegationMap.clear();
    this.crossBoundaryHandlers.clear();
    
    this.metrics = {
      eventBinding: [],
      eventDispatching: [],
      crossBoundary: [],
      delegation: []
    };
  }
}

/**
 * Enhanced Shadow Element with optimized event handling
 */
class EventOptimizedShadowElement extends HTMLElement {
  constructor() {
    super();
    this._shadowRoot = null;
    this._eventBridges = [];
    this._focusManager = null;
  }

  createEventOptimizedShadow(config = {}) {
    if (this._shadowRoot) {
      return this._shadowRoot;
    }
    
    this._shadowRoot = this.attachShadow({
      mode: 'open',
      delegatesFocus: true,
      ...config
    });
    
    // Set up optimized event handling
    EventHandlingOptimizer.optimizeCrossBoundaryEvents(this._shadowRoot);
    
    return this._shadowRoot;
  }

  addOptimizedEventListener(eventType, selector, handler, options = {}) {
    if (!this._shadowRoot) {
      throw new Error('Shadow root must be created first');
    }
    
    return EventHandlingOptimizer.addDelegatedEventListener(
      this._shadowRoot, 
      eventType, 
      selector, 
      handler, 
      options
    );
  }

  createEventBridge(targetElement, eventType) {
    const bridge = EventHandlingOptimizer.createEventBridge(
      this, 
      targetElement, 
      eventType
    );
    
    this._eventBridges.push(bridge);
    return bridge;
  }

  setupFocusManagement(options = {}) {
    if (!this._shadowRoot) {
      throw new Error('Shadow root must be created first');
    }
    
    this._focusManager = EventHandlingOptimizer.optimizeFocusManagement(
      this._shadowRoot, 
      options
    );
    
    return this._focusManager;
  }

  disconnectedCallback() {
    // Cleanup event bridges
    this._eventBridges.forEach(bridge => bridge.destroy());
    this._eventBridges = [];
    
    // Cleanup focus manager
    if (this._focusManager) {
      this._focusManager.destroy();
      this._focusManager = null;
    }
  }

  getEventMetrics() {
    return EventHandlingOptimizer.getPerformanceMetrics();
  }
}

// Convenience functions
const optimizeEvents = EventHandlingOptimizer.optimizeCrossBoundaryEvents.bind(EventHandlingOptimizer);
const createCustomEvent = EventHandlingOptimizer.createOptimizedCustomEvent.bind(EventHandlingOptimizer);
const getEventMetrics = EventHandlingOptimizer.getPerformanceMetrics.bind(EventHandlingOptimizer);

module.exports = {
  EventHandlingOptimizer,
  EventOptimizedShadowElement,
  optimizeEvents,
  createCustomEvent,
  getEventMetrics
};