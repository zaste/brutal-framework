/**
 * BRUTAL V4 - Enhanced Event Manager
 * Global event delegation system with performance optimization
 * Single listener per event type for maximum efficiency
 */

// Singleton instances
let globalInstance = null;
const delegatedHandlers = new WeakMap();
const eventMetrics = new Map();

export class EventManager {
    constructor() {
        if (globalInstance) {
            return globalInstance;
        }

        this.listeners = new Map();
        this.delegatedTypes = new Set();
        this.metrics = {
            totalEvents: 0,
            delegatedEvents: 0,
            averageHandlerTime: 0
        };

        globalInstance = this;
    }

    /**
     * Enable global delegation for event type
     */
    enableDelegation(eventType, root = document.body) {
        if (this.delegatedTypes.has(eventType)) {
            return;
        }

        const handler = (event) => {
            const startTime = performance.now();
            this._handleDelegatedEvent(event);
            this._updateMetrics(eventType, performance.now() - startTime);
        };

        root.addEventListener(eventType, handler, true);
        this.delegatedTypes.add(eventType);
        delegatedHandlers.set(eventType, { root, handler });
    }

    /**
     * Register delegated event handler
     */
    on(eventType, selector, handler, options = {}) {
        const key = `${eventType}:${selector}`;
        
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }

        const wrappedHandler = {
            handler,
            selector,
            options,
            id: Symbol('handler')
        };

        this.listeners.get(key).add(wrappedHandler);

        // Auto-enable delegation for common events
        if (this._isCommonEvent(eventType) && !this.delegatedTypes.has(eventType)) {
            this.enableDelegation(eventType);
        }

        return () => this.off(eventType, selector, handler);
    }

    /**
     * Remove event handler
     */
    off(eventType, selector, handler) {
        const key = `${eventType}:${selector}`;
        const handlers = this.listeners.get(key);

        if (!handlers) return false;

        for (const wrapped of handlers) {
            if (wrapped.handler === handler) {
                handlers.delete(wrapped);
                if (handlers.size === 0) {
                    this.listeners.delete(key);
                }
                return true;
            }
        }

        return false;
    }

    /**
     * Handle delegated events
     */
    _handleDelegatedEvent(event) {
        const path = event.composedPath();
        const eventType = event.type;

        // Check each element in the path
        for (const element of path) {
            if (element === document.body) break;

            // Check all selectors for this event type
            for (const [key, handlers] of this.listeners) {
                if (!key.startsWith(`${eventType}:`)) continue;

                const selector = key.split(':')[1];
                if (this._matches(element, selector)) {
                    for (const wrapped of handlers) {
                        try {
                            // Check if event should be handled
                            if (wrapped.options.once && wrapped.executed) continue;

                            // Execute handler
                            wrapped.handler.call(element, event);
                            
                            if (wrapped.options.once) {
                                wrapped.executed = true;
                                handlers.delete(wrapped);
                            }

                            // Stop if requested
                            if (wrapped.options.stopPropagation) {
                                event.stopPropagation();
                            }
                        } catch (error) {
                            console.error('Event handler error:', error);
                        }
                    }
                }
            }
        }

        this.metrics.totalEvents++;
        this.metrics.delegatedEvents++;
    }

    /**
     * Check if element matches selector
     */
    _matches(element, selector) {
        if (!element || element.nodeType !== 1) return false;

        // Handle special selectors
        if (selector.startsWith('[data-action=')) {
            const action = selector.match(/\[data-action="(.+?)"\]/)?.[1];
            return element.dataset?.action === action;
        }

        return element.matches?.(selector) || false;
    }

    /**
     * Check if event is commonly delegated
     */
    _isCommonEvent(eventType) {
        const common = [
            'click', 'dblclick', 'mousedown', 'mouseup',
            'keydown', 'keyup', 'keypress',
            'input', 'change', 'submit',
            'focus', 'blur', 'focusin', 'focusout'
        ];
        return common.includes(eventType);
    }

    /**
     * Update performance metrics
     */
    _updateMetrics(eventType, handlerTime) {
        if (!eventMetrics.has(eventType)) {
            eventMetrics.set(eventType, {
                count: 0,
                totalTime: 0,
                averageTime: 0
            });
        }

        const metrics = eventMetrics.get(eventType);
        metrics.count++;
        metrics.totalTime += handlerTime;
        metrics.averageTime = metrics.totalTime / metrics.count;

        // Update global average
        const allMetrics = Array.from(eventMetrics.values());
        const totalAverage = allMetrics.reduce((sum, m) => sum + m.averageTime, 0) / allMetrics.length;
        this.metrics.averageHandlerTime = totalAverage;
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            eventTypes: Object.fromEntries(eventMetrics)
        };
    }

    /**
     * Clear all listeners
     */
    clear() {
        // Remove delegated handlers
        for (const [eventType, data] of delegatedHandlers) {
            data.root.removeEventListener(eventType, data.handler, true);
        }

        this.listeners.clear();
        this.delegatedTypes.clear();
        delegatedHandlers.clear();
        eventMetrics.clear();
        
        this.metrics = {
            totalEvents: 0,
            delegatedEvents: 0,
            averageHandlerTime: 0
        };
    }

    /**
     * Cleanup specific component
     */
    cleanup(component) {
        // Remove handlers for specific component
        for (const [key, handlers] of this.listeners) {
            const toRemove = [];
            for (const wrapped of handlers) {
                if (wrapped.component === component) {
                    toRemove.push(wrapped);
                }
            }
            toRemove.forEach(h => handlers.delete(h));
            if (handlers.size === 0) {
                this.listeners.delete(key);
            }
        }
    }
}

// Export singleton
export const eventManager = new EventManager();

// Auto-enable delegation for common events
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const commonEvents = ['click', 'input', 'change', 'submit'];
        commonEvents.forEach(type => eventManager.enableDelegation(type));
    });
}