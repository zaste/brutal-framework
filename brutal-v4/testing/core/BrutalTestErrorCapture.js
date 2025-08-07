/**
 * BrutalTestErrorCapture - Core error capture for test system
 * 
 * Integrated error detection that follows the symbiotic philosophy.
 * Tests can detect their own errors and browser issues.
 */

import { BrutalEvents } from '../../core/events/Events.js';

export class BrutalTestErrorCapture extends BrutalEvents {
    constructor() {
        super();
        
        this.errors = {
            runtime: [],
            console: [],
            promise: [],
            network: [],
            resource: [],
            syntax: [],
            module: []
        };
        
        this.isCapturing = false;
        this.listeners = new Map();
        this.originalConsole = {};
    }
    
    /**
     * Initialize error detection system
     */
    init() {
        if (this.isCapturing) return;
        
        this.isCapturing = true;
        
        // Capture runtime errors
        this._captureRuntimeErrors();
        
        // Capture promise rejections
        this._capturePromiseRejections();
        
        // Intercept console
        this._interceptConsole();
        
        // Capture network errors
        this._captureNetworkErrors();
        
        // Capture module loading errors
        this._captureModuleErrors();
        
        // Monitor DOM for issues
        this._monitorDOM();
        
        console.log('[BrutalTestErrorCapture] Initialized');
    }
    
    /**
     * Capture runtime errors
     */
    _captureRuntimeErrors() {
        const handler = (event) => {
            const error = {
                type: 'runtime',
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack,
                timestamp: Date.now(),
                userAgent: navigator.userAgent
            };
            
            this.errors.runtime.push(error);
            this._notifyListeners('error', error);
            
            // Don't prevent default - let errors show in console
            return true;
        };
        
        window.addEventListener('error', handler, true);
        this.listeners.set('error', handler);
    }
    
    /**
     * Capture unhandled promise rejections
     */
    _capturePromiseRejections() {
        const handler = (event) => {
            const error = {
                type: 'promise',
                reason: event.reason,
                promise: event.promise,
                stack: event.reason?.stack || new Error().stack,
                timestamp: Date.now()
            };
            
            // Try to get more info
            if (event.reason instanceof Error) {
                error.message = event.reason.message;
                error.name = event.reason.name;
            } else {
                error.message = String(event.reason);
            }
            
            this.errors.promise.push(error);
            this._notifyListeners('promise', error);
        };
        
        window.addEventListener('unhandledrejection', handler, true);
        this.listeners.set('unhandledrejection', handler);
    }
    
    /**
     * Intercept console methods
     */
    _interceptConsole() {
        // Save originals
        this.originalConsole = {
            error: console.error,
            warn: console.warn,
            assert: console.assert
        };
        
        // Override console.error
        console.error = (...args) => {
            const error = {
                type: 'console.error',
                args: this._serializeArgs(args),
                stack: new Error().stack,
                timestamp: Date.now()
            };
            
            this.errors.console.push(error);
            this._notifyListeners('console', error);
            
            // Call original
            this.originalConsole.error.apply(console, args);
        };
        
        // Override console.warn
        console.warn = (...args) => {
            const error = {
                type: 'console.warn',
                args: this._serializeArgs(args),
                stack: new Error().stack,
                timestamp: Date.now()
            };
            
            this.errors.console.push(error);
            this._notifyListeners('console', error);
            
            // Call original
            this.originalConsole.warn.apply(console, args);
        };
        
        // Override console.assert
        console.assert = (condition, ...args) => {
            if (!condition) {
                const error = {
                    type: 'console.assert',
                    args: this._serializeArgs(args),
                    stack: new Error().stack,
                    timestamp: Date.now()
                };
                
                this.errors.console.push(error);
                this._notifyListeners('console', error);
            }
            
            // Call original
            this.originalConsole.assert.apply(console, [condition, ...args]);
        };
    }
    
    /**
     * Capture network errors
     */
    _captureNetworkErrors() {
        // Monitor failed resource loads
        const resourceHandler = (event) => {
            if (event.target.tagName) {
                const error = {
                    type: 'resource',
                    tagName: event.target.tagName,
                    src: event.target.src || event.target.href,
                    message: `Failed to load ${event.target.tagName}`,
                    timestamp: Date.now()
                };
                
                this.errors.resource.push(error);
                this._notifyListeners('resource', error);
            }
        };
        
        window.addEventListener('error', resourceHandler, true);
        
        // Monitor fetch failures
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                if (!response.ok) {
                    const error = {
                        type: 'network',
                        url: args[0],
                        status: response.status,
                        statusText: response.statusText,
                        timestamp: Date.now()
                    };
                    
                    this.errors.network.push(error);
                    this._notifyListeners('network', error);
                }
                
                return response;
            } catch (err) {
                const error = {
                    type: 'network',
                    url: args[0],
                    message: err.message,
                    timestamp: Date.now()
                };
                
                this.errors.network.push(error);
                this._notifyListeners('network', error);
                
                throw err;
            }
        };
    }
    
    /**
     * Capture module loading errors
     */
    _captureModuleErrors() {
        // Already captured by runtime errors, but we can be more specific
        const handler = (event) => {
            if (event.filename && event.filename.endsWith('.js')) {
                const error = {
                    type: 'module',
                    module: event.filename,
                    message: event.message,
                    line: event.lineno,
                    column: event.colno,
                    timestamp: Date.now()
                };
                
                // Check if it's an import error
                if (event.message.includes('import') || event.message.includes('export')) {
                    error.subtype = 'import';
                }
                
                this.errors.module.push(error);
                this._notifyListeners('module', error);
            }
        };
        
        window.addEventListener('error', handler, true);
    }
    
    /**
     * Monitor DOM for issues
     */
    _monitorDOM() {
        // Check for custom elements that fail to upgrade
        const checkCustomElements = () => {
            const undefinedElements = document.querySelectorAll(':not(:defined)');
            
            undefinedElements.forEach(element => {
                const tagName = element.tagName.toLowerCase();
                
                // Skip known HTML elements
                if (!tagName.includes('-')) return;
                
                const error = {
                    type: 'custom-element',
                    tagName,
                    message: `Custom element <${tagName}> is not defined`,
                    timestamp: Date.now()
                };
                
                // Only add if not already reported
                const exists = this.errors.runtime.some(e => 
                    e.type === 'custom-element' && e.tagName === tagName
                );
                
                if (!exists) {
                    this.errors.runtime.push(error);
                    this._notifyListeners('custom-element', error);
                }
            });
        };
        
        // Check periodically
        setInterval(checkCustomElements, 1000);
        
        // Also check on DOM changes
        const observer = new MutationObserver(checkCustomElements);
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * Serialize arguments for storage
     */
    _serializeArgs(args) {
        return args.map(arg => {
            try {
                if (arg instanceof Error) {
                    return {
                        name: arg.name,
                        message: arg.message,
                        stack: arg.stack
                    };
                } else if (typeof arg === 'object') {
                    return JSON.stringify(arg, null, 2);
                } else {
                    return String(arg);
                }
            } catch (e) {
                return '[Unserializable]';
            }
        });
    }
    
    /**
     * Notify listeners of new errors
     */
    _notifyListeners(type, error) {
        // Emit through EventEmitter
        this.emit('error', { type, error });
        
        // Also emit global event for debugging
        window.dispatchEvent(new CustomEvent('brutal:error', {
            detail: { type, error }
        }));
    }
    
    /**
     * Get all captured errors
     */
    getAllErrors() {
        const allErrors = [];
        
        Object.entries(this.errors).forEach(([category, errors]) => {
            errors.forEach(error => {
                allErrors.push({
                    ...error,
                    category
                });
            });
        });
        
        // Sort by timestamp
        allErrors.sort((a, b) => a.timestamp - b.timestamp);
        
        return allErrors;
    }
    
    /**
     * Get error summary
     */
    getSummary() {
        const summary = {
            total: 0,
            byCategory: {},
            critical: [],
            recent: []
        };
        
        Object.entries(this.errors).forEach(([category, errors]) => {
            summary.byCategory[category] = errors.length;
            summary.total += errors.length;
            
            // Find critical errors
            errors.forEach(error => {
                if (error.type === 'runtime' || error.type === 'syntax') {
                    summary.critical.push(error);
                }
            });
        });
        
        // Get recent errors (last 10)
        summary.recent = this.getAllErrors().slice(-10);
        
        return summary;
    }
    
    /**
     * Clear all captured errors
     */
    clear() {
        Object.keys(this.errors).forEach(key => {
            this.errors[key] = [];
        });
    }
    
    /**
     * Destroy error detection
     */
    destroy() {
        // Remove event listeners
        this.listeners.forEach((handler, event) => {
            window.removeEventListener(event, handler, true);
        });
        
        // Restore console
        Object.assign(console, this.originalConsole);
        
        this.isCapturing = false;
        this.clear();
    }
}

// Global instance for convenience
export const globalErrorCapture = new BrutalTestErrorCapture();