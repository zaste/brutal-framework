/**
 * BRUTAL V4 - Core Module Index
 * Pure Native Web Components Framework
 * Zero dependencies, 100% web standards
 */

// Core base (new foundation layer)
export { PolyfillStrategy } from './base/PolyfillStrategy.js';
export { Registry } from './base/Registry.js';
export { ConfigLoader } from './base/ConfigLoader.js';

// Core foundation
export { BrutalComponent } from './foundation/Component.js';

// Enhanced components (new)
export { 
    EnhancedBrutalComponent, 
    LifecycleHooks, 
    HookPhase, 
    registerGlobalHook 
} from './components/index.js';

// State management
export { BrutalState, createState, StateUtils } from './state/State.js';
export { EnhancedBrutalState, createEnhancedState } from './state/EnhancedState.js';

// Template system (now modularized)
export { html, css, template, raw, TemplateUtils, CSSUtils } from './templates/index.js';

// Event system
export { BrutalEvents, EventUtils, EventBus, globalEvents } from './events/Events.js';
export { EventBus as AppEventBus, globalEventBus } from './events/EventBus.js';

// Component registry
export { BrutalRegistry, RegistryUtils } from './registry/Registry.js';

// Routing system
export { BrutalRouter, RouterUtils, RouterOutlet } from './routing/Router.js';
export { EnhancedBrutalRouter, router, route, navigate, back, forward } from './routing/EnhancedRouter.js';

// Accessibility system
export { BrutalA11y, FocusManager, A11yUtils } from './accessibility/A11y.js';
export { FocusVisible } from './a11y/FocusVisible.js';

// Form handling
export { BrutalForms, CommonValidators, FormUtils } from './forms/Forms.js';

// Design system
export { BrutalDesign, DesignUtils, ThemeToggle } from './design/DesignSystem.js';

// Integration layer
export { BrutalCore, IntegrationUtils } from './integration/CoreIntegration.js';

// Error boundaries
export { BrutalErrorBoundary } from './components/ErrorBoundary.js';

// Performance monitoring (now modularized)
export { BrutalPerformance, PerformanceUtils, measure } from './performance/index.js';

// Render scheduling
export { BrutalRenderScheduler, renderScheduler, RenderPriority, SchedulerUtils } from './scheduling/RenderScheduler.js';

// Advanced systems (new)
export { HookSystem, createHookSystem, Pipeline, createPipeline, Middlewares } from './systems/index.js';

// Cache system (new)
export { CacheManager, defaultCache, getCache } from './cache/index.js';

/**
 * Core version and metadata
 */
export const BRUTAL_VERSION = '4.0.0';
export const BRUTAL_BUILD = 'alpha.1';

/**
 * Framework information
 */
export const BRUTAL_INFO = {
    name: 'BRUTAL Framework',
    version: BRUTAL_VERSION,
    build: BRUTAL_BUILD,
    type: 'Native Web Components',
    dependencies: 0,
    standards: ['Custom Elements', 'Shadow DOM', 'ES Modules', 'Template Elements', 'Navigation API', 'ARIA'],
    browsers: ['Chrome 54+', 'Firefox 63+', 'Safari 10.1+', 'Edge 79+']
};

/**
 * Initialize BRUTAL framework
 */
export async function initBrutal(options = {}) {
    const startTime = performance.now();
    
    // Load configuration first
    if (options.configPath) {
        await ConfigLoader.load(options.configPath);
    }
    ConfigLoader.merge(options);
    
    // Check polyfills
    const requiredFeatures = ['constructableStyleSheets', 'requestIdleCallback'];
    const missing = PolyfillStrategy.requires(requiredFeatures);
    if (missing.length > 0) {
        console.log(`[BRUTAL] Loading polyfills for: ${missing.join(', ')}`);
        for (const feature of missing) {
            await PolyfillStrategy.load(feature);
        }
    }
    
    // Validate browser support
    if (!validateBrowserSupport()) {
        throw new Error('BRUTAL Framework requires a browser with Custom Elements support');
    }
    
    // Setup global configuration
    if (ConfigLoader.get('debug')) {
        window.BRUTAL_DEBUG = true;
        console.log('[BRUTAL] Debug mode enabled');
    }
    
    // Setup error handling
    if (options.errorBoundary !== false) {
        setupGlobalErrorHandling();
    }
    
    // Setup performance monitoring
    if (options.performance) {
        setupPerformanceMonitoring();
    }
    
    // Initialize core systems
    if (options.router !== false) {
        // Router auto-initializes
    }
    
    if (options.accessibility !== false) {
        BrutalA11y.init();
    }
    
    if (options.design !== false) {
        BrutalDesign.init();
    }
    
    if (options.forms !== false) {
        // Auto-enhance forms if requested
        if (options.autoEnhanceForms) {
            document.addEventListener('DOMContentLoaded', () => {
                FormUtils.enhanceAll();
            });
        }
    }
    
    const initTime = performance.now() - startTime;
    
    // Mark as initialized
    window.BRUTAL = {
        ...BRUTAL_INFO,
        initialized: true,
        initTime,
        options,
        startTime: performance.now()
    };
    
    // Emit initialization event
    window.dispatchEvent(new CustomEvent('brutal:initialized', {
        detail: { ...BRUTAL_INFO, initTime, options }
    }));
    
    console.log(`[BRUTAL] Framework initialized in ${initTime.toFixed(2)}ms`);
    
    return window.BRUTAL;
}

/**
 * Validate browser support
 */
function validateBrowserSupport() {
    // Check for required APIs
    const required = [
        'customElements',
        'shadowRoot' in Element.prototype,
        'content' in document.createElement('template'),
        'Proxy',
        'EventTarget'
    ];
    
    for (const feature of required) {
        if (typeof feature === 'string') {
            if (!(feature in window)) {
                console.error(`[BRUTAL] Missing required API: ${feature}`);
                return false;
            }
        } else if (!feature) {
            console.error('[BRUTAL] Missing required browser feature');
            return false;
        }
    }
    
    return true;
}

/**
 * Setup global error handling
 */
function setupGlobalErrorHandling() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
        console.error('[BRUTAL] Unhandled error:', event.error);
        
        window.dispatchEvent(new CustomEvent('brutal:error', {
            detail: {
                type: 'unhandled',
                error: event.error?.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            }
        }));
    });
    
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('[BRUTAL] Unhandled promise rejection:', event.reason);
        
        window.dispatchEvent(new CustomEvent('brutal:error', {
            detail: {
                type: 'unhandled-promise',
                error: event.reason?.message || event.reason
            }
        }));
    });
}

/**
 * Setup performance monitoring
 */
function setupPerformanceMonitoring() {
    // Monitor component registrations
    window.addEventListener('brutal:registry:component-registered', (event) => {
        console.log(`[BRUTAL] Component registered: ${event.detail.name} (${event.detail.metadata.registrationTime.toFixed(2)}ms)`);
    });
    
    // Monitor component errors
    window.addEventListener('brutal:registry:component-error', (event) => {
        console.warn(`[BRUTAL] Component error: ${event.detail.name} - ${event.detail.error}`);
    });
    
    // Performance observer for custom elements
    if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name.includes('custom-element')) {
                    console.log(`[BRUTAL] Custom element performance: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
                }
            }
        });
        
        observer.observe({ entryTypes: ['measure'] });
    }
}

/**
 * Get framework status
 */
export function getBrutalStatus() {
    if (!window.BRUTAL) {
        return { initialized: false };
    }
    
    return {
        ...window.BRUTAL,
        registry: BrutalRegistry.getStats(),
        memory: performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
        } : null,
        uptime: performance.now() - (window.BRUTAL.startTime || 0)
    };
}

/**
 * Utility functions
 */
export const BrutalUtils = {
    /**
     * Check if element is a BRUTAL component
     */
    isBrutalComponent(element) {
        return element instanceof BrutalComponent;
    },
    
    /**
     * Get component metadata
     */
    getComponentMetadata(element) {
        if (!element.tagName) return null;
        return BrutalRegistry.get(element.tagName.toLowerCase());
    },
    
    /**
     * Create component instance
     */
    createElement(tagName, props = {}, children = []) {
        const element = document.createElement(tagName);
        
        // Set properties
        Object.entries(props).forEach(([key, value]) => {
            if (key.startsWith('on') && typeof value === 'function') {
                // Event listener
                const event = key.slice(2).toLowerCase();
                element.addEventListener(event, value);
            } else if (typeof value === 'boolean') {
                // Boolean attribute
                if (value) {
                    element.setAttribute(key, '');
                }
            } else {
                // Regular attribute
                element.setAttribute(key, String(value));
            }
        });
        
        // Add children
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        
        return element;
    },
    
    /**
     * Batch DOM operations
     */
    batchDOM(operations) {
        const fragment = document.createDocumentFragment();
        
        operations.forEach(op => op(fragment));
        
        return fragment;
    },
    
    /**
     * Defer operation to next frame
     */
    nextFrame(callback) {
        return requestAnimationFrame(callback);
    },
    
    /**
     * Defer operation to idle time
     */
    whenIdle(callback, options = {}) {
        if ('requestIdleCallback' in window) {
            return requestIdleCallback(callback, options);
        } else {
            return setTimeout(callback, 0);
        }
    }
};

/**
 * Auto-initialize if in browser environment
 */
if (typeof window !== 'undefined' && !window.BRUTAL) {
    // Auto-initialize with default options
    try {
        initBrutal();
    } catch (error) {
        console.error('[BRUTAL] Auto-initialization failed:', error);
    }
}