/**
 * BRUTAL V4 - Async Component Foundation
 * Extension of BrutalComponent with async lifecycle support
 * Enables async initialization and data fetching
 */

import { BrutalComponent } from './Component.js';
import { devLog, devWarn } from '../../build/env.js';

/**
 * AsyncComponent - Base class for components with async lifecycle
 * Supports async initialization, data fetching, and loading states
 */
export class AsyncComponent extends BrutalComponent {
    constructor() {
        super();
        
        // Async tracking
        this._asyncInitialized = false;
        this._asyncInitializing = false;
        this._asyncError = null;
    }
    
    /**
     * Override connected callback to support async
     */
    connectedCallback() {
        // Call parent first
        super.connectedCallback();
        
        // Then handle async initialization
        this._initializeAsync();
    }
    
    /**
     * Private async initialization
     */
    async _initializeAsync() {
        if (this._asyncInitializing || this._asyncInitialized) return;
        
        this._asyncInitializing = true;
        
        try {
            // Update state to show loading
            if (this._state) {
                this._state.set({ asyncLoading: true });
            }
            
            // Call async lifecycle methods
            await this.beforeAsyncInit();
            await this.asyncInitialize();
            await this.afterAsyncInit();
            
            // Mark as initialized
            this._asyncInitialized = true;
            
            // Update state
            if (this._state) {
                this._state.set({ 
                    asyncLoading: false,
                    asyncReady: true 
                });
            }
            
            // Trigger render
            this.scheduleRender();
            
            // Emit ready event
            this.emit('brutal:async:ready');
            
        } catch (error) {
            this._asyncError = error;
            
            // Update state
            if (this._state) {
                this._state.set({ 
                    asyncLoading: false,
                    asyncError: error.message 
                });
            }
            
            // Handle error
            this._handleError('async-initialization', error);
            
            // Call error handler
            await this.onAsyncError(error);
            
            // Emit error event
            this.emit('brutal:async:error', { error: error.message });
            
        } finally {
            this._asyncInitializing = false;
        }
    }
    
    /**
     * Override disconnected callback
     */
    disconnectedCallback() {
        // Cancel any pending async operations
        this.cancelAsyncOperations();
        
        // Call parent
        super.disconnectedCallback();
    }
    
    /**
     * Async lifecycle hooks - Override in subclasses
     */
    
    /**
     * Called before async initialization
     */
    async beforeAsyncInit() {
        // Override in subclasses
    }
    
    /**
     * Main async initialization - Override in subclasses
     */
    async asyncInitialize() {
        // Override in subclasses
        devLog('AsyncComponent: Override asyncInitialize() in your component');
    }
    
    /**
     * Called after async initialization
     */
    async afterAsyncInit() {
        // Override in subclasses
    }
    
    /**
     * Handle async errors - Override in subclasses
     */
    async onAsyncError(error) {
        // Override in subclasses
        devWarn('AsyncComponent error:', error);
    }
    
    /**
     * Cancel async operations - Override in subclasses
     */
    cancelAsyncOperations() {
        // Override in subclasses to cancel fetch requests, timers, etc.
    }
    
    /**
     * Utility methods for async operations
     */
    
    /**
     * Fetch data with timeout and cancellation
     */
    async fetchData(url, options = {}) {
        const controller = new AbortController();
        const timeout = options.timeout || 30000;
        
        // Store controller for cancellation
        this._fetchController = controller;
        
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            throw error;
        }
    }
    
    /**
     * Load async script
     */
    async loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Wait for condition with timeout
     */
    async waitFor(condition, timeout = 5000, interval = 100) {
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const check = () => {
                if (condition()) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Timeout waiting for condition'));
                } else {
                    setTimeout(check, interval);
                }
            };
            
            check();
        });
    }
    
    /**
     * Retry async operation
     */
    async retry(fn, retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === retries - 1) throw error;
                
                devLog(`Retry ${i + 1}/${retries} after error:`, error.message);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    /**
     * Get async state
     */
    get asyncState() {
        return {
            initialized: this._asyncInitialized,
            initializing: this._asyncInitializing,
            error: this._asyncError,
            ready: this._asyncInitialized && !this._asyncError
        };
    }
    
    /**
     * Re-initialize async (useful for error recovery)
     */
    async reinitialize() {
        this._asyncInitialized = false;
        this._asyncError = null;
        await this._initializeAsync();
    }
}

/**
 * Async component with data fetching
 */
export class AsyncDataComponent extends AsyncComponent {
    constructor() {
        super();
        
        this._data = null;
        this._dataError = null;
    }
    
    /**
     * Override async initialize to fetch data
     */
    async asyncInitialize() {
        const dataUrl = this.getDataUrl();
        if (!dataUrl) return;
        
        try {
            this._data = await this.fetchData(dataUrl, this.getFetchOptions());
            
            // Update state with data
            if (this._state) {
                this._state.set({ data: this._data });
            }
            
            // Process data
            await this.processData(this._data);
            
        } catch (error) {
            this._dataError = error;
            throw new Error(`Failed to fetch data: ${error.message}`);
        }
    }
    
    /**
     * Get data URL - Override in subclasses
     */
    getDataUrl() {
        return this.getAttribute('data-url');
    }
    
    /**
     * Get fetch options - Override in subclasses
     */
    getFetchOptions() {
        return {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };
    }
    
    /**
     * Process fetched data - Override in subclasses
     */
    async processData(data) {
        // Override in subclasses
    }
    
    /**
     * Get data
     */
    get data() {
        return this._data;
    }
}