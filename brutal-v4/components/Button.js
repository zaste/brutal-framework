/**
 * BRUTAL V4 - Button Component Example
 * Demonstrates complete system integration
 * Button with state, events, accessibility, and design tokens
 */

import { BrutalComponent } from '../core/foundation/Component.js';
import { html, css } from '../core/templates/index.js';
import { BrutalCore } from '../core/integration/CoreIntegration.js';

/**
 * BrutalButton - Example button component with full integration
 */
export class BrutalButton extends BrutalComponent {
    static get observedAttributes() {
        return ['variant', 'size', 'disabled', 'loading', 'icon'];
    }
    
    constructor() {
        super();
        
        // Wire with core systems
        BrutalCore.wireComponent(this);
        
        // Component-specific setup
        this.setupButtonBehavior();
        
        // Adopt shared design system styles if available
        if (window.BrutalDesignSystem?.sharedStyleSheet) {
            this.adoptStyleSheet(window.BrutalDesignSystem.sharedStyleSheet);
        }
    }
    
    /**
     * Initialize button state
     */
    initializeState() {
        super.initializeState();
        
        // Button-specific state
        this._state.set({
            variant: this.getAttribute('variant') || 'primary',
            size: this.getAttribute('size') || 'medium',
            disabled: this.hasAttribute('disabled'),
            loading: this.hasAttribute('loading'),
            pressed: false,
            focused: false,
            hovered: false
        });
    }
    
    /**
     * Create button template
     */
    createTemplate() {
        const state = this._state.getAll();
        
        // Set styles using Constructable StyleSheets
        this.setStyles(this.getButtonStyles());
        
        this._template = html`
            <button 
                class="brutal-button brutal-button--${state.variant} brutal-button--${state.size}"
                ?disabled="${state.disabled || state.loading}"
                aria-pressed="${state.pressed}"
                aria-busy="${state.loading}"
            >
                ${state.loading ? html`
                    <span class="brutal-button__spinner" aria-hidden="true">
                        <svg class="brutal-button__spinner-icon" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                                <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                            </circle>
                        </svg>
                    </span>
                ` : ''}
                
                ${this.getAttribute('icon') && !state.loading ? html`
                    <span class="brutal-button__icon" aria-hidden="true">
                        ${this.getAttribute('icon')}
                    </span>
                ` : ''}
                
                <span class="brutal-button__content">
                    <slot></slot>
                </span>
            </button>
        `;
    }
    
    /**
     * Get button styles with design tokens
     */
    getButtonStyles() {
        return css`
            :host {
                display: inline-block;
                position: relative;
            }
            
            .brutal-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: var(--spacing-2);
                border: none;
                border-radius: var(--borderRadius-md);
                font-family: var(--typography-font-sans);
                font-weight: var(--font-medium);
                text-decoration: none;
                cursor: pointer;
                transition: all var(--animation-duration-200) var(--animation-ease-out);
                position: relative;
                overflow: hidden;
                user-select: none;
                -webkit-user-select: none;
                outline: none;
            }
            
            /* Focus styles */
            .brutal-button:focus-visible {
                outline: 2px solid var(--theme-border-focus);
                outline-offset: 2px;
            }
            
            /* Size variants */
            .brutal-button--small {
                padding: var(--spacing-1) var(--spacing-3);
                font-size: var(--text-sm);
                min-height: 32px;
            }
            
            .brutal-button--medium {
                padding: var(--spacing-2) var(--spacing-4);
                font-size: var(--text-base);
                min-height: 40px;
            }
            
            .brutal-button--large {
                padding: var(--spacing-3) var(--spacing-6);
                font-size: var(--text-lg);
                min-height: 48px;
            }
            
            /* Primary variant */
            .brutal-button--primary {
                background: var(--color-primary-600);
                color: white;
            }
            
            .brutal-button--primary:hover:not(:disabled) {
                background: var(--color-primary-700);
                transform: translateY(-1px);
                box-shadow: var(--shadow-md);
            }
            
            .brutal-button--primary:active:not(:disabled) {
                background: var(--color-primary-800);
                transform: translateY(0);
                box-shadow: var(--shadow-sm);
            }
            
            /* Secondary variant */
            .brutal-button--secondary {
                background: var(--theme-bg-secondary);
                color: var(--theme-text-primary);
                border: 1px solid var(--theme-border-primary);
            }
            
            .brutal-button--secondary:hover:not(:disabled) {
                background: var(--theme-bg-tertiary);
                border-color: var(--theme-border-secondary);
                transform: translateY(-1px);
                box-shadow: var(--shadow-md);
            }
            
            /* Outline variant */
            .brutal-button--outline {
                background: transparent;
                color: var(--color-primary-600);
                border: 2px solid var(--color-primary-600);
            }
            
            .brutal-button--outline:hover:not(:disabled) {
                background: var(--color-primary-50);
                transform: translateY(-1px);
            }
            
            /* Ghost variant */
            .brutal-button--ghost {
                background: transparent;
                color: var(--theme-text-secondary);
            }
            
            .brutal-button--ghost:hover:not(:disabled) {
                background: var(--theme-bg-secondary);
                color: var(--theme-text-primary);
            }
            
            /* Danger variant */
            .brutal-button--danger {
                background: var(--color-error-600);
                color: white;
            }
            
            .brutal-button--danger:hover:not(:disabled) {
                background: var(--color-error-700);
                transform: translateY(-1px);
                box-shadow: var(--shadow-md);
            }
            
            /* Success variant */
            .brutal-button--success {
                background: var(--color-success-600);
                color: white;
            }
            
            .brutal-button--success:hover:not(:disabled) {
                background: var(--color-success-700);
                transform: translateY(-1px);
                box-shadow: var(--shadow-md);
            }
            
            /* Disabled state */
            .brutal-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none !important;
                box-shadow: none !important;
            }
            
            /* Loading state */
            .brutal-button[aria-busy="true"] {
                cursor: wait;
                pointer-events: none;
            }
            
            .brutal-button[aria-busy="true"] .brutal-button__content {
                opacity: 0.7;
            }
            
            /* Icon styles */
            .brutal-button__icon {
                display: flex;
                align-items: center;
                font-size: 1.2em;
            }
            
            /* Spinner styles */
            .brutal-button__spinner {
                position: absolute;
                left: var(--spacing-3);
                display: flex;
                align-items: center;
            }
            
            .brutal-button__spinner-icon {
                width: 1em;
                height: 1em;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                from {
                    transform: rotate(0deg);
                }
                to {
                    transform: rotate(360deg);
                }
            }
            
            /* Content spacing when loading */
            .brutal-button[aria-busy="true"] .brutal-button__content {
                margin-left: calc(1em + var(--spacing-2));
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .brutal-button {
                    transition: none;
                }
                
                .brutal-button:hover:not(:disabled) {
                    transform: none;
                }
                
                .brutal-button__spinner-icon {
                    animation: none;
                }
            }
            
            /* High contrast support */
            @media (prefers-contrast: high) {
                .brutal-button {
                    border: 2px solid currentColor;
                }
                
                .brutal-button:focus-visible {
                    outline: 3px solid;
                    outline-offset: 2px;
                }
            }
        `;
    }
    
    /**
     * Setup button-specific behavior
     */
    setupButtonBehavior() {
        // Handle attribute changes
        this.attributeChangedCallback = (name, oldValue, newValue) => {
            super.attributeChangedCallback(name, oldValue, newValue);
            
            if (this._state) {
                switch (name) {
                    case 'variant':
                        this._state.set({ variant: newValue || 'primary' });
                        break;
                    case 'size':
                        this._state.set({ size: newValue || 'medium' });
                        break;
                    case 'disabled':
                        this._state.set({ disabled: newValue !== null });
                        break;
                    case 'loading':
                        this._state.set({ loading: newValue !== null });
                        break;
                }
            }
        };
    }
    
    /**
     * Setup button event listeners
     */
    setupEventListeners() {
        super.setupEventListeners();
        
        const button = this.shadowRoot?.querySelector('.brutal-button');
        if (!button) return;
        
        // Click handling
        button.addEventListener('click', (event) => {
            if (this._state.get('disabled') || this._state.get('loading')) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            
            // Emit click event
            this.emit('brutal:button:click', {
                variant: this._state.get('variant'),
                size: this._state.get('size')
            });
        });
        
        // Mouse events for state tracking
        button.addEventListener('mouseenter', () => {
            this._state.set({ hovered: true });
            this.emit('brutal:button:hover', { hovered: true });
        });
        
        button.addEventListener('mouseleave', () => {
            this._state.set({ hovered: false });
            this.emit('brutal:button:hover', { hovered: false });
        });
        
        // Focus events
        button.addEventListener('focus', () => {
            this._state.set({ focused: true });
            this.emit('brutal:button:focus', { focused: true });
        });
        
        button.addEventListener('blur', () => {
            this._state.set({ focused: false });
            this.emit('brutal:button:focus', { focused: false });
        });
        
        // Keyboard support
        button.addEventListener('keydown', (event) => {
            if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                this._state.set({ pressed: true });
            }
        });
        
        button.addEventListener('keyup', (event) => {
            if (event.key === ' ' || event.key === 'Enter') {
                this._state.set({ pressed: false });
                
                if (!this._state.get('disabled') && !this._state.get('loading')) {
                    this.emit('brutal:button:click', {
                        variant: this._state.get('variant'),
                        size: this._state.get('size'),
                        keyboard: true
                    });
                }
            }
        });
    }
    
    /**
     * Public API methods
     */
    
    /**
     * Trigger button click programmatically
     */
    click() {
        if (!this._state.get('disabled') && !this._state.get('loading')) {
            this.emit('brutal:button:click', {
                variant: this._state.get('variant'),
                size: this._state.get('size'),
                programmatic: true
            });
        }
    }
    
    /**
     * Set loading state
     */
    setLoading(loading = true) {
        this._state.set({ loading });
        if (loading) {
            this.setAttribute('loading', '');
        } else {
            this.removeAttribute('loading');
        }
    }
    
    /**
     * Set disabled state
     */
    setDisabled(disabled = true) {
        this._state.set({ disabled });
        if (disabled) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
    }
    
    /**
     * Get button state
     */
    getButtonState() {
        return {
            ...this._state.getAll(),
            element: this
        };
    }
}

// Register button component
if (!customElements.get('brutal-button')) {
    customElements.define('brutal-button', BrutalButton);
}