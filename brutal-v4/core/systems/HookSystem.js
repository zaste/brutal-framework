/**
 * BRUTAL V4 - Hook System
 * Lightweight hook system for extensibility
 * Provides before/after hooks with priority support
 */

const hookRegistry = new Map();
const globalFilters = new Map();

export class HookSystem {
    constructor(name) {
        this.name = name;
        this.hooks = new Map();
        this.filters = new Map();
        this.frozen = false;
    }

    /**
     * Register a hook
     */
    hook(name, handler, options = {}) {
        if (this.frozen) {
            throw new Error(`Hook system '${this.name}' is frozen`);
        }

        const { 
            priority = 10, 
            once = false,
            async = true,
            condition = null 
        } = options;

        if (!this.hooks.has(name)) {
            this.hooks.set(name, []);
        }

        const hook = {
            handler,
            priority,
            once,
            async,
            condition,
            id: Symbol('hook')
        };

        const hooks = this.hooks.get(name);
        hooks.push(hook);
        
        // Sort by priority (higher first)
        hooks.sort((a, b) => b.priority - a.priority);

        // Return unhook function
        return () => this.unhook(name, hook.id);
    }

    /**
     * Register a filter
     */
    filter(name, transformer, options = {}) {
        const { priority = 10 } = options;

        if (!this.filters.has(name)) {
            this.filters.set(name, []);
        }

        const filter = {
            transformer,
            priority,
            id: Symbol('filter')
        };

        const filters = this.filters.get(name);
        filters.push(filter);
        filters.sort((a, b) => b.priority - a.priority);

        return () => this.unfilter(name, filter.id);
    }

    /**
     * Execute hooks
     */
    async execute(name, context = {}, ...args) {
        const hooks = this.hooks.get(name) || [];
        const results = [];

        for (const hook of [...hooks]) {
            // Check condition
            if (hook.condition && !hook.condition(context, ...args)) {
                continue;
            }

            try {
                const result = hook.async
                    ? await hook.handler(context, ...args)
                    : hook.handler(context, ...args);

                results.push(result);

                // Remove if once
                if (hook.once) {
                    this.unhook(name, hook.id);
                }

                // Stop if false returned
                if (result === false) {
                    break;
                }
            } catch (error) {
                console.error(`Hook error in ${this.name}.${name}:`, error);
                if (context.throwOnError) {
                    throw error;
                }
            }
        }

        return results;
    }

    /**
     * Apply filters
     */
    apply(name, value, context = {}) {
        const filters = this.filters.get(name) || [];
        let filtered = value;

        for (const filter of filters) {
            try {
                filtered = filter.transformer(filtered, context);
            } catch (error) {
                console.error(`Filter error in ${this.name}.${name}:`, error);
            }
        }

        // Apply global filters
        const globalFiltersForName = globalFilters.get(`${this.name}.${name}`) || [];
        for (const filter of globalFiltersForName) {
            try {
                filtered = filter.transformer(filtered, context);
            } catch (error) {
                console.error(`Global filter error:`, error);
            }
        }

        return filtered;
    }

    /**
     * Remove hook
     */
    unhook(name, id) {
        const hooks = this.hooks.get(name);
        if (!hooks) return;

        const index = hooks.findIndex(h => h.id === id);
        if (index > -1) {
            hooks.splice(index, 1);
        }
    }

    /**
     * Remove filter
     */
    unfilter(name, id) {
        const filters = this.filters.get(name);
        if (!filters) return;

        const index = filters.findIndex(f => f.id === id);
        if (index > -1) {
            filters.splice(index, 1);
        }
    }

    /**
     * Clear all hooks/filters
     */
    clear(name) {
        if (name) {
            this.hooks.delete(name);
            this.filters.delete(name);
        } else {
            this.hooks.clear();
            this.filters.clear();
        }
    }

    /**
     * Freeze system (prevent modifications)
     */
    freeze() {
        this.frozen = true;
    }

    /**
     * Get statistics
     */
    getStats() {
        let totalHooks = 0;
        let totalFilters = 0;

        for (const hooks of this.hooks.values()) {
            totalHooks += hooks.length;
        }

        for (const filters of this.filters.values()) {
            totalFilters += filters.length;
        }

        return {
            name: this.name,
            hookTypes: this.hooks.size,
            totalHooks,
            filterTypes: this.filters.size,
            totalFilters,
            frozen: this.frozen
        };
    }
}

/**
 * Create hook system
 */
export function createHookSystem(name) {
    if (hookRegistry.has(name)) {
        return hookRegistry.get(name);
    }

    const system = new HookSystem(name);
    hookRegistry.set(name, system);
    return system;
}

/**
 * Get hook system
 */
export function getHookSystem(name) {
    return hookRegistry.get(name);
}

/**
 * Register global filter
 */
export function registerGlobalFilter(systemName, filterName, transformer, priority = 10) {
    const key = `${systemName}.${filterName}`;
    
    if (!globalFilters.has(key)) {
        globalFilters.set(key, []);
    }

    const filter = {
        transformer,
        priority,
        id: Symbol('global-filter')
    };

    const filters = globalFilters.get(key);
    filters.push(filter);
    filters.sort((a, b) => b.priority - a.priority);

    return () => {
        const index = filters.findIndex(f => f.id === filter.id);
        if (index > -1) {
            filters.splice(index, 1);
        }
    };
}