/**
 * BRUTAL V4 - Lazy Loading Boundary Component
 * Provides lazy loading boundaries for code splitting
 * Uses Intersection Observer for viewport-based loading
 */

import { BrutalComponent } from './Component.js';
import { html, css } from '../templates/index.js';
import { devLog, devWarn } from '../../build/env.js';

/**
 * LazyBoundary - Wraps content for lazy loading
 * Supports viewport-based and manual triggering
 */
export class LazyBoundary extends BrutalComponent {
    static get observedAttributes() {
        return ['component', 'module', 'threshold', 'auto-load', 'placeholder'];
    }
    
    constructor() {
        super();
        
        this.observer = null;
        this.isLoading = false;
        this.isLoaded = false;
        this.loadError = null;
    }
    
    /**
     * Initialize boundary state
     */
    initializeState() {
        super.initializeState();
        
        this._state.set({
            component: this.getAttribute('component'),
            module: this.getAttribute('module'),
            threshold: parseFloat(this.getAttribute('threshold') || '0.1'),
            autoLoad: this.getAttribute('auto-load') !== 'false',
            placeholder: this.getAttribute('placeholder') || 'Loading...',
            loading: false,
            loaded: false,
            error: null
        });
    }
    
    /**
     * Create boundary template
     */
    createTemplate() {
        const state = this._state.getAll();
        
        // Set styles using Constructable StyleSheets
        this.setStyles(this.getBoundaryStyles());
        
        this._template = html`
            <div class="lazy-boundary" data-state="${this.getLoadState()}">
                ${state.error ? html`
                    <div class="lazy-boundary__error">
                        <p>Failed to load component</p>
                        <button @click="${() => this.retry()}">Retry</button>
                    </div>
                ` : state.loaded ? html`
                    <div class="lazy-boundary__content">
                        <slot></slot>
                    </div>
                ` : html`
                    <div class="lazy-boundary__placeholder">
                        ${state.loading ? html`
                            <div class="lazy-boundary__spinner"></div>
                        ` : ''}
                        <p>${state.placeholder}</p>
                    </div>
                `}
            </div>
        `;
    }
    
    /**
     * Get boundary styles
     */
    getBoundaryStyles() {
        return css`
            :host {
                display: block;
                position: relative;
                min-height: 100px;
            }
            
            .lazy-boundary {
                width: 100%;
                height: 100%;
                position: relative;
            }
            
            .lazy-boundary__placeholder {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100px;
                color: var(--theme-text-secondary);
                font-size: var(--text-sm);
            }
            
            .lazy-boundary__spinner {
                width: 32px;
                height: 32px;
                border: 3px solid var(--theme-border-primary);
                border-top-color: var(--color-primary-600);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .lazy-boundary__error {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100px;
                color: var(--color-error-600);
            }
            
            .lazy-boundary__error button {
                margin-top: var(--spacing-2);
                padding: var(--spacing-2) var(--spacing-4);
                background: var(--color-error-600);
                color: white;
                border: none;
                border-radius: var(--borderRadius-md);
                cursor: pointer;
            }
            
            .lazy-boundary__error button:hover {
                background: var(--color-error-700);
            }
            
            .lazy-boundary__content {
                animation: fadeIn 0.3s ease-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @media (prefers-reduced-motion: reduce) {
                .lazy-boundary__spinner {
                    animation: none;
                    border-top-color: transparent;
                }
                
                .lazy-boundary__content {
                    animation: none;
                }
            }
        `;
    }
    
    /**
     * Connected callback
     */
    connectedCallback() {
        super.connectedCallback();
        
        if (this._state.get('autoLoad')) {
            this.setupIntersectionObserver();
        }
    }
    
    /**
     * Disconnected callback
     */
    disconnectedCallback() {
        super.disconnectedCallback();
        
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
    
    /**
     * Setup intersection observer
     */
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            devWarn('IntersectionObserver not supported, loading immediately');
            this.load();
            return;
        }
        
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: this._state.get('threshold')
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoaded && !this.isLoading) {
                    this.load();
                }
            });
        }, options);
        
        this.observer.observe(this);
    }
    
    /**
     * Load the component
     */
    async load() {
        if (this.isLoading || this.isLoaded) return;
        
        this.isLoading = true;
        this._state.set({ loading: true, error: null });
        
        devLog(`Loading lazy component: ${this._state.get('component') || this._state.get('module')}`);
        
        try {
            const component = this._state.get('component');
            const modulePath = this._state.get('module');
            
            if (component) {
                // Load via registry
                const registry = await import('../registry/Registry.js');
                await registry.BrutalRegistry.loadComponent(component);
            } else if (modulePath) {
                // Dynamic import
                await import(modulePath);
            } else {
                throw new Error('No component or module specified');
            }
            
            this.isLoaded = true;
            this._state.set({ loaded: true, loading: false });
            
            // Disconnect observer after loading
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            
            // Emit loaded event
            this.emit('brutal:lazy:loaded', {
                component: component || modulePath
            });
            
        } catch (error) {
            devError('Failed to load lazy component:', error);
            this.loadError = error;
            this._state.set({ 
                error: error.message, 
                loading: false 
            });
            
            // Emit error event
            this.emit('brutal:lazy:error', {
                component: this._state.get('component') || this._state.get('module'),
                error: error.message
            });
        } finally {
            this.isLoading = false;
        }
    }
    
    /**
     * Retry loading
     */
    retry() {
        this.isLoaded = false;
        this.loadError = null;
        this.load();
    }
    
    /**
     * Get load state
     */
    getLoadState() {
        if (this._state.get('error')) return 'error';
        if (this._state.get('loaded')) return 'loaded';
        if (this._state.get('loading')) return 'loading';
        return 'idle';
    }
    
    /**
     * Public API: Force load
     */
    forceLoad() {
        return this.load();
    }
    
    /**
     * Public API: Check if loaded
     */
    get loaded() {
        return this.isLoaded;
    }
}

/**
 * Lazy loading utilities
 */
export class LazyLoader {
    static pendingImports = new Map();
    
    /**
     * Dynamic import with deduplication
     */
    static async import(path) {
        // Check if already importing
        if (this.pendingImports.has(path)) {
            return this.pendingImports.get(path);
        }
        
        // Create import promise
        const importPromise = import(path)
            .finally(() => {
                this.pendingImports.delete(path);
            });
        
        this.pendingImports.set(path, importPromise);
        return importPromise;
    }
    
    /**
     * Preload module (but don't execute)
     */
    static preload(path) {
        if ('link' in document.createElement('link')) {
            const link = document.createElement('link');
            link.rel = 'modulepreload';
            link.href = path;
            document.head.appendChild(link);
        }
    }
    
    /**
     * Prefetch module (lower priority)
     */
    static prefetch(path) {
        if ('link' in document.createElement('link')) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = path;
            link.as = 'script';
            document.head.appendChild(link);
        }
    }
}

// Register lazy boundary component
if (!customElements.get('lazy-boundary')) {
    customElements.define('lazy-boundary', LazyBoundary);
}