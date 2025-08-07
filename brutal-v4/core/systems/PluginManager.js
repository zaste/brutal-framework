/**
 * BRUTAL V4 - Plugin Manager
 * Extensibility system for build and runtime plugins
 * Provides hooks into all core systems
 */

import { Registry } from '../base/Registry.js';
import { LifecycleHooks, HookPhase } from '../components/LifecycleHooks.js';
import { globalEventBus } from '../events/EventBus.js';
import { HookSystem } from './HookSystem.js';

// Plugin types
export const PluginType = {
    BUILD: 'build',
    RUNTIME: 'runtime',
    HYBRID: 'hybrid'
};

// Plugin status
export const PluginStatus = {
    INACTIVE: 'inactive',
    LOADING: 'loading',
    ACTIVE: 'active',
    ERROR: 'error'
};

class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.hooks = new HookSystem();
        this.dependencies = new Map();
        this.loadOrder = [];
    }

    /**
     * Register a plugin
     */
    async register(plugin) {
        const { name, type = PluginType.RUNTIME, dependencies = [], init } = plugin;

        if (!name || !init) {
            throw new Error('Plugin must have name and init function');
        }

        if (this.plugins.has(name)) {
            throw new Error(`Plugin ${name} already registered`);
        }

        // Store plugin
        this.plugins.set(name, {
            ...plugin,
            type,
            status: PluginStatus.INACTIVE,
            instance: null
        });

        // Track dependencies
        this.dependencies.set(name, dependencies);

        // Update load order
        this._updateLoadOrder();

        globalEventBus.emit('plugin:registered', { name, type });
    }

    /**
     * Initialize a plugin
     */
    async init(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error(`Plugin ${name} not found`);
        }

        if (plugin.status === PluginStatus.ACTIVE) {
            return plugin.instance;
        }

        // Check dependencies
        for (const dep of this.dependencies.get(name) || []) {
            const depPlugin = this.plugins.get(dep);
            if (!depPlugin || depPlugin.status !== PluginStatus.ACTIVE) {
                await this.init(dep);
            }
        }

        try {
            plugin.status = PluginStatus.LOADING;
            
            // Create plugin context
            const context = this._createContext(name);
            
            // Initialize plugin
            plugin.instance = await plugin.init(context);
            plugin.status = PluginStatus.ACTIVE;

            globalEventBus.emit('plugin:initialized', { name });
            
            return plugin.instance;
        } catch (error) {
            plugin.status = PluginStatus.ERROR;
            plugin.error = error;
            globalEventBus.emit('plugin:error', { name, error });
            throw error;
        }
    }

    /**
     * Create plugin context
     */
    _createContext(name) {
        return {
            // Core systems access
            registry: Registry,
            eventBus: globalEventBus,
            
            // Hook into lifecycle
            beforeMount: (callback) => {
                LifecycleHooks.registerGlobalHook(HookPhase.BEFORE_MOUNT, callback);
            },
            afterMount: (callback) => {
                LifecycleHooks.registerGlobalHook(HookPhase.MOUNTED, callback);
            },
            beforeUpdate: (callback) => {
                LifecycleHooks.registerGlobalHook(HookPhase.BEFORE_UPDATE, callback);
            },
            afterUpdate: (callback) => {
                LifecycleHooks.registerGlobalHook(HookPhase.UPDATED, callback);
            },
            
            // Hook into component definition
            onDefineComponent: (callback) => {
                Registry.onDefine(callback);
            },
            
            // Add custom hooks
            addHook: (phase, handler, options) => {
                return this.hooks.add(phase, handler, options);
            },
            
            // Plugin communication
            getPlugin: (pluginName) => {
                const plugin = this.plugins.get(pluginName);
                return plugin?.instance;
            }
        };
    }

    /**
     * Unregister a plugin
     */
    async unregister(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) return;

        // Check dependents
        const dependents = this._getDependents(name);
        if (dependents.length > 0) {
            throw new Error(`Cannot unregister ${name}, required by: ${dependents.join(', ')}`);
        }

        // Cleanup
        if (plugin.instance && plugin.instance.destroy) {
            await plugin.instance.destroy();
        }

        this.plugins.delete(name);
        this.dependencies.delete(name);
        this._updateLoadOrder();

        globalEventBus.emit('plugin:unregistered', { name });
    }

    /**
     * Get plugins that depend on given plugin
     */
    _getDependents(name) {
        const dependents = [];
        
        for (const [pluginName, deps] of this.dependencies) {
            if (deps.includes(name)) {
                dependents.push(pluginName);
            }
        }
        
        return dependents;
    }

    /**
     * Update load order based on dependencies
     */
    _updateLoadOrder() {
        const visited = new Set();
        const order = [];

        const visit = (name) => {
            if (visited.has(name)) return;
            visited.add(name);

            const deps = this.dependencies.get(name) || [];
            for (const dep of deps) {
                if (this.plugins.has(dep)) {
                    visit(dep);
                }
            }

            order.push(name);
        };

        for (const name of this.plugins.keys()) {
            visit(name);
        }

        this.loadOrder = order;
    }

    /**
     * Initialize all registered plugins
     */
    async initAll() {
        for (const name of this.loadOrder) {
            await this.init(name);
        }
    }

    /**
     * Get plugin info
     */
    getInfo(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) return null;

        return {
            name,
            type: plugin.type,
            status: plugin.status,
            dependencies: this.dependencies.get(name) || [],
            error: plugin.error
        };
    }

    /**
     * List all plugins
     */
    list() {
        return Array.from(this.plugins.keys()).map(name => this.getInfo(name));
    }

    /**
     * Execute hook across all plugins
     */
    async executeHook(hookName, ...args) {
        return this.hooks.run(hookName, ...args);
    }
}

// Export singleton
export const pluginManager = new PluginManager();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
    window.brutalPlugins = pluginManager;
}