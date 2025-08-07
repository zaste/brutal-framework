/**
 * BRUTAL V4 - Core Integration Layer
 * Unified system that wires all core modules together
 * Provides seamless integration between all framework components
 */

import { BrutalComponent } from '../foundation/Component.js';
import { BrutalState } from '../state/State.js';
import { html, css } from '../templates/Template.js';
import { BrutalEvents } from '../events/Events.js';
import { BrutalRegistry } from '../registry/Registry.js';
import { BrutalRouter } from '../routing/Router.js';
import { BrutalA11y } from '../accessibility/A11y.js';
import { BrutalForms } from '../forms/Forms.js';
import { BrutalDesign } from '../design/DesignSystem.js';

/**
 * BrutalCore - Central integration layer for all framework systems
 * Provides unified APIs and cross-module communication
 */
// WeakMaps for memory-safe storage
const coreInstanceData = new WeakMap();
const componentWiring = new WeakMap();

export class BrutalCore {
    static instance = null;
    static systems = new Map();
    static integrations = new Map();
    static isInitialized = false;
    
    constructor() {
        if (BrutalCore.instance) {
            return BrutalCore.instance;
        }
        
        // Store instance data in WeakMap
        coreInstanceData.set(this, {
            componentInstances: new WeakMap(),
            globalState: null,
            errorHandlers: new Set(),
            performanceMonitors: new Set()
        });
        
        BrutalCore.instance = this;
        this.init();
    }
    
    /**
     * Initialize core integration layer
     */
    init() {
        if (BrutalCore.isInitialized) return;
        
        // Register all core systems
        this.registerSystems();
        
        // Setup cross-system integrations
        this.setupIntegrations();
        
        // Setup global error handling
        this.setupErrorHandling();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        BrutalCore.isInitialized = true;
        
        // Emit initialization event
        this.emit('brutal:core:initialized');
    }
    
    /**
     * Register all core systems
     */
    registerSystems() {
        BrutalCore.systems.set('component', BrutalComponent);
        BrutalCore.systems.set('state', BrutalState);
        BrutalCore.systems.set('events', BrutalEvents);
        BrutalCore.systems.set('registry', BrutalRegistry);
        BrutalCore.systems.set('router', BrutalRouter);
        BrutalCore.systems.set('a11y', BrutalA11y);
        BrutalCore.systems.set('forms', BrutalForms);
        BrutalCore.systems.set('design', BrutalDesign);
    }
    
    /**
     * Setup cross-system integrations
     */
    setupIntegrations() {
        // Component-State integration
        this.setupComponentStateIntegration();
        
        // Router-Component integration
        this.setupRouterComponentIntegration();
        
        // Forms-A11y integration
        this.setupFormsA11yIntegration();
        
        // Design-Component integration
        this.setupDesignComponentIntegration();
        
        // Event system coordination
        this.setupEventCoordination();
    }
    
    /**
     * Wire a component with all necessary systems
     */
    static wireComponent(component) {
        if (!component instanceof BrutalComponent) {
            throw new Error('[BrutalCore] Can only wire BrutalComponent instances');
        }
        
        const instance = BrutalCore.instance || new BrutalCore();
        
        // Store component reference
        instance.componentInstances.set(component, {
            wiredAt: Date.now(),
            systems: new Set(['component'])
        });
        
        // Auto-wire state if component has initial state
        if (component.initialState || component.state) {
            instance.wireComponentState(component);
        }
        
        // Auto-wire events
        instance.wireComponentEvents(component);
        
        // Auto-wire accessibility
        instance.wireComponentA11y(component);
        
        // Auto-wire design system
        instance.wireComponentDesign(component);
        
        return component;
    }
    
    /**
     * Wire component with state management
     */
    wireComponentState(component) {
        const componentData = this.componentInstances.get(component);
        if (!componentData) return;
        
        // Create integrated state if doesn't exist
        if (!component._state) {
            const initialState = component.initialState || component.state || {};
            component._state = new BrutalState(initialState);
            
            // Setup automatic re-rendering on state changes
            component._state.subscribe((changes) => {
                if (component._isConnected) {
                    // Batch renders for performance
                    this.scheduleRender(component);
                }
            });
        }
        
        componentData.systems.add('state');
    }
    
    /**
     * Wire component with event system
     */
    wireComponentEvents(component) {
        const componentData = this.componentInstances.get(component);
        if (!componentData) return;
        
        // Setup integrated event manager
        if (!component._eventManager) {
            component._eventManager = new BrutalEvents(component);
            
            // Setup global event coordination
            component._eventManager.on('*', (event) => {
                this.emit(`component:${event.type}`, {
                    component: component.tagName.toLowerCase(),
                    ...event.detail
                });
            });
        }
        
        componentData.systems.add('events');
    }
    
    /**
     * Wire component with accessibility
     */
    wireComponentA11y(component) {
        const componentData = this.componentInstances.get(component);
        if (!componentData) return;
        
        // Apply automatic accessibility enhancements
        if (component._isConnected) {
            // Auto ARIA roles based on component type
            this.applyAutoA11y(component);
        } else {
            // Apply when connected
            component.addEventListener('brutal:connected', () => {
                this.applyAutoA11y(component);
            });
        }
        
        componentData.systems.add('a11y');
    }
    
    /**
     * Wire component with design system
     */
    wireComponentDesign(component) {
        const componentData = this.componentInstances.get(component);
        if (!componentData) return;
        
        // Apply design tokens and theming
        if (component.shadowRoot) {
            // Inject design system CSS if not already present
            if (!component.shadowRoot.querySelector('[data-brutal-design]')) {
                const designStyle = document.createElement('style');
                designStyle.setAttribute('data-brutal-design', 'true');
                designStyle.textContent = this.getDesignSystemCSS();
                component.shadowRoot.prepend(designStyle);
            }
        }
        
        componentData.systems.add('design');
    }
    
    /**
     * Apply automatic accessibility enhancements
     */
    applyAutoA11y(component) {
        const tagName = component.tagName.toLowerCase();
        
        // Auto-apply ARIA roles based on component name patterns
        if (tagName.includes('button') && !component.getAttribute('role')) {
            BrutalA11y.setRole(component, 'button');
        } else if (tagName.includes('dialog') || tagName.includes('modal')) {
            BrutalA11y.setRole(component, 'dialog');
        } else if (tagName.includes('menu')) {
            BrutalA11y.setRole(component, 'menu');
        }
        
        // Ensure focusable elements have proper tabindex
        if (component.hasAttribute('interactive') && !component.hasAttribute('tabindex')) {
            component.setAttribute('tabindex', '0');
        }
    }
    
    /**
     * Get design system CSS for injection
     */
    getDesignSystemCSS() {
        return `
            :host {
                /* Inherit design tokens */
                color: var(--theme-text-primary, inherit);
                font-family: var(--typography-font-sans, inherit);
            }
            
            /* Focus styles */
            :host(:focus-visible) {
                outline: 2px solid var(--theme-border-focus, #3b82f6);
                outline-offset: 2px;
            }
            
            /* Responsive design */
            @media (prefers-reduced-motion: reduce) {
                :host * {
                    transition: none !important;
                    animation: none !important;
                }
            }
        `;
    }
    
    /**
     * Setup component-state integration
     */
    setupComponentStateIntegration() {
        // Global state change coordination
        BrutalCore.integrations.set('component-state', {
            onStateChange: (component, changes) => {
                this.emit('brutal:state:change', {
                    component: component.tagName.toLowerCase(),
                    changes
                });
            }
        });
    }
    
    /**
     * Setup router-component integration
     */
    setupRouterComponentIntegration() {
        // Listen for route changes to update components
        window.addEventListener('brutal:router:navigation-complete', (event) => {
            const { current } = event.detail;
            
            // Notify all components of route change
            this.componentInstances.forEach((data, component) => {
                if (component.onRouteChange) {
                    component.onRouteChange(current);
                }
            });
        });
        
        BrutalCore.integrations.set('router-component', {
            active: true
        });
    }
    
    /**
     * Setup forms-accessibility integration
     */
    setupFormsA11yIntegration() {
        // Auto-enhance forms with accessibility
        document.addEventListener('brutal:form:enhanced', (event) => {
            const { form } = event.detail;
            
            // Apply accessibility enhancements
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                BrutalA11y.setRole(input, input.type === 'button' ? 'button' : 'textbox');
            });
        });
        
        BrutalCore.integrations.set('forms-a11y', {
            active: true
        });
    }
    
    /**
     * Setup design-component integration
     */
    setupDesignComponentIntegration() {
        // Listen for theme changes to update all components
        document.addEventListener('brutal:design:theme-change', (event) => {
            const { theme } = event.detail;
            
            // Update all components with new theme
            this.componentInstances.forEach((data, component) => {
                if (component.onThemeChange) {
                    component.onThemeChange(theme);
                }
                
                // Force re-render for theme update
                if (component._isConnected) {
                    this.scheduleRender(component);
                }
            });
        });
        
        BrutalCore.integrations.set('design-component', {
            active: true
        });
    }
    
    /**
     * Setup event coordination between systems
     */
    setupEventCoordination() {
        // Central event bus for cross-system communication
        this.globalEventBus = new BrutalEvents(window);
        
        // Coordinate events between all systems
        BrutalCore.integrations.set('event-coordination', {
            eventBus: this.globalEventBus
        });
    }
    
    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        // Component error handling
        window.addEventListener('brutal:error', (event) => {
            const { detail } = event;
            
            // Log error
            console.error('[BrutalCore] System Error:', detail);
            
            // Notify error handlers
            this.errorHandlers.forEach(handler => {
                try {
                    handler(detail);
                } catch (handlerError) {
                    console.error('[BrutalCore] Error handler failed:', handlerError);
                }
            });
        });
    }
    
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor component performance
        window.addEventListener('brutal:render', (event) => {
            const { detail } = event;
            
            // Track render performance
            this.performanceMonitors.forEach(monitor => {
                try {
                    monitor('render', detail);
                } catch (monitorError) {
                    console.error('[BrutalCore] Performance monitor failed:', monitorError);
                }
            });
        });
    }
    
    /**
     * Schedule component render with batching
     */
    scheduleRender(component) {
        if (component._renderScheduled) return;
        
        component._renderScheduled = true;
        
        requestAnimationFrame(() => {
            if (component._isConnected) {
                component.render();
            }
            component._renderScheduled = false;
        });
    }
    
    /**
     * Add error handler
     */
    static addErrorHandler(handler) {
        const instance = BrutalCore.instance || new BrutalCore();
        instance.errorHandlers.add(handler);
        
        return () => instance.errorHandlers.delete(handler);
    }
    
    /**
     * Add performance monitor
     */
    static addPerformanceMonitor(monitor) {
        const instance = BrutalCore.instance || new BrutalCore();
        instance.performanceMonitors.add(monitor);
        
        return () => instance.performanceMonitors.delete(monitor);
    }
    
    /**
     * Get integration status
     */
    static getIntegrationStatus() {
        return {
            initialized: BrutalCore.isInitialized,
            systems: Array.from(BrutalCore.systems.keys()),
            integrations: Array.from(BrutalCore.integrations.keys()),
            components: BrutalCore.instance ? BrutalCore.instance.componentInstances.size : 0
        };
    }
    
    /**
     * Emit global event
     */
    emit(type, detail = {}) {
        const event = new CustomEvent(type, {
            detail,
            bubbles: true,
            composed: true
        });
        
        window.dispatchEvent(event);
        return event;
    }
    
    /**
     * Cleanup core integration
     */
    static cleanup() {
        if (BrutalCore.instance) {
            BrutalCore.instance.componentInstances = new WeakMap();
            BrutalCore.instance.errorHandlers.clear();
            BrutalCore.instance.performanceMonitors.clear();
        }
        
        BrutalCore.systems.clear();
        BrutalCore.integrations.clear();
        BrutalCore.isInitialized = false;
        BrutalCore.instance = null;
    }
}

/**
 * Integration utilities
 */
export const IntegrationUtils = {
    /**
     * Create fully integrated component
     */
    createComponent(tagName, options = {}) {
        const component = document.createElement(tagName);
        
        // Wire with core systems
        BrutalCore.wireComponent(component);
        
        // Apply options
        if (options.state) {
            component._state = new BrutalState(options.state);
        }
        
        if (options.props) {
            Object.entries(options.props).forEach(([key, value]) => {
                component.setAttribute(key, value);
            });
        }
        
        return component;
    },
    
    /**
     * Get component integration info
     */
    getComponentInfo(component) {
        const instance = BrutalCore.instance;
        if (!instance) return null;
        
        return instance.componentInstances.get(component);
    },
    
    /**
     * Check if system is integrated
     */
    isSystemIntegrated(systemName) {
        return BrutalCore.systems.has(systemName);
    }
};

// Auto-initialize core integration
export const brutalCore = new BrutalCore();