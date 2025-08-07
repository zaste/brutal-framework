/**
 * BRUTAL V4 - Event Bus
 * Application-level pub/sub system
 * Type-safe events with wildcard support
 */

const eventHandlers = new Map();
const onceHandlers = new WeakMap();

export class EventBus {
    constructor() {
        this._handlers = new Map();
        this._wildcardHandlers = new Map();
    }

    on(event, handler, options = {}) {
        if (typeof handler !== 'function') {
            throw new Error('Handler must be a function');
        }

        const { priority = 0, once = false } = options;
        const handlers = this._getHandlers(event);

        const wrapper = {
            handler,
            priority,
            once,
            id: Symbol('handler')
        };

        handlers.push(wrapper);
        handlers.sort((a, b) => b.priority - a.priority);

        return () => this.off(event, handler);
    }

    once(event, handler) {
        return this.on(event, handler, { once: true });
    }

    off(event, handler) {
        const handlers = this._handlers.get(event);
        if (!handlers) return false;

        const index = handlers.findIndex(h => h.handler === handler);
        if (index > -1) {
            handlers.splice(index, 1);
            if (handlers.length === 0) {
                this._handlers.delete(event);
            }
            return true;
        }
        return false;
    }

    emit(event, data) {
        const results = [];

        // Execute exact match handlers
        const handlers = this._handlers.get(event) || [];
        for (const wrapper of [...handlers]) {
            try {
                results.push(wrapper.handler(data));
                if (wrapper.once) {
                    this.off(event, wrapper.handler);
                }
            } catch (error) {
                console.error(`EventBus handler error for ${event}:`, error);
            }
        }

        // Execute wildcard handlers
        this._executeWildcardHandlers(event, data, results);

        return results;
    }

    async emitAsync(event, data) {
        const results = [];

        const handlers = this._handlers.get(event) || [];
        for (const wrapper of [...handlers]) {
            try {
                results.push(await wrapper.handler(data));
                if (wrapper.once) {
                    this.off(event, wrapper.handler);
                }
            } catch (error) {
                console.error(`EventBus async handler error for ${event}:`, error);
            }
        }

        await this._executeWildcardHandlersAsync(event, data, results);

        return results;
    }

    clear(event) {
        if (event) {
            this._handlers.delete(event);
        } else {
            this._handlers.clear();
            this._wildcardHandlers.clear();
        }
    }

    _getHandlers(event) {
        if (!this._handlers.has(event)) {
            this._handlers.set(event, []);
        }
        return this._handlers.get(event);
    }

    _executeWildcardHandlers(event, data, results) {
        const parts = event.split(':');
        for (let i = parts.length; i > 0; i--) {
            const pattern = parts.slice(0, i).join(':') + ':*';
            const wildcardHandlers = this._wildcardHandlers.get(pattern) || [];
            for (const handler of wildcardHandlers) {
                try {
                    results.push(handler(data, event));
                } catch (error) {
                    console.error(`Wildcard handler error for ${pattern}:`, error);
                }
            }
        }
    }

    async _executeWildcardHandlersAsync(event, data, results) {
        const parts = event.split(':');
        for (let i = parts.length; i > 0; i--) {
            const pattern = parts.slice(0, i).join(':') + ':*';
            const wildcardHandlers = this._wildcardHandlers.get(pattern) || [];
            for (const handler of wildcardHandlers) {
                try {
                    results.push(await handler(data, event));
                } catch (error) {
                    console.error(`Async wildcard handler error for ${pattern}:`, error);
                }
            }
        }
    }
}

// Global event bus instance
export const globalEventBus = new EventBus();