/**
 * BRUTAL V4 - Enhanced Component Base
 * BrutalComponent with integrated lifecycle hooks
 * Extends the base component with hook system
 */

import { BrutalComponent } from '../foundation/Component.js';
import { LifecycleHooks, HookPhase } from './LifecycleHooks.js';
import { Registry } from '../base/Registry.js';
import { eventManager } from '../events/EventManager.js';

// WeakMap for component hooks
const componentHooks = new WeakMap();

export class EnhancedBrutalComponent extends BrutalComponent {
    constructor() {
        super();
        
        // Initialize lifecycle hooks
        const hooks = new LifecycleHooks();
        componentHooks.set(this, hooks);
        
        // Execute beforeCreate hooks
        this._executeHook(HookPhase.BEFORE_CREATE);
    }

    /**
     * Enhanced initialization
     */
    _initialize() {
        try {
            // Execute beforeCreate if not already done
            this._executeHook(HookPhase.BEFORE_CREATE);
            
            // Call parent initialization
            super._initialize();
            
            // Execute created hooks
            this._executeHook(HookPhase.CREATED);
            
        } catch (error) {
            this._executeHook(HookPhase.ERROR_CAPTURED, error, 'initialization');
            throw error;
        }
    }

    /**
     * Enhanced connected callback
     */
    async connectedCallback() {
        try {
            // Execute beforeMount hooks
            await this._executeHook(HookPhase.BEFORE_MOUNT);
            
            // Call parent connected
            super.connectedCallback();
            
            // Execute mounted hooks
            await this._executeHook(HookPhase.MOUNTED);
            
        } catch (error) {
            await this._executeHook(HookPhase.ERROR_CAPTURED, error, 'mount');
            this._handleError('mount', error);
        }
    }

    /**
     * Enhanced disconnected callback
     */
    async disconnectedCallback() {
        try {
            // Execute beforeUnmount hooks
            await this._executeHook(HookPhase.BEFORE_UNMOUNT);
            
            // Call parent disconnected
            super.disconnectedCallback();
            
            // Execute unmounted hooks
            await this._executeHook(HookPhase.UNMOUNTED);
            
        } catch (error) {
            await this._executeHook(HookPhase.ERROR_CAPTURED, error, 'unmount');
            this._handleError('unmount', error);
        }
    }

    /**
     * Enhanced attribute changed callback
     */
    async attributeChangedCallback(name, oldValue, newValue) {
        try {
            if (oldValue !== newValue) {
                // Execute beforeUpdate hooks
                await this._executeHook(HookPhase.BEFORE_UPDATE, { name, oldValue, newValue });
                
                // Call parent
                super.attributeChangedCallback(name, oldValue, newValue);
                
                // Execute updated hooks
                await this._executeHook(HookPhase.UPDATED, { name, oldValue, newValue });
            }
        } catch (error) {
            await this._executeHook(HookPhase.ERROR_CAPTURED, error, 'update');
            this._handleError('update', error);
        }
    }

    /**
     * Enhanced render method
     */
    async render() {
        try {
            // Execute beforeUpdate hooks (for re-renders)
            if (this._renderCount > 0) {
                await this._executeHook(HookPhase.BEFORE_UPDATE, { reason: 'render' });
            }
            
            // Call parent render
            super.render();
            
            // Execute updated hooks (for re-renders)
            if (this._renderCount > 1) {
                await this._executeHook(HookPhase.UPDATED, { reason: 'render' });
            }
            
        } catch (error) {
            await this._executeHook(HookPhase.ERROR_CAPTURED, error, 'render');
            throw error;
        }
    }

    /**
     * Register lifecycle hook
     */
    hook(phase, handler, options = {}) {
        const hooks = componentHooks.get(this);
        if (!hooks) {
            throw new Error('Hooks not initialized');
        }
        
        return hooks.register(phase, handler, options);
    }

    /**
     * Execute lifecycle hooks
     */
    async _executeHook(phase, ...args) {
        const hooks = componentHooks.get(this);
        if (!hooks) return;
        
        try {
            return await hooks.execute(phase, this, ...args);
        } catch (error) {
            console.error(`Hook execution error in ${phase}:`, error);
            if (phase !== HookPhase.ERROR_CAPTURED) {
                throw error;
            }
        }
    }

    /**
     * Setup event listeners with delegation
     */
    setupEventListeners() {
        super.setupEventListeners();
        
        // Use global event delegation for better performance
        const events = this.constructor.delegatedEvents || [];
        events.forEach(({ event, selector, handler }) => {
            eventManager.on(event, selector, handler.bind(this), {
                component: this
            });
        });
    }

    /**
     * Enhanced cleanup
     */
    cleanup() {
        try {
            // Cleanup component from event manager
            eventManager.cleanup(this);
            
            // Clear lifecycle hooks
            const hooks = componentHooks.get(this);
            if (hooks) {
                hooks.clear();
                componentHooks.delete(this);
            }
            
            // Call parent cleanup
            super.cleanup();
            
        } catch (error) {
            this._handleError('cleanup', error);
        }
    }

    /**
     * Activate component (for keep-alive)
     */
    async activate() {
        await this._executeHook(HookPhase.ACTIVATED);
        this.setAttribute('activated', '');
    }

    /**
     * Deactivate component (for keep-alive)
     */
    async deactivate() {
        await this._executeHook(HookPhase.DEACTIVATED);
        this.removeAttribute('activated');
    }

    /**
     * Get hook statistics
     */
    getHookStats() {
        const hooks = componentHooks.get(this);
        if (!hooks) return null;
        
        return {
            total: hooks.count(),
            byPhase: Object.values(HookPhase).reduce((acc, phase) => {
                acc[phase] = hooks.count(phase);
                return acc;
            }, {})
        };
    }

    /**
     * Static helper to define component with options
     */
    static define(tagName, options = {}) {
        // Register with Registry
        Registry.register(tagName, this, options);
        
        // Define custom element
        if (!options.lazy) {
            customElements.define(tagName, this);
        }
        
        return this;
    }
}

// Export hook phase constants for convenience
export { HookPhase } from './LifecycleHooks.js';
export { registerGlobalHook } from './LifecycleHooks.js';