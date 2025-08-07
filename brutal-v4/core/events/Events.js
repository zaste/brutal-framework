/**
 * BRUTAL V4 - Native Event System
 * Pure native event handling with optimizations
 * Zero dependencies, maximum performance
 */

// Import enhanced event manager
export { EventManager, eventManager } from './EventManager.js';

/**
 * Enhanced Event Manager for BRUTAL components
 * Provides optimized event handling with delegation,
 * memory management, and performance tracking
 */
// WeakMaps for memory-safe event data storage
const eventSystemData = new WeakMap();
const handlerReferences = new WeakMap();

export class BrutalEvents {
    constructor(component) {
        // Store all instance data in WeakMap
        eventSystemData.set(this, {
            component: component,
            listeners: new Map(),
            delegatedEvents: new Map(),
            eventCount: 0,
            handlerExecutions: 0,
            averageHandlerTime: 0
        });
        
        // Event delegation setup
        this.setupEventDelegation();
    }
    
    /**
     * Setup event delegation for common events
     */
    setupEventDelegation() {
        const data = eventSystemData.get(this);
        const commonEvents = [
            'click', 'input', 'change', 'submit', 'focus', 'blur',
            'mouseenter', 'mouseleave', 'keydown', 'keyup'
        ];
        
        for (const eventType of commonEvents) {
            const handler = (event) => this.handleDelegatedEvent(event);
            // Store handler reference for cleanup
            if (!handlerReferences.has(this)) {
                handlerReferences.set(this, new Map());
            }
            handlerReferences.get(this).set(eventType, handler);
            
            data.component.addEventListener(eventType, handler);
        }
    }
    
    /**
     * Handle delegated events
     */
    handleDelegatedEvent(event) {
        const data = eventSystemData.get(this);
        const startTime = performance.now();
        
        // Find handlers for this event target
        let current = event.target;
        
        while (current && current !== data.component) {
            const handlers = data.delegatedEvents.get(current);
            
            if (handlers && handlers.has(event.type)) {
                const handlerList = handlers.get(event.type);
                
                for (const handler of handlerList) {
                    try {
                        handler.call(current, event);
                        data.handlerExecutions++;
                    } catch (error) {
                        console.error('[BrutalEvents] Handler error:', error);
                        data.component.emit('brutal:event-error', {
                            event: event.type,
                            error: error.message,
                            target: current
                        });
                    }
                }
                
                if (event.cancelBubble) {
                    break;
                }
            }
            
            current = current.parentElement;
        }
        
        // Update performance metrics
        const handlerTime = performance.now() - startTime;
        data.averageHandlerTime = (data.averageHandlerTime + handlerTime) / 2;
    }
    
    /**
     * Add event listener
     */
    on(event, handler, options = {}) {
        const data = eventSystemData.get(this);
        const element = options.element || data.component;
        const useCapture = options.capture || false;
        const isOnce = options.once || false;
        const isPassive = options.passive !== undefined ? options.passive : false;
        const useDelegation = options.delegate !== false;
        
        // Wrap handler for once option
        let wrappedHandler = handler;
        
        if (isOnce) {
            wrappedHandler = this.createOnceHandler(handler, event, element);
        }
        
        // Add performance monitoring if enabled
        if (options.monitor) {
            wrappedHandler = this.createMonitoredHandler(wrappedHandler, event);
        }
        
        // Use delegation for supported events on child elements
        if (useDelegation && element !== this.component && this.supportsDelegation(event)) {
            this.addDelegatedListener(element, event, wrappedHandler);
        } else {
            // Direct event listener
            const eventOptions = {
                capture: useCapture,
                once: isOnce,
                passive: isPassive
            };
            
            element.addEventListener(event, wrappedHandler, eventOptions);
        }
        
        // Store listener reference
        const key = this.createListenerKey(event, handler, element);
        this.listeners.set(key, {
            element,
            event,
            handler: wrappedHandler,
            originalHandler: handler,
            options
        });
        
        this.eventCount++;
    }
    
    /**
     * Remove event listener
     */
    off(event, handler, options = {}) {
        const element = options.element || this.component;
        const key = this.createListenerKey(event, handler, element);
        const listener = this.listeners.get(key);
        
        if (!listener) {
            return false;
        }
        
        // Remove delegated listener
        if (this.supportsDelegation(event) && element !== this.component) {
            this.removeDelegatedListener(element, event, listener.handler);
        } else {
            // Remove direct listener
            element.removeEventListener(event, listener.handler, listener.options);
        }
        
        // Clean up references
        this.listeners.delete(key);
        this.eventCount--;
        
        return true;
    }
    
    /**
     * Add one-time event listener
     */
    once(event, handler, options = {}) {
        return this.on(event, handler, { ...options, once: true });
    }
    
    /**
     * Emit custom event
     */
    emit(event, detail = {}, options = {}) {
        const eventOptions = {
            detail,
            bubbles: options.bubbles !== false,
            composed: options.composed !== false,
            cancelable: options.cancelable !== false
        };
        
        const customEvent = new CustomEvent(event, eventOptions);
        
        return this.component.dispatchEvent(customEvent);
    }
    
    /**
     * Add delegated event listener
     */
    addDelegatedListener(element, event, handler) {
        if (!this.delegatedEvents.has(element)) {
            this.delegatedEvents.set(element, new Map());
        }
        
        const elementEvents = this.delegatedEvents.get(element);
        
        if (!elementEvents.has(event)) {
            elementEvents.set(event, new Set());
        }
        
        elementEvents.get(event).add(handler);
    }
    
    /**
     * Remove delegated event listener
     */
    removeDelegatedListener(element, event, handler) {
        const elementEvents = this.delegatedEvents.get(element);
        
        if (elementEvents && elementEvents.has(event)) {
            elementEvents.get(event).delete(handler);
            
            // Clean up empty sets
            if (elementEvents.get(event).size === 0) {
                elementEvents.delete(event);
            }
            
            if (elementEvents.size === 0) {
                this.delegatedEvents.delete(element);
            }
        }
    }
    
    /**
     * Check if event supports delegation
     */
    supportsDelegation(event) {
        const delegatedEvents = [
            'click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout',
            'mousemove', 'mouseenter', 'mouseleave',
            'keydown', 'keyup', 'keypress',
            'focus', 'blur', 'focusin', 'focusout',
            'input', 'change', 'submit', 'reset',
            'touchstart', 'touchend', 'touchmove', 'touchcancel'
        ];
        
        return delegatedEvents.includes(event);
    }
    
    /**
     * Create unique listener key
     */
    createListenerKey(event, handler, element) {
        const elementId = element === this.component ? 'component' : element.tagName + Math.random();
        const handlerStr = handler.toString().slice(0, 50);
        return `${event}-${elementId}-${handlerStr}`;
    }
    
    /**
     * Create once handler wrapper
     */
    createOnceHandler(handler, event, element) {
        const onceHandler = (...args) => {
            try {
                handler(...args);
            } finally {
                this.off(event, handler, { element });
            }
        };
        
        this.onceHandlers.set(handler, onceHandler);
        return onceHandler;
    }
    
    /**
     * Create monitored handler wrapper
     */
    createMonitoredHandler(handler, event) {
        return (...args) => {
            const startTime = performance.now();
            
            try {
                const result = handler(...args);
                
                const executionTime = performance.now() - startTime;
                
                // Emit performance event
                this.component.emit('brutal:event-performance', {
                    event,
                    executionTime,
                    handler: handler.name || 'anonymous'
                });
                
                return result;
            } catch (error) {
                const executionTime = performance.now() - startTime;
                
                // Emit error event
                this.component.emit('brutal:event-error', {
                    event,
                    error: error.message,
                    executionTime,
                    handler: handler.name || 'anonymous'
                });
                
                throw error;
            }
        };
    }
    
    /**
     * Debounce event handler
     */
    debounce(handler, delay = 300) {
        let timeoutId;
        
        return function debounced(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => handler.apply(this, args), delay);
        };
    }
    
    /**
     * Throttle event handler
     */
    throttle(handler, delay = 100) {
        let lastCall = 0;
        
        return function throttled(...args) {
            const now = Date.now();
            
            if (now - lastCall >= delay) {
                lastCall = now;
                return handler.apply(this, args);
            }
        };
    }
    
    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            eventCount: this.eventCount,
            handlerExecutions: this.handlerExecutions,
            averageHandlerTime: this.averageHandlerTime,
            delegatedEvents: this.delegatedEvents.size,
            activeListeners: this.listeners.size
        };
    }
    
    /**
     * Clean up all event listeners
     */
    cleanup() {
        // Remove all direct listeners
        for (const [key, listener] of this.listeners) {
            listener.element.removeEventListener(
                listener.event,
                listener.handler,
                listener.options
            );
        }
        
        // Clear all data structures
        this.listeners.clear();
        this.delegatedEvents.clear();
        this.onceHandlers = new WeakMap();
        
        // Reset metrics
        this.eventCount = 0;
        this.handlerExecutions = 0;
        this.averageHandlerTime = 0;
    }
    
    /**
     * List all active event listeners
     */
    listListeners() {
        const listeners = [];
        
        for (const [key, listener] of this.listeners) {
            listeners.push({
                key,
                event: listener.event,
                element: listener.element.tagName,
                handler: listener.originalHandler.name || 'anonymous'
            });
        }
        
        return listeners;
    }
}

/**
 * Event utilities
 */
export const EventUtils = {
    /**
     * Stop event propagation and default
     */
    stop(event) {
        event.preventDefault();
        event.stopPropagation();
    },
    
    /**
     * Get event target element
     */
    getTarget(event, selector) {
        let target = event.target;
        
        while (target && target !== event.currentTarget) {
            if (target.matches && target.matches(selector)) {
                return target;
            }
            target = target.parentElement;
        }
        
        return null;
    },
    
    /**
     * Check if event is from keyboard
     */
    isKeyboardEvent(event) {
        return event instanceof KeyboardEvent;
    },
    
    /**
     * Check if event is from mouse
     */
    isMouseEvent(event) {
        return event instanceof MouseEvent;
    },
    
    /**
     * Check if event is from touch
     */
    isTouchEvent(event) {
        return event instanceof TouchEvent;
    },
    
    /**
     * Get normalized coordinates
     */
    getCoordinates(event) {
        if (event.touches && event.touches.length > 0) {
            return {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }
        
        return {
            x: event.clientX || 0,
            y: event.clientY || 0
        };
    },
    
    /**
     * Create synthetic event
     */
    createEvent(type, detail = {}, options = {}) {
        return new CustomEvent(type, {
            detail,
            bubbles: options.bubbles !== false,
            composed: options.composed !== false,
            cancelable: options.cancelable !== false
        });
    }
};

/**
 * Global event bus for component communication
 */
export class EventBus extends EventTarget {
    constructor() {
        super();
        this.listeners = new Map();
    }
    
    /**
     * Subscribe to global events
     */
    subscribe(event, handler) {
        this.addEventListener(event, handler);
        
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        
        this.listeners.get(event).add(handler);
        
        return () => this.unsubscribe(event, handler);
    }
    
    /**
     * Unsubscribe from global events
     */
    unsubscribe(event, handler) {
        this.removeEventListener(event, handler);
        
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(handler);
            
            if (this.listeners.get(event).size === 0) {
                this.listeners.delete(event);
            }
        }
    }
    
    /**
     * Emit global event
     */
    emit(event, detail = {}) {
        this.dispatchEvent(new CustomEvent(event, { detail }));
    }
    
    /**
     * Get active subscriptions
     */
    getSubscriptions() {
        const subscriptions = {};
        
        for (const [event, handlers] of this.listeners) {
            subscriptions[event] = handlers.size;
        }
        
        return subscriptions;
    }
}

// Global event bus instance
export const globalEvents = new EventBus();