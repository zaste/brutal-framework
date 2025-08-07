/**
 * BRUTAL V4 - Core Component Foundation
 * Pure Native Web Component base class
 * Zero dependencies, 100% web standards compliant
 */

// Import core systems for integration
import { BrutalState } from '../state/State.js';
import { BrutalEvents } from '../events/Events.js';
import { html, css } from '../templates/index.js';
import { renderScheduler, RenderPriority } from '../scheduling/RenderScheduler.js';
import { FocusVisible } from '../a11y/FocusVisible.js';
import { devLog, devWarn, devError, devAssert } from '../../build/env.js';

// WeakMaps for private storage (memory efficient)
const componentTemplates = new WeakMap();
const componentStyles = new WeakMap();
const componentStates = new WeakMap();
const componentInternals = new WeakMap();

/**
 * BrutalComponent - Foundation class for all BRUTAL components
 * Extends HTMLElement with optimized patterns for performance
 * 
 * Features:
 * - Shadow DOM encapsulation
 * - Reactive state management integration
 * - Template system integration
 * - Event system integration
 * - Lifecycle management
 * - Error boundaries
 * - Performance optimizations
 * - Constructable StyleSheets support
 * - ElementInternals API for form participation
 */
export class BrutalComponent extends HTMLElement {
    /**
     * Form-associated custom element flag
     * Override in form components
     */
    static formAssociated = false;
    constructor() {
        super();
        
        // Core shadow DOM setup
        this.attachShadow({ mode: 'open' });
        
        // Component state
        this._state = null;
        this._template = null;
        this._styles = null;
        this._styleSheet = null; // Constructable StyleSheet
        
        // Event management
        this._listeners = new Map();
        this._eventManager = null;
        
        // Performance tracking
        this._renderCount = 0;
        this._lastRender = 0;
        this._isRendering = false;
        
        // Lifecycle tracking
        this._isConnected = false;
        this._isInitialized = false;
        
        // Error handling
        this._errorBoundary = true;
        
        // ElementInternals support
        this._internals = null;
        if (this.constructor.formAssociated) {
            this._internals = this.attachInternals();
        }
        
        // Initialize component
        this._initialize();
    }
    
    /**
     * Private initialization method
     */
    _initialize() {
        try {
            // Initialize focus visible polyfill
            FocusVisible.init();
            
            // Create event manager
            this._eventManager = new BrutalEventManager(this);
            
            // Initialize state if needed
            this.initializeState();
            
            // Create template
            this.createTemplate();
            
            // Mark as initialized
            this._isInitialized = true;
            
        } catch (error) {
            this._handleError('initialization', error);
        }
    }
    
    /**
     * Lifecycle: Connected to DOM
     */
    connectedCallback() {
        try {
            this._isConnected = true;
            
            // Schedule initial render with high priority
            this.scheduleRender(RenderPriority.ANIMATION);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Call user lifecycle
            this.onConnected();
            
            // Emit connected event
            this.emit('brutal:connected');
            
        } catch (error) {
            this._handleError('connected', error);
        }
    }
    
    /**
     * Lifecycle: Disconnected from DOM
     */
    disconnectedCallback() {
        try {
            this._isConnected = false;
            
            // Cancel any scheduled renders
            renderScheduler.cancel(this);
            
            // Cleanup
            this.cleanup();
            
            // Call user lifecycle
            this.onDisconnected();
            
            // Emit disconnected event
            this.emit('brutal:disconnected');
            
        } catch (error) {
            this._handleError('disconnected', error);
        }
    }
    
    /**
     * Protected setters for templates and styles
     */
    set _template(template) {
        componentTemplates.set(this, template);
    }
    
    get _template() {
        return componentTemplates.get(this);
    }
    
    set _styles(styles) {
        componentStyles.set(this, styles);
    }
    
    get _styles() {
        return componentStyles.get(this);
    }
    
    set _state(state) {
        componentStates.set(this, state);
    }
    
    get _state() {
        return componentStates.get(this);
    }
    
    /**
     * Lifecycle: Attribute changed
     */
    attributeChangedCallback(name, oldValue, newValue) {
        try {
            if (oldValue !== newValue) {
                this.onAttributeChanged(name, oldValue, newValue);
                
                // Schedule re-render if connected
                if (this._isConnected) {
                    this.scheduleRender(RenderPriority.BACKGROUND);
                }
                
                // Emit attribute change event
                this.emit('brutal:attribute-changed', {
                    name, oldValue, newValue
                });
            }
        } catch (error) {
            this._handleError('attribute-changed', error);
        }
    }
    
    /**
     * Schedule a render via RenderScheduler
     * @param {number} priority - Render priority level
     */
    scheduleRender(priority = RenderPriority.BACKGROUND) {
        if (this._isConnected) {
            renderScheduler.schedule(this, priority);
        }
    }
    
    /**
     * Render the component (called by scheduler or directly)
     */
    render() {
        try {
            // Prevent concurrent renders
            if (this._isRendering) {
                return;
            }
            
            this._isRendering = true;
            const startTime = performance.now();
            
            // Clear shadow root
            this.shadowRoot.replaceChildren();
            
            // Add styles using Constructable StyleSheets if supported
            if (this._styles || this._styleSheet) {
                if (this._styleSheet && this.shadowRoot.adoptedStyleSheets !== undefined) {
                    // Use Constructable StyleSheets (modern approach)
                    this.shadowRoot.adoptedStyleSheets = [this._styleSheet];
                } else if (this._styles) {
                    // Fallback to style element
                    const styleElement = document.createElement('style');
                    styleElement.textContent = this._styles;
                    this.shadowRoot.appendChild(styleElement);
                }
            }
            
            // Add template if present
            if (this._template) {
                const content = this._template.content.cloneNode(true);
                this.shadowRoot.appendChild(content);
            }
            
            // Post-render setup
            this.onRender();
            
            // Update performance metrics
            this._renderCount++;
            this._lastRender = performance.now() - startTime;
            
            // Emit render event
            this.emit('brutal:render', {
                renderTime: this._lastRender,
                renderCount: this._renderCount
            });
            
        } catch (error) {
            this._handleError('render', error);
        } finally {
            this._isRendering = false;
        }
    }
    
    /**
     * Force immediate render (bypasses scheduler)
     */
    forceRender() {
        renderScheduler.forceRender(this);
    }
    
    /**
     * Initialize component state - Override in subclasses
     */
    initializeState() {
        // Create default state if not overridden
        if (!this._state) {
            this._state = new BrutalState({});
            
            // Subscribe to state changes for auto re-render
            this._state.subscribe(() => {
                if (this._isConnected) {
                    // State changes typically from user input
                    this.scheduleRender(RenderPriority.USER_INPUT);
                }
            });
        }
    }
    
    /**
     * Create component template - Override in subclasses
     */
    createTemplate() {
        // Default empty template with slot
        if (!this._template) {
            this._template = html`<slot></slot>`;
        }
    }
    
    /**
     * Setup event listeners - Override in subclasses
     */
    setupEventListeners() {
        // Setup event manager
        if (!this._eventManager) {
            this._eventManager = new BrutalEvents(this);
        }
    }
    
    /**
     * Component connected lifecycle - Override in subclasses
     */
    onConnected() {
        // Override in subclasses
    }
    
    /**
     * Component disconnected lifecycle - Override in subclasses
     */
    onDisconnected() {
        // Override in subclasses
    }
    
    /**
     * Attribute changed lifecycle - Override in subclasses
     */
    onAttributeChanged(name, oldValue, newValue) {
        // Override in subclasses
    }
    
    /**
     * Post-render lifecycle - Override in subclasses
     */
    onRender() {
        // Override in subclasses
    }
    
    /**
     * State management
     */
    setState(updates) {
        if (this._state) {
            this._state.set(updates);
        }
    }
    
    getState(key) {
        if (this._state) {
            return this._state.get(key);
        }
        return undefined;
    }
    
    updateState(updater) {
        if (this._state) {
            this._state.update(updater);
        }
    }
    
    /**
     * Event management
     */
    on(event, handler, options = {}) {
        if (this._eventManager) {
            this._eventManager.on(event, handler, options);
        }
    }
    
    off(event, handler) {
        if (this._eventManager) {
            this._eventManager.off(event, handler);
        }
    }
    
    emit(event, detail = {}) {
        this.dispatchEvent(new CustomEvent(event, {
            detail,
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Query shadow DOM
     */
    query(selector) {
        return this.shadowRoot.querySelector(selector);
    }
    
    queryAll(selector) {
        return this.shadowRoot.querySelectorAll(selector);
    }
    
    /**
     * Utility methods
     */
    addClass(className) {
        this.classList.add(className);
    }
    
    removeClass(className) {
        this.classList.remove(className);
    }
    
    toggleClass(className, force) {
        this.classList.toggle(className, force);
    }
    
    hasClass(className) {
        return this.classList.contains(className);
    }
    
    /**
     * Performance metrics
     */
    getMetrics() {
        return {
            renderCount: this._renderCount,
            lastRenderTime: this._lastRender,
            isConnected: this._isConnected,
            isInitialized: this._isInitialized
        };
    }
    
    /**
     * Set component styles using Constructable StyleSheets
     * @param {string|CSSStyleSheet} styles - CSS string or StyleSheet object
     */
    setStyles(styles) {
        if (typeof CSSStyleSheet !== 'undefined' && this.shadowRoot.adoptedStyleSheets !== undefined) {
            // Modern browser with Constructable StyleSheets support
            if (styles instanceof CSSStyleSheet) {
                this._styleSheet = styles;
            } else if (typeof styles === 'string') {
                // Create new stylesheet
                this._styleSheet = new CSSStyleSheet();
                this._styleSheet.replaceSync(styles);
            }
            
            // Apply immediately if connected
            if (this._isConnected && this._styleSheet) {
                this.shadowRoot.adoptedStyleSheets = [this._styleSheet];
            }
        } else {
            // Fallback for older browsers
            this._styles = styles.toString();
            
            // Re-render if connected to apply styles
            if (this._isConnected) {
                this.scheduleRender();
            }
        }
    }
    
    /**
     * Get adopted stylesheets
     */
    getStyleSheets() {
        if (this.shadowRoot.adoptedStyleSheets !== undefined) {
            return this.shadowRoot.adoptedStyleSheets;
        }
        return [];
    }
    
    /**
     * Add shared stylesheet
     * @param {CSSStyleSheet} styleSheet - Shared stylesheet to adopt
     */
    adoptStyleSheet(styleSheet) {
        if (this.shadowRoot.adoptedStyleSheets !== undefined && styleSheet instanceof CSSStyleSheet) {
            const sheets = [...this.shadowRoot.adoptedStyleSheets];
            if (!sheets.includes(styleSheet)) {
                sheets.push(styleSheet);
                this.shadowRoot.adoptedStyleSheets = sheets;
            }
        }
    }
    
    /**
     * ElementInternals API methods
     */
    
    /**
     * Get ElementInternals instance
     */
    get internals() {
        return this._internals;
    }
    
    /**
     * Form-associated custom element lifecycle
     */
    formAssociatedCallback(form) {
        devLog('Form associated:', form);
        this.onFormAssociated(form);
    }
    
    formDisabledCallback(disabled) {
        devLog('Form disabled state changed:', disabled);
        this.onFormDisabled(disabled);
    }
    
    formResetCallback() {
        devLog('Form reset');
        this.onFormReset();
    }
    
    formStateRestoreCallback(state, mode) {
        devLog('Form state restore:', state, mode);
        this.onFormStateRestore(state, mode);
    }
    
    /**
     * Form lifecycle hooks - Override in subclasses
     */
    onFormAssociated(form) {}
    onFormDisabled(disabled) {}
    onFormReset() {}
    onFormStateRestore(state, mode) {}
    
    /**
     * Form value management
     */
    get value() {
        return this._internals?.value || '';
    }
    
    set value(val) {
        if (this._internals) {
            this._internals.setFormValue(val);
        }
    }
    
    /**
     * Form validity management
     */
    setValidity(validity, message, anchor) {
        if (this._internals) {
            this._internals.setValidity(validity, message, anchor);
        }
    }
    
    checkValidity() {
        return this._internals?.checkValidity() || true;
    }
    
    reportValidity() {
        return this._internals?.reportValidity() || true;
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        try {
            // Cleanup state subscriptions
            if (this._state && this._state.cleanup) {
                this._state.cleanup();
            }
            
            // Cleanup event manager
            if (this._eventManager && this._eventManager.cleanup) {
                this._eventManager.cleanup();
            }
            
            // Clear listeners map
            this._listeners.clear();
            
            // Clear references
            this._state = null;
            this._eventManager = null;
            this._template = null;
            this._styles = null;
            
            // Call user cleanup
            this.onCleanup();
            
        } catch (error) {
            this._handleError('cleanup', error);
        }
    }
    
    /**
     * User cleanup - Override in subclasses
     */
    onCleanup() {
        // Override in subclasses
    }
    
    /**
     * Error handling
     */
    _handleError(phase, error) {
        if (this._errorBoundary) {
            console.error(`[BrutalComponent] Error in ${phase}:`, error);
            
            // Emit error event
            this.emit('brutal:error', {
                phase,
                error: error.message,
                stack: error.stack
            });
            
            // Call user error handler
            this.onError(phase, error);
        } else {
            throw error;
        }
    }
    
    /**
     * User error handler - Override in subclasses
     */
    onError(phase, error) {
        // Override in subclasses
    }
    
    /**
     * Enable/disable error boundary
     */
    setErrorBoundary(enabled) {
        this._errorBoundary = enabled;
    }
}

/**
 * Simple Event Manager for components
 */
// WeakMap for event manager data
const eventManagerData = new WeakMap();

class BrutalEventManager {
    constructor(component) {
        eventManagerData.set(this, {
            component: component,
            listeners: new Map()
        });
    }
    
    on(event, handler, options = {}) {
        const data = eventManagerData.get(this);
        const element = options.element || data.component;
        const wrappedHandler = options.once 
            ? this._createOnceHandler(handler, event)
            : handler;
            
        element.addEventListener(event, wrappedHandler, options);
        
        const key = this._createKey(event, handler);
        data.listeners.set(key, {
            element,
            event,
            handler: wrappedHandler,
            originalHandler: handler,
            options
        });
    }
    
    off(event, handler) {
        const data = eventManagerData.get(this);
        const key = this._createKey(event, handler);
        const listener = data.listeners.get(key);
        
        if (listener) {
            listener.element.removeEventListener(
                listener.event, 
                listener.handler,
                listener.options
            );
            data.listeners.delete(key);
        }
    }
    
    cleanup() {
        const data = eventManagerData.get(this);
        if (!data) return;
        
        for (const [key, listener] of data.listeners) {
            listener.element.removeEventListener(
                listener.event,
                listener.handler,
                listener.options
            );
        }
        data.listeners.clear();
        eventManagerData.delete(this);
    }
    
    _createKey(event, handler) {
        return `${event}-${handler.toString().slice(0, 50)}`;
    }
    
    _createOnceHandler(handler, event) {
        return (...args) => {
            handler(...args);
            this.off(event, handler);
        };
    }
}

/**
 * Export for use in other modules
 */
export { BrutalEventManager };