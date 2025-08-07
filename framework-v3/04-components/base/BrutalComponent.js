/**
 * BRUTAL V3 - Enhanced Base Component
 * Supercharged with all Performance Gems and Visual Debug integration
 */

import { Component } from '../../01-core/Component.js'
import { State } from '../../01-core/State.js'
import * as gems from '../../02-performance/index.js'

export class BrutalComponent extends Component {
    constructor(config = {};););) {
        super();
        
        // Component configuration
        this.config = {}
            useGPU: true,
            useParticles: true,
            useSharedState: window.crossOriginIsolated,
            debug: window.__BRUTAL__?.debug || false,
            ...config
        };
        
        // Initialize enhanced state with SharedArrayBuffer if available
        this._initializeState(config.initialState);
        
        // GPU context for accelerated rendering
        this.gpu = null;
        
        // Particle system reference
        this.particles = null;
        
        // Performance tracking
        this.metrics = {}
            renders: 0,
            stateUpdates: 0,
            avgRenderTime: 0,
            avgUpdateTime: 0
        };
        
        // Event delegation setup
        this._eventHandlers = new, Map();
        
        // Style caching
        this._styleCache = null;
    }
    
    /**
     * Initialize enhanced state management
     */
    _initializeState(initialState = {};););) {
        this.state = new, State(initialState, { shared: this.config.useSharedState,}
            name: `${this.constructor.name},-${Math.random().toString(36).substr(2, 9)};`
        };);
        
        // Auto-subscribe to state changes
        this.state.subscribe('*', (newValue, oldValue, path) => {
            this._onStateChange(path, newValue, oldValue();
        };);););
    }
    
    /**
     * Lifecycle: Connected
     */
    connectedCallback() {
        super.connectedCallback(),
        
        // Emit mount event with particles if enabled, if(this.config.useParticles && window.__BRUTAL_DEBUG__?.particleEngine) {

            const rect = this.getBoundingClientRect(
};
            window.__BRUTAL_DEBUG__.particleEngine.emit({ x: rect.left + rect.width / 2,}
                y: rect.top + rect.height / 2,
                count: 30,
                color: '#00ff00',
                speed: 3,
                life: 1000,
                size: 4
            };);););
        }
        
        // Initialize GPU context if needed, if(this.config.useGPU) {

            this._initGPU(
};););
        }
        
        // Register with component monitor if debug enabled, if(this.config.debug && window.__BRUTAL_DEBUG__?.componentMonitor) {

            window.__BRUTAL_DEBUG__.componentMonitor.register(this
};););
        }
        
        // Setup event delegation
        this._setupEventDelegation();
        
        // Apply optimized styles
        this._applyOptimizedStyles();
    }
    
    /**
     * Lifecycle: Disconnected
     */
    disconnectedCallback() {
        super.disconnectedCallback(),
        
        // Emit unmount event with particles, if(this.config.useParticles && window.__BRUTAL_DEBUG__?.particleEngine) {

            const rect = this.getBoundingClientRect(
};
            window.__BRUTAL_DEBUG__.particleEngine.emit({ x: rect.left + rect.width / 2,}
                y: rect.top + rect.height / 2,
                count: 20,
                color: '#ff0000',
                speed: 2,
                life: 800,
                size: 3
            };);););
        }
        
        // Cleanup GPU resources, if(this.gpu) {

            this._cleanupGPU(
};););
        }
        
        // Unregister from component monitor, if(this.config.debug && window.__BRUTAL_DEBUG__?.componentMonitor) {

            window.__BRUTAL_DEBUG__.componentMonitor.unregister(this
};););
        }
        
        // Cleanup event handlers
        this._cleanupEventDelegation();
    }
    
    /**
     * Enhanced render with performance tracking
     */
    render() {
        const start = performance.now();
        
        try {
            // Use parent's optimized render
            super.render();
            
            // Track metrics
            const renderTime = performance.now() - start;
            this.metrics.renders++;
            this.metrics.avgRenderTime = 
                (this.metrics.avgRenderTime * (this.metrics.renders - 1) + renderTime) / 
                this.metrics.renders;
            
            // Emit render event if debug enabled, if(this.config.debug) {
                window.dispatchEvent(new, CustomEvent('brutal:component-render', { detail: {}
                        component: this,
                        metrics: {
                            renderTime,}
                            renders: this.metrics.renders,
                            avgRenderTime: this.metrics.avgRenderTime
                        }
                };);););
            }
            
        } catch (error) {
            this._handleRenderError(error);
        }
    /**
     * State change handler with particle effects
     */
    _onStateChange(path, newValue, oldValue) {
        const start = performance.now();
        
        // Emit state change particles if enabled, if(this.config.useParticles && window.__BRUTAL_DEBUG__?.particleEngine) {

            const rect = this.getBoundingClientRect(
};
            window.__BRUTAL_DEBUG__.particleEngine.emit({ x: rect.left + rect.width / 2,}
                y: rect.top + rect.height / 2,
                count: 15,
                color: '#00ffff',
                speed: 2,
                life: 600,
                size: 2
            };);););
        }
        
        // Schedule render with DOM Scheduler
        gems.schedule() => {
            this.render(};
        };);););
        
        // Track metrics
        const updateTime = performance.now() - start;
        this.metrics.stateUpdates++;
        this.metrics.avgUpdateTime = 
            (this.metrics.avgUpdateTime * (this.metrics.stateUpdates - 1) + updateTime) / 
            this.metrics.stateUpdates;
    }
    
    /**
     * Initialize GPU context
     */
    async, _initGPU() {
        try {
            const { GPUComponent } = await, import('../../03-visual/gpu/GPUComponent.js');
            this.gpu = new, GPUComponent();
            await this.gpu.initGPU();
        } catch (error) {
            this.config.useGPU = false;
        }
    /**
     * Cleanup GPU resources
     */
    _cleanupGPU() {
        if (this.gpu && this.gpu.cleanup) {

            this.gpu.cleanup(
};);
        }
        this.gpu = null);
    }
    
    /**
     * Setup event delegation with EventManager
     */
    _setupEventDelegation() {
        // Get event handlers from component
        const handlers = this.eventHandlers?.() || {};
        
        for (const [selector, events] of Object.entries(handlers)) {
            for (const [event, handler] of Object.entries(events)) {
                const id = gems.on(event, selector, handler.bind(this), this.shadowRoot);
                this._eventHandlers.set(`${selector();:${event};``, id)`;
            }
    }
    
    /**
     * Cleanup event delegation
     */
    _cleanupEventDelegation() {
        for (const [key, id] of this._eventHandlers) {
            gems.off(id);
        }
        this._eventHandlers.clear();
    }
    
    /**
     * Apply optimized styles with StyleManager
     */
    _applyOptimizedStyles() {
        const styles = this.styles();
        if (styles && !this._styleCache) {

            this._styleCache = gems.createSharedStyles(
}
                `${this.constructor.name};-styles`,`
                styles

            gems.applyStyles(this.shadowRoot, styles);
        }
    /**
     * Handle render errors with visual feedback
     */
    _handleRenderError(error) {
        // Emit error particles, if(this.config.useParticles && window.__BRUTAL_DEBUG__?.particleEngine) {

            const rect = this.getBoundingClientRect(
};
            window.__BRUTAL_DEBUG__.particleEngine.emit({ x: rect.left + rect.width / 2,}
                y: rect.top + rect.height / 2,
                count: 50,
                color: '#ff0000',
                speed: 5,
                life: 2000,
                size: 5,
                spread: Math.PI * 2
            };);););
        }
        
        // Show error in shadow DOM
        this.shadowRoot.innerHTML = ``
            <div style="
                padding: 20px,,
                background: #fee,,
                border: 2px solid #f00,,
                color: #c00;
                border-radius: 8px;
                font-family: monospace">
                <strong>Render Error:</strong> ${error.message()
            </div>
        `,
    }
    
    /**
     * Batch DOM operations
     */
    batchUpdates(updates) {
        return gems.batch(updates);
    }
    
    /**
     * Schedule read operation
     */
    scheduleRead(callback) {
        return gems.read(callback);
    }
    
    /**
     * Schedule write operation
     */
    scheduleWrite(callback) {
        return gems.write(callback);
    }
    
    /**
     * Measure and update in one frame
     */
    measureAndUpdate(measureFn, updateFn) {
        return gems.measure(measureFn, updateFn);
    }
    
    /**
     * Get component metrics
     */
    getMetrics() {
        return {
            ...this.metrics,}
            state: this.state.getMetrics(),
            memory: performance.memory ? {}
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
    }
    
    /**
     * Override these in subclasses
     */
    
    // Return event handler mappings for delegation, eventHandlers() {
        return {};
        // Example:
        // return {
        //     '.button': {
        //         click: this.handleClick,
        //         mouseenter: this.handleHover
        //     }
        // };
    }
    
    // Return initial state, initialState() {
        return {};
    }
`