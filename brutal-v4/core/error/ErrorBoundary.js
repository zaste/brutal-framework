/**
 * BRUTAL V4 - Error Boundary System
 * Component-level error isolation and recovery
 * Prevents error cascades across the component tree
 */

import { BrutalComponent } from '../foundation/Component.js';
import { html, css } from '../templates/Template.js';

/**
 * BrutalErrorBoundary - Error isolation component
 * Catches and handles errors from child components
 */
export class BrutalErrorBoundary extends BrutalComponent {
    constructor() {
        super();
        
        this.errorInfo = null;
        this.hasError = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // Error recovery strategies
        this.recoveryStrategies = new Map([
            ['component-render', this.recoverFromRenderError.bind(this)],
            ['component-lifecycle', this.recoverFromLifecycleError.bind(this)],
            ['state-update', this.recoverFromStateError.bind(this)],
            ['event-handler', this.recoverFromEventError.bind(this)]
        ]);
    }
    
    static get observedAttributes() {
        return ['fallback-component', 'retry-limit', 'auto-recover'];
    }
    
    /**
     * Initialize error boundary
     */
    initializeState() {
        super.initializeState();
        
        // Setup error catching
        this.setupErrorCatching();
        
        // Setup recovery mechanism
        this.setupRecovery();
    }
    
    /**
     * Create error boundary template
     */
    createTemplate() {
        if (this.hasError) {
            this._template = this.createErrorTemplate();
        } else {
            this._template = html`
                <style>
                    ${css`
                        :host {
                            display: block;
                            position: relative;
                        }
                        
                        .error-boundary {
                            min-height: inherit;
                        }
                        
                        .error-overlay {
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: rgba(255, 0, 0, 0.1);
                            border: 2px dashed #ff0000;
                            display: none;
                            align-items: center;
                            justify-content: center;
                            z-index: 1000;
                        }
                        
                        :host([debug]) .error-overlay {
                            display: flex;
                        }
                    `}
                </style>
                <div class="error-boundary">
                    <slot></slot>
                </div>
                <div class="error-overlay">
                    <div>Error Boundary Active</div>
                </div>
            `;
        }
    }
    
    /**
     * Create error display template
     */
    createErrorTemplate() {
        const fallbackComponent = this.getAttribute('fallback-component');
        
        if (fallbackComponent) {
            // Use custom fallback component
            return html`
                <${fallbackComponent} 
                    error-info="${JSON.stringify(this.errorInfo)}">
                </${fallbackComponent}>
            `;
        }
        
        // Default error UI
        return html`
            <style>
                ${css`
                    .error-container {
                        padding: var(--spacing-4, 1rem);
                        background: var(--color-error-50, #fef2f2);
                        border: 1px solid var(--color-error-200, #fecaca);
                        border-radius: var(--borderRadius-md, 0.375rem);
                        color: var(--color-error-800, #991b1b);
                    }
                    
                    .error-title {
                        font-weight: var(--font-semibold, 600);
                        margin-bottom: var(--spacing-2, 0.5rem);
                    }
                    
                    .error-message {
                        margin-bottom: var(--spacing-3, 0.75rem);
                        font-family: var(--font-mono, monospace);
                        font-size: var(--text-sm, 0.875rem);
                    }
                    
                    .error-actions {
                        display: flex;
                        gap: var(--spacing-2, 0.5rem);
                    }
                    
                    .error-button {
                        padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
                        background: var(--color-error-600, #dc2626);
                        color: white;
                        border: none;
                        border-radius: var(--borderRadius-base, 0.25rem);
                        cursor: pointer;
                        font-size: var(--text-sm, 0.875rem);
                    }
                    
                    .error-button:hover {
                        background: var(--color-error-700, #b91c1c);
                    }
                    
                    .error-button--secondary {
                        background: transparent;
                        color: var(--color-error-700, #b91c1c);
                        border: 1px solid var(--color-error-300, #fca5a5);
                    }
                    
                    .error-details {
                        margin-top: var(--spacing-3, 0.75rem);
                        padding: var(--spacing-2, 0.5rem);
                        background: var(--color-neutral-100, #f5f5f5);
                        border-radius: var(--borderRadius-base, 0.25rem);
                        font-family: var(--font-mono, monospace);
                        font-size: var(--text-xs, 0.75rem);
                        white-space: pre-wrap;
                        overflow: auto;
                        max-height: 200px;
                    }
                    
                    .retry-info {
                        margin-top: var(--spacing-2, 0.5rem);
                        font-size: var(--text-sm, 0.875rem);
                        color: var(--color-error-600, #dc2626);
                    }
                `}
            </style>
            <div class="error-container">
                <div class="error-title">
                    ⚠️ Component Error
                </div>
                <div class="error-message">
                    ${this.errorInfo?.message || 'An unexpected error occurred'}
                </div>
                <div class="error-actions">
                    <button class="error-button" onclick="this.parentElement.parentElement.parentElement.host.retry()">
                        Retry
                    </button>
                    <button class="error-button error-button--secondary" onclick="this.parentElement.parentElement.parentElement.host.recover()">
                        Recover
                    </button>
                </div>
                ${this.retryCount > 0 ? html`
                    <div class="retry-info">
                        Retry attempts: ${this.retryCount}/${this.maxRetries}
                    </div>
                ` : ''}
                ${window.BRUTAL_DEBUG ? html`
                    <details>
                        <summary>Error Details</summary>
                        <div class="error-details">${this.errorInfo?.stack || 'No stack trace available'}</div>
                    </details>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Setup error catching mechanisms
     */
    setupErrorCatching() {
        // Catch unhandled errors in child components
        this.addEventListener('brutal:error', this.handleChildError.bind(this));
        
        // Catch Promise rejections
        this.addEventListener('brutal:promise-rejection', this.handlePromiseRejection.bind(this));
        
        // Catch render errors
        this.addEventListener('brutal:render-error', this.handleRenderError.bind(this));
        
        // Override error handling for child components
        this.setupChildErrorOverrides();
    }
    
    /**
     * Setup child component error overrides
     */
    setupChildErrorOverrides() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName?.includes('-')) {
                        this.wrapChildComponent(node);
                    }
                });
            });
        });
        
        observer.observe(this, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * Wrap child component with error handling
     */
    wrapChildComponent(component) {
        if (component._errorBoundaryWrapped) return;
        
        // Store original methods
        const originalRender = component.render?.bind(component);
        const originalConnectedCallback = component.connectedCallback?.bind(component);
        const originalDisconnectedCallback = component.disconnectedCallback?.bind(component);
        
        // Wrap render method
        if (originalRender) {
            component.render = (...args) => {
                try {
                    return originalRender(...args);
                } catch (error) {
                    this.catchError('component-render', error, component);
                }
            };
        }
        
        // Wrap lifecycle methods
        if (originalConnectedCallback) {
            component.connectedCallback = (...args) => {
                try {
                    return originalConnectedCallback(...args);
                } catch (error) {
                    this.catchError('component-lifecycle', error, component);
                }
            };
        }
        
        if (originalDisconnectedCallback) {
            component.disconnectedCallback = (...args) => {
                try {
                    return originalDisconnectedCallback(...args);
                } catch (error) {
                    this.catchError('component-lifecycle', error, component);
                }
            };
        }
        
        component._errorBoundaryWrapped = true;
    }
    
    /**
     * Setup recovery mechanisms
     */
    setupRecovery() {
        // Auto-recovery timer
        if (this.hasAttribute('auto-recover')) {
            const interval = parseInt(this.getAttribute('auto-recover')) || 5000;
            setTimeout(() => {
                if (this.hasError && this.retryCount < this.maxRetries) {
                    this.retry();
                }
            }, interval);
        }
    }
    
    /**
     * Handle child component errors
     */
    handleChildError(event) {
        const { phase, error, component } = event.detail;
        this.catchError(phase, new Error(error), component);
        event.stopPropagation();
    }
    
    /**
     * Handle promise rejections
     */
    handlePromiseRejection(event) {
        const { reason } = event.detail;
        this.catchError('promise-rejection', new Error(reason));
        event.stopPropagation();
    }
    
    /**
     * Handle render errors
     */
    handleRenderError(event) {
        const { error, component } = event.detail;
        this.catchError('component-render', error, component);
        event.stopPropagation();
    }
    
    /**
     * Catch and process error
     */
    catchError(phase, error, component = null) {
        this.hasError = true;
        this.errorInfo = {
            phase,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            component: component?.tagName?.toLowerCase(),
            retryCount: this.retryCount
        };
        
        // Emit error boundary event
        this.emit('brutal:error-boundary:caught', {
            ...this.errorInfo,
            boundary: this.tagName.toLowerCase()
        });
        
        // Log error
        console.error('[BrutalErrorBoundary] Caught error:', this.errorInfo);
        
        // Attempt recovery if strategy exists
        const strategy = this.recoveryStrategies.get(phase);
        if (strategy) {
            try {
                strategy(error, component);
            } catch (recoveryError) {
                console.error('[BrutalErrorBoundary] Recovery failed:', recoveryError);
                this.fallbackToErrorUI();
            }
        } else {
            this.fallbackToErrorUI();
        }
    }
    
    /**
     * Fallback to error UI
     */
    fallbackToErrorUI() {
        // Re-render with error template
        this.createTemplate();
        this.render();
        
        // Emit error UI shown event
        this.emit('brutal:error-boundary:ui-shown', this.errorInfo);
    }
    
    /**
     * Recovery strategies
     */
    recoverFromRenderError(error, component) {
        if (component) {
            // Try to reset component template
            component._template = null;
            component.createTemplate();
            component.render();
        } else {
            this.fallbackToErrorUI();
        }
    }
    
    recoverFromLifecycleError(error, component) {
        if (component) {
            // Try to re-initialize component
            component._isInitialized = false;
            component._initialize();
        } else {
            this.fallbackToErrorUI();
        }
    }
    
    recoverFromStateError(error, component) {
        if (component && component._state) {
            // Reset component state
            component._state = new component.constructor.StateClass({});
        } else {
            this.fallbackToErrorUI();
        }
    }
    
    recoverFromEventError(error, component) {
        if (component && component._eventManager) {
            // Reset event manager
            component._eventManager.cleanup();
            component._eventManager = new component.constructor.EventClass(component);
        } else {
            this.fallbackToErrorUI();
        }
    }
    
    /**
     * Retry error recovery
     */
    retry() {
        if (this.retryCount >= this.maxRetries) {
            this.emit('brutal:error-boundary:max-retries', this.errorInfo);
            return false;
        }
        
        this.retryCount++;
        this.hasError = false;
        this.errorInfo = null;
        
        // Emit retry event
        this.emit('brutal:error-boundary:retry', {
            attempt: this.retryCount,
            maxRetries: this.maxRetries
        });
        
        // Re-render normal content
        this.createTemplate();
        this.render();
        
        return true;
    }
    
    /**
     * Recover from error state
     */
    recover() {
        this.hasError = false;
        this.errorInfo = null;
        this.retryCount = 0;
        
        // Emit recovery event
        this.emit('brutal:error-boundary:recovered');
        
        // Re-render normal content
        this.createTemplate();
        this.render();
    }
    
    /**
     * Get error boundary status
     */
    getStatus() {
        return {
            hasError: this.hasError,
            errorInfo: this.errorInfo,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries
        };
    }
    
    /**
     * Clear error state
     */
    clearError() {
        this.hasError = false;
        this.errorInfo = null;
        this.retryCount = 0;
        this.createTemplate();
        this.render();
    }
}

/**
 * Error boundary utilities
 */
export const ErrorBoundaryUtils = {
    /**
     * Wrap element with error boundary
     */
    wrap(element, options = {}) {
        const boundary = document.createElement('brutal-error-boundary');
        
        // Apply options
        Object.entries(options).forEach(([key, value]) => {
            boundary.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value);
        });
        
        // Move element into boundary
        element.parentNode?.insertBefore(boundary, element);
        boundary.appendChild(element);
        
        return boundary;
    },
    
    /**
     * Create error boundary with children
     */
    create(children = [], options = {}) {
        const boundary = document.createElement('brutal-error-boundary');
        
        // Apply options
        Object.entries(options).forEach(([key, value]) => {
            boundary.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value);
        });
        
        // Add children
        children.forEach(child => {
            if (typeof child === 'string') {
                boundary.appendChild(document.createTextNode(child));
            } else {
                boundary.appendChild(child);
            }
        });
        
        return boundary;
    },
    
    /**
     * Find nearest error boundary
     */
    findNearest(element) {
        let current = element.parentElement;
        while (current) {
            if (current.tagName === 'BRUTAL-ERROR-BOUNDARY') {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    }
};

// Register error boundary component
if (!customElements.get('brutal-error-boundary')) {
    customElements.define('brutal-error-boundary', BrutalErrorBoundary);
}