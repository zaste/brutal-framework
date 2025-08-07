/**
 * BRUTAL V4 - Error Boundary Component
 * Simplified error handling for component trees
 * Catches and displays errors gracefully
 */

import { EnhancedBrutalComponent, HookPhase } from './EnhancedComponent.js';
import { html, css } from '../templates/index.js';

export class BrutalErrorBoundary extends EnhancedBrutalComponent {
    static get observedAttributes() {
        return ['fallback-message', 'show-details'];
    }

    constructor() {
        super();
        
        this._hasError = false;
        this._error = null;
        this._errorInfo = null;
        
        // Register error capture hook
        this.hook(HookPhase.ERROR_CAPTURED, (error, phase) => {
            this._captureError(error, phase);
            return true; // Prevent propagation
        });
    }

    createTemplate() {
        if (this._hasError) {
            return this._createErrorTemplate();
        }
        
        // Normal template - just a slot
        this._template = html`<slot></slot>`;
    }

    _createErrorTemplate() {
        const fallbackMessage = this.getAttribute('fallback-message') || 'Something went wrong';
        const showDetails = this.hasAttribute('show-details');
        
        this._template = html`
            <div class="error-boundary">
                <div class="error-icon">⚠️</div>
                <h3>${fallbackMessage}</h3>
                ${showDetails ? html`
                    <details class="error-details">
                        <summary>Error Details</summary>
                        <pre>${this._error?.stack || this._error?.message || 'Unknown error'}</pre>
                        <p>Phase: ${this._errorInfo?.phase || 'unknown'}</p>
                    </details>
                ` : html`
                    <p>Please refresh the page and try again.</p>
                `}
                <button @click=${() => this.reset()}>Reset</button>
            </div>
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        
        this.setStyles(css`
            :host {
                display: block;
            }
            
            .error-boundary {
                padding: 40px;
                text-align: center;
                background: #fff5f5;
                border: 2px solid #ff6b6b;
                border-radius: 8px;
                margin: 20px 0;
            }
            
            .error-icon {
                font-size: 48px;
                margin-bottom: 16px;
            }
            
            h3 {
                color: #c92a2a;
                margin: 0 0 16px;
            }
            
            p {
                color: #666;
                margin: 16px 0;
            }
            
            .error-details {
                text-align: left;
                margin: 20px 0;
                padding: 16px;
                background: white;
                border-radius: 4px;
                border: 1px solid #ffe0e0;
            }
            
            .error-details summary {
                cursor: pointer;
                font-weight: bold;
                color: #c92a2a;
            }
            
            .error-details pre {
                margin: 16px 0 0;
                padding: 12px;
                background: #f8f8f8;
                border-radius: 4px;
                overflow-x: auto;
                font-size: 12px;
                line-height: 1.4;
            }
            
            button {
                padding: 8px 24px;
                border: none;
                border-radius: 4px;
                background: #c92a2a;
                color: white;
                cursor: pointer;
                font-size: 14px;
            }
            
            button:hover {
                background: #a61e1e;
            }
        `);
    }

    _captureError(error, phase) {
        console.error('[ErrorBoundary] Caught error:', error);
        
        this._hasError = true;
        this._error = error;
        this._errorInfo = { phase, timestamp: Date.now() };
        
        // Re-render with error UI
        this.scheduleRender();
        
        // Emit error event
        this.emit('brutal:error-captured', {
            error,
            phase,
            boundary: this
        });
    }

    reset() {
        this._hasError = false;
        this._error = null;
        this._errorInfo = null;
        
        // Re-render normal content
        this.scheduleRender();
        
        // Emit reset event
        this.emit('brutal:error-reset');
    }

    /**
     * Static helper to wrap components
     */
    static wrap(component, options = {}) {
        const boundary = document.createElement('brutal-error-boundary');
        
        if (options.fallbackMessage) {
            boundary.setAttribute('fallback-message', options.fallbackMessage);
        }
        
        if (options.showDetails) {
            boundary.setAttribute('show-details', '');
        }
        
        boundary.appendChild(component);
        return boundary;
    }
}

// Register the error boundary component
BrutalErrorBoundary.define('brutal-error-boundary');