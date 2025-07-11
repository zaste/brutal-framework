/**
 * BRUTAL Framework V3 - Performance Gem #5: EventManager
 * Single listener with delegation for optimal performance
 */

export class EventManager {
  constructor(options = {}) {
    // Configuration
    this.root = options.root || document.body;
    this.passive = options.passive !== false;
    this.capture = options.capture || false;
    
    // Event registry
    this.handlers = new Map(); // eventType -> Map(selector -> handlers[])
    this.globalHandlers = new Map(); // eventType -> handlers[]
    this.activeListeners = new Set();
    
    // Delegation cache
    this.matchCache = new WeakMap(); // element -> Map(selector -> boolean)
    
    // Performance optimization
    this.delegatedEvents = new Set([
      'click', 'dblclick', 'mousedown', 'mouseup', 'mousemove',
      'mouseenter', 'mouseleave', 'mouseover', 'mouseout',
      'keydown', 'keyup', 'keypress',
      'focus', 'blur', 'change', 'input', 'submit',
      'touchstart', 'touchend', 'touchmove'
    ]);
    
    // Performance metrics
    this._metrics = {
      eventsHandled: 0,
      handlersInvoked: 0,
      totalHandleTime: 0,
      avgHandleTime: 0,
      delegatedListeners: 0,
      directListeners: 0
    };
    
    // Bind methods
    this._handleEvent = this._handleEvent.bind(this);
  }
  
  /**
   * Add event listener with delegation
   */
  on(eventType, selectorOrHandler, handler) {
    let selector = null;
    
    // Handle overloaded arguments
    if (typeof selectorOrHandler === 'function') {
      handler = selectorOrHandler;
    } else {
      selector = selectorOrHandler;
    }
    
    if (!handler || typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    
    // Initialize event type in registry
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Map());
    }
    
    const eventHandlers = this.handlers.get(eventType);
    
    if (selector) {
      // Delegated handler
      if (!eventHandlers.has(selector)) {
        eventHandlers.set(selector, []);
      }
      eventHandlers.get(selector).push(handler);
    } else {
      // Global handler
      if (!this.globalHandlers.has(eventType)) {
        this.globalHandlers.set(eventType, []);
      }
      this.globalHandlers.get(eventType).push(handler);
    }
    
    // Add listener if needed
    this._ensureListener(eventType);
    
    // Return function to remove this specific handler
    return () => this.off(eventType, selector, handler);
  }
  
  /**
   * Remove event listener
   */
  off(eventType, selectorOrHandler, handler) {
    // Handle overloaded arguments
    let selector = null;
    if (typeof selectorOrHandler === 'function') {
      handler = selectorOrHandler;
    } else {
      selector = selectorOrHandler;
    }
    
    if (selector && this.handlers.has(eventType)) {
      const eventHandlers = this.handlers.get(eventType);
      const selectorHandlers = eventHandlers.get(selector);
      
      if (selectorHandlers) {
        if (handler) {
          // Remove specific handler
          const index = selectorHandlers.indexOf(handler);
          if (index !== -1) {
            selectorHandlers.splice(index, 1);
          }
          
          // Clean up empty arrays
          if (selectorHandlers.length === 0) {
            eventHandlers.delete(selector);
          }
        } else {
          // Remove all handlers for selector
          eventHandlers.delete(selector);
        }
      }
    } else if (!selector && this.globalHandlers.has(eventType)) {
      const globalHandlers = this.globalHandlers.get(eventType);
      
      if (handler) {
        // Remove specific global handler
        const index = globalHandlers.indexOf(handler);
        if (index !== -1) {
          globalHandlers.splice(index, 1);
        }
      } else {
        // Remove all global handlers
        this.globalHandlers.delete(eventType);
      }
    }
    
    // Remove listener if no handlers remain
    this._cleanupListener(eventType);
  }
  
  /**
   * Add one-time event listener
   */
  once(eventType, selector, handler) {
    const wrappedHandler = (...args) => {
      this.off(eventType, selector, wrappedHandler);
      return handler(...args);
    };
    
    return this.on(eventType, selector, wrappedHandler);
  }
  
  /**
   * Emit custom event
   */
  emit(eventType, detail, target = this.root) {
    const event = new CustomEvent(eventType, {
      detail,
      bubbles: true,
      cancelable: true,
      composed: true
    });
    
    target.dispatchEvent(event);
  }
  
  /**
   * Ensure listener is attached
   */
  _ensureListener(eventType) {
    if (this.activeListeners.has(eventType)) return;
    
    const options = this.delegatedEvents.has(eventType)
      ? { passive: this.passive, capture: this.capture }
      : { passive: false, capture: this.capture };
    
    this.root.addEventListener(eventType, this._handleEvent, options);
    this.activeListeners.add(eventType);
    
    if (this.delegatedEvents.has(eventType)) {
      this._metrics.delegatedListeners++;
    } else {
      this._metrics.directListeners++;
    }
  }
  
  /**
   * Clean up listener if no handlers
   */
  _cleanupListener(eventType) {
    const hasHandlers = this.handlers.has(eventType) && 
                       this.handlers.get(eventType).size > 0;
    const hasGlobalHandlers = this.globalHandlers.has(eventType) &&
                             this.globalHandlers.get(eventType).length > 0;
    
    if (!hasHandlers && !hasGlobalHandlers && this.activeListeners.has(eventType)) {
      this.root.removeEventListener(eventType, this._handleEvent);
      this.activeListeners.delete(eventType);
      
      if (this.delegatedEvents.has(eventType)) {
        this._metrics.delegatedListeners--;
      } else {
        this._metrics.directListeners--;
      }
    }
  }
  
  /**
   * Handle delegated event
   */
  _handleEvent(event) {
    const start = performance.now();
    const eventType = event.type;
    let handlersInvoked = 0;
    
    // Process global handlers first
    if (this.globalHandlers.has(eventType)) {
      const handlers = this.globalHandlers.get(eventType);
      for (const handler of handlers) {
        handler.call(this.root, event);
        handlersInvoked++;
        
        if (event.cancelBubble) break;
      }
    }
    
    // Process delegated handlers
    if (this.handlers.has(eventType)) {
      const eventHandlers = this.handlers.get(eventType);
      
      // Walk up the DOM tree
      let element = event.target;
      
      while (element && element !== this.root.parentElement) {
        // Check each selector
        for (const [selector, handlers] of eventHandlers) {
          if (this._matches(element, selector)) {
            for (const handler of handlers) {
              // Call handler with correct context
              handler.call(element, event);
              handlersInvoked++;
              
              if (event.cancelBubble) break;
            }
          }
          
          if (event.cancelBubble) break;
        }
        
        if (event.cancelBubble) break;
        element = element.parentElement;
      }
    }
    
    // Update metrics
    const handleTime = performance.now() - start;
    this._metrics.eventsHandled++;
    this._metrics.handlersInvoked += handlersInvoked;
    this._metrics.totalHandleTime += handleTime;
    this._metrics.avgHandleTime = 
      this._metrics.totalHandleTime / this._metrics.eventsHandled;
  }
  
  /**
   * Check if element matches selector
   */
  _matches(element, selector) {
    // Check cache first
    if (!this.matchCache.has(element)) {
      this.matchCache.set(element, new Map());
    }
    
    const elementCache = this.matchCache.get(element);
    
    if (elementCache.has(selector)) {
      return elementCache.get(selector);
    }
    
    // Compute match
    const matches = element.matches(selector);
    elementCache.set(selector, matches);
    
    return matches;
  }
  
  /**
   * Clear match cache (call on DOM updates)
   */
  clearMatchCache() {
    this.matchCache = new WeakMap();
  }
  
  /**
   * Destroy all listeners
   */
  destroy() {
    // Remove all listeners
    for (const eventType of this.activeListeners) {
      this.root.removeEventListener(eventType, this._handleEvent);
    }
    
    // Clear registries
    this.handlers.clear();
    this.globalHandlers.clear();
    this.activeListeners.clear();
    this.clearMatchCache();
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this._metrics,
      activeListeners: this.activeListeners.size,
      registeredHandlers: this._countHandlers()
    };
  }
  
  /**
   * Count total registered handlers
   */
  _countHandlers() {
    let count = 0;
    
    // Count delegated handlers
    for (const eventHandlers of this.handlers.values()) {
      for (const handlers of eventHandlers.values()) {
        count += handlers.length;
      }
    }
    
    // Count global handlers
    for (const handlers of this.globalHandlers.values()) {
      count += handlers.length;
    }
    
    return count;
  }
  
  /**
   * Create scoped event manager
   */
  scope(root) {
    return new EventManager({ 
      root,
      passive: this.passive,
      capture: this.capture
    });
  }
  
  /**
   * Delegate specific event types only
   */
  delegate(eventTypes) {
    if (!Array.isArray(eventTypes)) {
      eventTypes = [eventTypes];
    }
    
    for (const eventType of eventTypes) {
      this.delegatedEvents.add(eventType);
    }
  }
  
  /**
   * Stop delegating specific event types
   */
  undelegate(eventTypes) {
    if (!Array.isArray(eventTypes)) {
      eventTypes = [eventTypes];
    }
    
    for (const eventType of eventTypes) {
      this.delegatedEvents.delete(eventType);
    }
  }
}

// Create global event manager
export const eventManager = new EventManager({
  root: document.body,
  passive: true,
  capture: false
});

// Export convenience methods
export const on = eventManager.on.bind(eventManager);
export const off = eventManager.off.bind(eventManager);
export const once = eventManager.once.bind(eventManager);
export const emit = eventManager.emit.bind(eventManager);