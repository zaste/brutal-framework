/**
 * BRUTAL V4 - Lifecycle Hooks System
 * Unified hooks for component lifecycle management
 * Provides fine-grained control over component behavior
 */

import { EventManager } from '../events/EventManager.js';
import { globalEventBus } from '../events/EventBus.js';

// Hook phases
export const HookPhase = {
    BEFORE_CREATE: 'beforeCreate',
    CREATED: 'created',
    BEFORE_MOUNT: 'beforeMount',
    MOUNTED: 'mounted',
    BEFORE_UPDATE: 'beforeUpdate',
    UPDATED: 'updated',
    BEFORE_UNMOUNT: 'beforeUnmount',
    UNMOUNTED: 'unmounted',
    ERROR_CAPTURED: 'errorCaptured',
    ACTIVATED: 'activated',
    DEACTIVATED: 'deactivated'
};

// Hook registry for global hooks
const globalHooks = new Map();

export class LifecycleHooks {
    constructor() {
        this.hooks = new Map();
        this.eventManager = new EventManager();
        // Keep globalEventBus for app-level events
        this.eventBus = globalEventBus;
    }

    /**
     * Register a lifecycle hook
     */
    register(phase, handler, options = {}) {
        if (!Object.values(HookPhase).includes(phase)) {
            throw new Error(`Invalid hook phase: ${phase}`);
        }

        const { priority = 0, once = false } = options;
        
        if (!this.hooks.has(phase)) {
            this.hooks.set(phase, []);
        }

        const hook = {
            handler,
            priority,
            once,
            id: Symbol('hook')
        };

        const hooks = this.hooks.get(phase);
        hooks.push(hook);
        hooks.sort((a, b) => b.priority - a.priority);

        return () => this.remove(phase, hook.id);
    }

    /**
     * Execute hooks for a phase
     */
    async execute(phase, context, ...args) {
        const results = [];

        // Setup event delegation for mounted components
        if (phase === HookPhase.MOUNTED && context instanceof HTMLElement) {
            this._setupEventDelegation(context);
        }

        // Execute instance hooks
        const hooks = this.hooks.get(phase) || [];
        for (const hook of [...hooks]) {
            try {
                const result = await hook.handler.call(context, ...args);
                results.push(result);

                if (hook.once) {
                    this.remove(phase, hook.id);
                }

                // Allow hooks to stop propagation
                if (result === false) {
                    break;
                }
            } catch (error) {
                // Error in hook, trigger error phase
                if (phase !== HookPhase.ERROR_CAPTURED) {
                    await this.execute(HookPhase.ERROR_CAPTURED, context, error, phase);
                }
                throw error;
            }
        }

        // Execute global hooks
        const globalResults = await executeGlobalHooks(phase, context, ...args);
        results.push(...globalResults);

        // Cleanup event delegation for unmounted components
        if (phase === HookPhase.UNMOUNTED && context instanceof HTMLElement) {
            this._cleanupEventDelegation(context);
        }

        // Emit lifecycle event
        this.eventBus.emit(`lifecycle:${phase}`, {
            component: context,
            phase,
            args
        });

        return results;
    }

    /**
     * Remove a hook
     */
    remove(phase, id) {
        const hooks = this.hooks.get(phase);
        if (!hooks) return;

        const index = hooks.findIndex(h => h.id === id);
        if (index > -1) {
            hooks.splice(index, 1);
        }
    }

    /**
     * Clear all hooks
     */
    clear(phase) {
        if (phase) {
            this.hooks.delete(phase);
        } else {
            this.hooks.clear();
        }
    }

    /**
     * Get hook count
     */
    count(phase) {
        if (phase) {
            return this.hooks.get(phase)?.length || 0;
        }
        return Array.from(this.hooks.values()).reduce((sum, hooks) => sum + hooks.length, 0);
    }

    /**
     * Setup event delegation for component
     */
    _setupEventDelegation(element) {
        if (!element._eventDelegation) {
            element._eventDelegation = {
                manager: this.eventManager,
                handlers: new Map()
            };
        }

        // Auto-delegate common interactive events
        const interactiveEvents = ['click', 'input', 'change', 'submit'];
        interactiveEvents.forEach(eventType => {
            const handler = (e) => {
                // Emit component-specific event
                this.eventBus.emit(`component:${eventType}`, {
                    component: element,
                    event: e,
                    target: e.target
                });
            };

            this.eventManager.delegate(element, eventType, '[data-action]', handler);
            element._eventDelegation.handlers.set(eventType, handler);
        });
    }

    /**
     * Cleanup event delegation for component
     */
    _cleanupEventDelegation(element) {
        if (element._eventDelegation) {
            element._eventDelegation.handlers.forEach((handler, eventType) => {
                this.eventManager.undelegate(element, eventType, '[data-action]', handler);
            });
            delete element._eventDelegation;
        }
    }
}

/**
 * Global hook registration
 */
export function registerGlobalHook(phase, handler, options = {}) {
    if (!globalHooks.has(phase)) {
        globalHooks.set(phase, []);
    }

    const hook = {
        handler,
        priority: options.priority || 0,
        once: options.once || false,
        id: Symbol('global-hook')
    };

    const hooks = globalHooks.get(phase);
    hooks.push(hook);
    hooks.sort((a, b) => b.priority - a.priority);

    return () => removeGlobalHook(phase, hook.id);
}

/**
 * Remove global hook
 */
function removeGlobalHook(phase, id) {
    const hooks = globalHooks.get(phase);
    if (!hooks) return;

    const index = hooks.findIndex(h => h.id === id);
    if (index > -1) {
        hooks.splice(index, 1);
    }
}

/**
 * Execute global hooks
 */
async function executeGlobalHooks(phase, context, ...args) {
    const hooks = globalHooks.get(phase) || [];
    const results = [];

    for (const hook of [...hooks]) {
        try {
            const result = await hook.handler.call(context, ...args);
            results.push(result);

            if (hook.once) {
                removeGlobalHook(phase, hook.id);
            }

            if (result === false) {
                break;
            }
        } catch (error) {
            console.error(`Global hook error in ${phase}:`, error);
        }
    }

    return results;
}

/**
 * Lifecycle mixin for components
 */
export const LifecycleMixin = {
    beforeCreate() {},
    created() {},
    beforeMount() {},
    mounted() {},
    beforeUpdate() {},
    updated() {},
    beforeUnmount() {},
    unmounted() {},
    errorCaptured(error, phase) {},
    activated() {},
    deactivated() {}
};