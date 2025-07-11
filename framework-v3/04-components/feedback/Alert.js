/**
 * @fileoverview BRUTAL Alert Component - System notifications done right
 * @version 3.0.0
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js';

/**
 * BRUTAL Alert - Beautiful system notifications
 * Types, dismissible, actions, auto-dismiss
 */
export class Alert extends InteractiveComponent {
    static get observedAttributes() {
        return [
            'type',         // info | warning | error | success
            'title',        // alert title
            'message',      // alert message
            'dismissible',  // boolean - can be closed
            'actions',      // JSON array of action buttons
            'icon',         // custom icon
            'timeout',      // auto-dismiss timeout in ms
            'position',     // top | bottom | inline
            'animated',     // boolean - animate entrance
            'progress',     // boolean - show timeout progress
            'compact'       // boolean - reduced padding
        ];
    }
    
    constructor() {
        super();
        
        // State
        this.state = {
            type: 'info',
            title: '',
            message: '',
            dismissible: true,
            actions: [],
            icon: null,
            timeout: 0,
            position: 'inline',
            animated: true,
            progress: false,
            compact: false,
            
            // Internal state
            visible: true,
            closing: false,
            timeoutId: null,
            progressValue: 100,
            progressInterval: null
        };
        
        // Icons for each type
        this._icons = {
            info: '💡',
            warning: '⚠️',
            error: '❌',
            success: '✅'
        };
        
        // V8 optimization
        this._boundHandleDismiss = this._handleDismiss.bind(this);
        this._boundHandleAction = this._handleAction.bind(this);
        this._boundHandleTimeout = this._handleTimeout.bind(this);
        this._boundUpdateProgress = this._updateProgress.bind(this);
    }
    
    connectedCallback() {
        super.connectedCallback();
        this._setupTimeout();
        this._announce();
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        this._clearTimeout();
    }
    
    /**
     * Render alert
     */
    render() {
        const {
            type,
            title,
            message,
            dismissible,
            actions,
            icon,
            position,
            animated,
            progress,
            compact,
            visible,
            closing,
            progressValue
        } = this.state;
        
        if (!visible) {
            this.shadowRoot.innerHTML = '';
            return;
        }
        
        const classes = ['brutal-alert'];
        classes.push(`brutal-alert--${type}`);
        classes.push(`brutal-alert--${position}`);
        if (compact) classes.push('brutal-alert--compact');
        if (closing) classes.push('brutal-alert--closing');
        if (animated && !this._hasRendered) {
            classes.push('brutal-alert--animated');
            this._hasRendered = true;
        }
        
        const alertIcon = icon || this._icons[type];
        
        this.shadowRoot.innerHTML = `
            <style>${this._getStyles()}</style>
            <div 
                class="${classes.join(' ')}"
                role="alert"
                aria-live="${type === 'error' ? 'assertive' : 'polite'}"
                part="alert"
            >
                ${progress && this.state.timeout > 0 ? `
                    <div class="brutal-alert-progress">
                        <div 
                            class="brutal-alert-progress-bar"
                            style="width: ${progressValue}%"
                        ></div>
                    </div>
                ` : ''}
                
                <div class="brutal-alert-content">
                    ${alertIcon ? `
                        <div class="brutal-alert-icon" aria-hidden="true">
                            ${alertIcon}
                        </div>
                    ` : ''}
                    
                    <div class="brutal-alert-body">
                        ${title ? `
                            <h4 class="brutal-alert-title">${title}</h4>
                        ` : ''}
                        ${message ? `
                            <p class="brutal-alert-message">${message}</p>
                        ` : ''}
                        <slot></slot>
                    </div>
                    
                    ${actions.length > 0 ? `
                        <div class="brutal-alert-actions">
                            ${actions.map((action, i) => `
                                <button
                                    class="brutal-alert-action brutal-alert-action--${action.style || 'default'}"
                                    data-action-index="${i}"
                                    part="action"
                                >
                                    ${action.label}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${dismissible ? `
                        <button
                            class="brutal-alert-dismiss"
                            aria-label="Dismiss alert"
                            part="dismiss"
                        >
                            <span aria-hidden="true">×</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        this._attachEventListeners();
    }
    
    /**
     * Get optimized styles
     */
    _getStyles() {
        return `
            :host {
                display: block;
                font-family: inherit;
            }
            
            * {
                box-sizing: border-box;
            }
            
            .brutal-alert {
                position: relative;
                display: flex;
                flex-direction: column;
                background: #1a1a1a;
                border: 2px solid;
                border-radius: 8px;
                overflow: hidden;
                margin: 1rem 0;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            /* Types */
            .brutal-alert--info {
                border-color: #0ea5e9;
                background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
                background-size: 4px 100%;
                background-repeat: no-repeat;
                background-position: left;
                background-color: #1a1a1a;
            }
            
            .brutal-alert--warning {
                border-color: #f59e0b;
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                background-size: 4px 100%;
                background-repeat: no-repeat;
                background-position: left;
                background-color: #1a1a1a;
            }
            
            .brutal-alert--error {
                border-color: #ef4444;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                background-size: 4px 100%;
                background-repeat: no-repeat;
                background-position: left;
                background-color: #1a1a1a;
            }
            
            .brutal-alert--success {
                border-color: #10b981;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                background-size: 4px 100%;
                background-repeat: no-repeat;
                background-position: left;
                background-color: #1a1a1a;
            }
            
            /* Progress bar */
            .brutal-alert-progress {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.1);
                overflow: hidden;
            }
            
            .brutal-alert-progress-bar {
                height: 100%;
                background: rgba(255, 255, 255, 0.8);
                transition: width 0.1s linear;
                transform-origin: left;
            }
            
            /* Content */
            .brutal-alert-content {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
                padding: 1rem 1.5rem;
                color: #fff;
            }
            
            .brutal-alert--compact .brutal-alert-content {
                padding: 0.75rem 1rem;
            }
            
            /* Icon */
            .brutal-alert-icon {
                font-size: 1.5rem;
                line-height: 1;
                flex-shrink: 0;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
            }
            
            /* Body */
            .brutal-alert-body {
                flex: 1;
                min-width: 0;
            }
            
            .brutal-alert-title {
                margin: 0 0 0.25rem;
                font-size: 1.125rem;
                font-weight: 600;
                line-height: 1.4;
                color: #fff;
            }
            
            .brutal-alert-message {
                margin: 0;
                font-size: 0.875rem;
                line-height: 1.5;
                opacity: 0.9;
            }
            
            /* Actions */
            .brutal-alert-actions {
                display: flex;
                gap: 0.5rem;
                margin-top: 0.75rem;
            }
            
            .brutal-alert-action {
                padding: 0.375rem 0.75rem;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                color: #fff;
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                white-space: nowrap;
            }
            
            .brutal-alert-action:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-1px);
            }
            
            .brutal-alert-action:active {
                transform: translateY(0);
            }
            
            .brutal-alert-action--primary {
                background: rgba(255, 255, 255, 0.9);
                color: #000;
                border-color: transparent;
            }
            
            .brutal-alert-action--primary:hover {
                background: #fff;
            }
            
            /* Dismiss button */
            .brutal-alert-dismiss {
                position: absolute;
                top: 0.75rem;
                right: 0.75rem;
                width: 2rem;
                height: 2rem;
                padding: 0;
                background: transparent;
                border: none;
                color: #fff;
                font-size: 1.5rem;
                line-height: 1;
                cursor: pointer;
                opacity: 0.7;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
            }
            
            .brutal-alert-dismiss:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.1);
            }
            
            /* Positions */
            .brutal-alert--top,
            .brutal-alert--bottom {
                position: fixed;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1000;
                max-width: 90vw;
                width: 600px;
            }
            
            .brutal-alert--top {
                top: 2rem;
            }
            
            .brutal-alert--bottom {
                bottom: 2rem;
            }
            
            /* Animations */
            @keyframes brutal-alert-enter {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes brutal-alert-enter-bottom {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes brutal-alert-exit {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
            
            .brutal-alert--animated {
                animation: brutal-alert-enter 0.3s ease-out;
            }
            
            .brutal-alert--bottom.brutal-alert--animated {
                animation: brutal-alert-enter-bottom 0.3s ease-out;
            }
            
            .brutal-alert--closing {
                animation: brutal-alert-exit 0.3s ease-in forwards;
            }
            
            /* Mobile responsive */
            @media (max-width: 640px) {
                .brutal-alert--top,
                .brutal-alert--bottom {
                    width: calc(100vw - 2rem);
                    max-width: none;
                }
                
                .brutal-alert--top {
                    top: 1rem;
                }
                
                .brutal-alert--bottom {
                    bottom: 1rem;
                }
                
                .brutal-alert-content {
                    padding: 1rem;
                }
                
                .brutal-alert-actions {
                    flex-wrap: wrap;
                }
            }
            
            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .brutal-alert {
                    animation: none !important;
                    transition: none !important;
                }
                
                .brutal-alert-progress-bar {
                    transition: none !important;
                }
            }
            
            /* High contrast */
            @media (prefers-contrast: high) {
                .brutal-alert {
                    border-width: 3px;
                }
                
                .brutal-alert-action {
                    border-width: 2px;
                }
            }
        `;
    }
    
    /**
     * Setup timeout
     */
    _setupTimeout() {
        const { timeout, progress } = this.state;
        
        if (timeout > 0) {
            // Set timeout for auto-dismiss
            this.state.timeoutId = setTimeout(this._boundHandleTimeout, timeout);
            
            // Setup progress bar
            if (progress) {
                const startTime = Date.now();
                const updateInterval = 50; // Update every 50ms
                
                this.state.progressInterval = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    const remaining = Math.max(0, timeout - elapsed);
                    this.state.progressValue = (remaining / timeout) * 100;
                    
                    // Update progress bar
                    const progressBar = this.shadowRoot.querySelector('.brutal-alert-progress-bar');
                    if (progressBar) {
                        progressBar.style.width = `${this.state.progressValue}%`;
                    }
                    
                    if (remaining <= 0) {
                        clearInterval(this.state.progressInterval);
                    }
                }, updateInterval);
            }
        }
    }
    
    /**
     * Clear timeout
     */
    _clearTimeout() {
        if (this.state.timeoutId) {
            clearTimeout(this.state.timeoutId);
            this.state.timeoutId = null;
        }
        
        if (this.state.progressInterval) {
            clearInterval(this.state.progressInterval);
            this.state.progressInterval = null;
        }
    }
    
    /**
     * Handle timeout
     */
    _handleTimeout() {
        this.dismiss();
    }
    
    /**
     * Handle dismiss
     */
    _handleDismiss() {
        this.dismiss();
    }
    
    /**
     * Dismiss alert
     */
    dismiss() {
        if (!this.state.visible) return;
        
        this._clearTimeout();
        this.state.closing = true;
        this.render();
        
        // Wait for animation
        setTimeout(() => {
            this.state.visible = false;
            this.state.closing = false;
            this.render();
            
            this.dispatchEvent(new CustomEvent('brutal:dismiss', {
                bubbles: true,
                composed: true,
                detail: { type: this.state.type }
            }));
        }, 300);
    }
    
    /**
     * Handle action click
     */
    _handleAction(index) {
        const action = this.state.actions[index];
        if (!action) return;
        
        this.dispatchEvent(new CustomEvent('brutal:action', {
            bubbles: true,
            composed: true,
            detail: { 
                action: action.id || action.label,
                index,
                type: this.state.type
            }
        }));
        
        // Auto-dismiss if action specifies
        if (action.dismiss !== false) {
            this.dismiss();
        }
    }
    
    /**
     * Announce to screen readers
     */
    _announce() {
        // Screen readers will automatically announce due to role="alert"
        // and aria-live attributes
    }
    
    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        // Dismiss button
        const dismissBtn = this.shadowRoot.querySelector('.brutal-alert-dismiss');
        dismissBtn?.addEventListener('click', this._boundHandleDismiss);
        
        // Action buttons
        const actionBtns = this.shadowRoot.querySelectorAll('.brutal-alert-action');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.actionIndex);
                this._handleAction(index);
            });
        });
        
        // Keyboard support
        this.shadowRoot.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.dismissible) {
                this._handleDismiss();
            }
        });
    }
    
    /**
     * Parse actions from attribute
     */
    _parseActions(value) {
        if (!value) return [];
        
        try {
            return JSON.parse(value);
        } catch (e) {
            return [];
        }
    }
    
    /**
     * Attribute changed callback
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        
        switch (name) {
            case 'type':
                this.state.type = newValue || 'info';
                break;
            case 'title':
                this.state.title = newValue || '';
                break;
            case 'message':
                this.state.message = newValue || '';
                break;
            case 'dismissible':
                this.state.dismissible = newValue !== 'false';
                break;
            case 'actions':
                this.state.actions = this._parseActions(newValue);
                break;
            case 'icon':
                this.state.icon = newValue;
                break;
            case 'timeout':
                this.state.timeout = parseInt(newValue) || 0;
                if (this.state.visible) {
                    this._clearTimeout();
                    this._setupTimeout();
                }
                break;
            case 'position':
                this.state.position = newValue || 'inline';
                break;
            case 'animated':
                this.state.animated = newValue !== 'false';
                break;
            case 'progress':
                this.state.progress = newValue === 'true';
                break;
            case 'compact':
                this.state.compact = newValue === 'true';
                break;
        }
        
        this.render();
    }
    
    /**
     * Show alert programmatically
     */
    static show(options = {}) {
        const alert = document.createElement('brutal-alert');
        
        // Set attributes
        Object.entries(options).forEach(([key, value]) => {
            if (key === 'actions') {
                alert.setAttribute(key, JSON.stringify(value));
            } else {
                alert.setAttribute(key, value);
            }
        });
        
        // Add to body if position is fixed
        if (options.position === 'top' || options.position === 'bottom') {
            document.body.appendChild(alert);
        }
        
        return alert;
    }
}

// Register component
customElements.define('brutal-alert', Alert);