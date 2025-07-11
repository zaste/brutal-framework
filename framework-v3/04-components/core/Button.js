/**
 * @fileoverview BRUTAL Button Component - Zero overhead, maximum performance
 * @version 3.0.0
 */

import { InteractiveComponent } from '../base/InteractiveComponent.js';

/**
 * BRUTAL Button - The fastest button in the west
 * 5 variants, ripple effect, loading state, icon support
 */
export class Button extends InteractiveComponent {
    static get observedAttributes() {
        return [
            'variant',    // primary | secondary | ghost | danger | success
            'size',       // small | medium | large
            'loading',    // boolean
            'disabled',   // boolean
            'icon',       // icon name/emoji
            'icon-position', // left | right
            'full-width', // boolean
            'type',       // button | submit | reset
            'href',       // link mode
            'target'      // for link mode
        ];
    }
    
    constructor() {
        super();
        
        // State
        this.state = {
            variant: 'primary',
            size: 'medium',
            loading: false,
            disabled: false,
            icon: null,
            iconPosition: 'left',
            fullWidth: false,
            pressed: false,
            ripples: []
        };
        
        // Ripple animation tracking
        this.rippleIndex = 0;
        
        // V8 optimization - bind once
        this._boundHandleClick = this._handleClick.bind(this);
        this._boundHandleMouseDown = this._handleMouseDown.bind(this);
        this._boundHandleMouseUp = this._handleMouseUp.bind(this);
        this._boundHandleKeyDown = this._handleKeyDown.bind(this);
        this._boundHandleKeyUp = this._handleKeyUp.bind(this);
        this._boundCleanupRipple = this._cleanupRipple.bind(this);
    }
    
    connectedCallback() {
        super.connectedCallback();
        this._attachEventListeners();
        this._setupAccessibility();
    }
    
    disconnectedCallback() {
        super.disconnectedCallback();
        this._removeEventListeners();
    }
    
    /**
     * Render button
     */
    render() {
        const { 
            variant, 
            size, 
            loading, 
            disabled, 
            icon, 
            iconPosition,
            fullWidth,
            pressed,
            ripples
        } = this.state;
        
        // Build class list efficiently
        const classes = ['brutal-button'];
        classes.push(`brutal-button--${variant}`);
        classes.push(`brutal-button--${size}`);
        
        if (loading) classes.push('brutal-button--loading');
        if (disabled) classes.push('brutal-button--disabled');
        if (fullWidth) classes.push('brutal-button--full-width');
        if (pressed) classes.push('brutal-button--pressed');
        if (icon && !this.textContent?.trim()) classes.push('brutal-button--icon-only');
        
        // Render
        this.shadowRoot.innerHTML = `
            <style>${this._getStyles()}</style>
            <button 
                class="${classes.join(' ')}"
                ?disabled="${disabled || loading}"
                aria-busy="${loading}"
                aria-pressed="${pressed}"
                part="button"
            >
                ${loading ? this._renderSpinner() : ''}
                ${icon && iconPosition === 'left' ? `<span class="brutal-button__icon">${icon}</span>` : ''}
                <span class="brutal-button__content">
                    <slot></slot>
                </span>
                ${icon && iconPosition === 'right' ? `<span class="brutal-button__icon">${icon}</span>` : ''}
                ${this._renderRipples()}
            </button>
        `;
    }
    
    /**
     * Get optimized styles
     */
    _getStyles() {
        return `
            :host {
                display: inline-block;
                vertical-align: middle;
                font-family: inherit;
            }
            
            :host([full-width]) {
                display: block;
                width: 100%;
            }
            
            .brutal-button {
                position: relative;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.5em;
                padding: 0.75em 1.5em;
                border: none;
                border-radius: 6px;
                font-family: inherit;
                font-weight: 600;
                text-decoration: none;
                cursor: pointer;
                user-select: none;
                overflow: hidden;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                transform: translateZ(0); /* Force GPU layer */
                will-change: transform;
                -webkit-tap-highlight-color: transparent;
            }
            
            /* Sizes */
            .brutal-button--small {
                padding: 0.5em 1em;
                font-size: 0.875em;
            }
            
            .brutal-button--large {
                padding: 1em 2em;
                font-size: 1.125em;
            }
            
            /* Variants */
            .brutal-button--primary {
                background: #00ff88;
                color: #000;
            }
            
            .brutal-button--primary:hover:not(:disabled) {
                background: #00cc70;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
            }
            
            .brutal-button--primary:active:not(:disabled) {
                transform: translateY(0);
            }
            
            .brutal-button--secondary {
                background: #1a1a1a;
                color: #00ff88;
                border: 2px solid #00ff88;
            }
            
            .brutal-button--secondary:hover:not(:disabled) {
                background: #00ff88;
                color: #000;
                transform: translateY(-2px);
            }
            
            .brutal-button--ghost {
                background: transparent;
                color: #00ff88;
                border: 2px solid transparent;
            }
            
            .brutal-button--ghost:hover:not(:disabled) {
                background: rgba(0, 255, 136, 0.1);
                border-color: #00ff88;
            }
            
            .brutal-button--danger {
                background: #ff0044;
                color: #fff;
            }
            
            .brutal-button--danger:hover:not(:disabled) {
                background: #cc0033;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(255, 0, 68, 0.3);
            }
            
            .brutal-button--success {
                background: #00ff00;
                color: #000;
            }
            
            .brutal-button--success:hover:not(:disabled) {
                background: #00cc00;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 255, 0, 0.3);
            }
            
            /* States */
            .brutal-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .brutal-button--loading {
                color: transparent;
                pointer-events: none;
            }
            
            .brutal-button--full-width {
                width: 100%;
            }
            
            .brutal-button--icon-only {
                padding: 0.75em;
            }
            
            .brutal-button--icon-only.brutal-button--small {
                padding: 0.5em;
            }
            
            .brutal-button--icon-only.brutal-button--large {
                padding: 1em;
            }
            
            /* Icon */
            .brutal-button__icon {
                display: inline-flex;
                align-items: center;
                font-size: 1.2em;
            }
            
            /* Content */
            .brutal-button__content {
                display: inline-flex;
                align-items: center;
            }
            
            /* Spinner */
            .brutal-spinner {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 1.2em;
                height: 1.2em;
            }
            
            .brutal-spinner::after {
                content: '';
                display: block;
                width: 100%;
                height: 100%;
                border: 2px solid currentColor;
                border-top-color: transparent;
                border-radius: 50%;
                animation: brutal-spin 0.8s linear infinite;
            }
            
            @keyframes brutal-spin {
                to { transform: rotate(360deg); }
            }
            
            /* Ripple effect */
            .brutal-ripple-container {
                position: absolute;
                inset: 0;
                overflow: hidden;
                pointer-events: none;
            }
            
            .brutal-ripple {
                position: absolute;
                border-radius: 50%;
                background: currentColor;
                opacity: 0.3;
                transform: scale(0);
                animation: brutal-ripple 0.6s ease-out;
                pointer-events: none;
            }
            
            @keyframes brutal-ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            /* Focus styles */
            .brutal-button:focus-visible {
                outline: 2px solid currentColor;
                outline-offset: 2px;
            }
            
            /* Touch optimization */
            @media (hover: none) {
                .brutal-button {
                    -webkit-tap-highlight-color: rgba(0, 255, 136, 0.1);
                }
                
                .brutal-button:active {
                    transform: scale(0.98);
                }
            }
            
            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .brutal-button,
                .brutal-ripple,
                .brutal-spinner::after {
                    animation: none;
                    transition: none;
                }
            }
        `;
    }
    
    /**
     * Render spinner
     */
    _renderSpinner() {
        return '<div class="brutal-spinner" aria-hidden="true"></div>';
    }
    
    /**
     * Render ripples
     */
    _renderRipples() {
        if (this.state.ripples.length === 0) return '';
        
        return `
            <div class="brutal-ripple-container">
                ${this.state.ripples.map(ripple => `
                    <span 
                        class="brutal-ripple" 
                        style="
                            left: ${ripple.x}px;
                            top: ${ripple.y}px;
                            width: ${ripple.size}px;
                            height: ${ripple.size}px;
                            margin-left: ${-ripple.size / 2}px;
                            margin-top: ${-ripple.size / 2}px;
                        "
                        data-ripple-id="${ripple.id}"
                    ></span>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Handle click
     */
    _handleClick(e) {
        if (this.state.disabled || this.state.loading) {
            e.preventDefault();
            return;
        }
        
        // Handle link mode
        if (this.getAttribute('href')) {
            e.preventDefault();
            const target = this.getAttribute('target') || '_self';
            window.open(this.getAttribute('href'), target);
        }
        
        // Emit custom event
        this.dispatchEvent(new CustomEvent('brutal:click', {
            bubbles: true,
            composed: true,
            detail: { originalEvent: e }
        }));
    }
    
    /**
     * Handle mouse down for ripple
     */
    _handleMouseDown(e) {
        if (this.state.disabled || this.state.loading) return;
        
        this.state.pressed = true;
        this._createRipple(e);
        this.render();
    }
    
    /**
     * Handle mouse up
     */
    _handleMouseUp() {
        if (this.state.pressed) {
            this.state.pressed = false;
            this.render();
        }
    }
    
    /**
     * Handle keyboard
     */
    _handleKeyDown(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this.state.pressed = true;
            this.render();
            
            // Create centered ripple
            const rect = this.getBoundingClientRect();
            this._createRipple({
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2
            });
        }
    }
    
    _handleKeyUp(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            this.state.pressed = false;
            this.render();
            this._handleClick(e);
        }
    }
    
    /**
     * Create ripple effect
     */
    _createRipple(e) {
        const button = this.shadowRoot.querySelector('.brutal-button');
        const rect = button.getBoundingClientRect();
        
        // Calculate ripple position
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate ripple size
        const sizeX = Math.max(x, rect.width - x);
        const sizeY = Math.max(y, rect.height - y);
        const size = Math.sqrt(sizeX * sizeX + sizeY * sizeY) * 2;
        
        // Add ripple
        const ripple = {
            id: this.rippleIndex++,
            x,
            y,
            size
        };
        
        this.state.ripples.push(ripple);
        this.render();
        
        // Remove ripple after animation
        setTimeout(() => this._cleanupRipple(ripple.id), 600);
    }
    
    /**
     * Cleanup ripple
     */
    _cleanupRipple(id) {
        this.state.ripples = this.state.ripples.filter(r => r.id !== id);
        if (this.state.ripples.length === 0) {
            this.render();
        }
    }
    
    /**
     * Setup accessibility
     */
    _setupAccessibility() {
        const button = this.shadowRoot.querySelector('.brutal-button');
        
        // Set role if needed
        if (this.getAttribute('href')) {
            button.setAttribute('role', 'link');
        }
        
        // Pass through ARIA attributes
        ['aria-label', 'aria-describedby', 'aria-controls'].forEach(attr => {
            if (this.hasAttribute(attr)) {
                button.setAttribute(attr, this.getAttribute(attr));
            }
        });
    }
    
    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        const button = this.shadowRoot.querySelector('.brutal-button');
        
        button.addEventListener('click', this._boundHandleClick);
        button.addEventListener('mousedown', this._boundHandleMouseDown);
        button.addEventListener('mouseup', this._boundHandleMouseUp);
        button.addEventListener('mouseleave', this._boundHandleMouseUp);
        button.addEventListener('keydown', this._boundHandleKeyDown);
        button.addEventListener('keyup', this._boundHandleKeyUp);
    }
    
    /**
     * Remove event listeners
     */
    _removeEventListeners() {
        const button = this.shadowRoot.querySelector('.brutal-button');
        if (!button) return;
        
        button.removeEventListener('click', this._boundHandleClick);
        button.removeEventListener('mousedown', this._boundHandleMouseDown);
        button.removeEventListener('mouseup', this._boundHandleMouseUp);
        button.removeEventListener('mouseleave', this._boundHandleMouseUp);
        button.removeEventListener('keydown', this._boundHandleKeyDown);
        button.removeEventListener('keyup', this._boundHandleKeyUp);
    }
    
    /**
     * Attribute changed callback
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        
        switch (name) {
            case 'variant':
                this.state.variant = newValue || 'primary';
                break;
            case 'size':
                this.state.size = newValue || 'medium';
                break;
            case 'loading':
                this.state.loading = newValue !== null;
                break;
            case 'disabled':
                this.state.disabled = newValue !== null;
                break;
            case 'icon':
                this.state.icon = newValue;
                break;
            case 'icon-position':
                this.state.iconPosition = newValue || 'left';
                break;
            case 'full-width':
                this.state.fullWidth = newValue !== null;
                break;
        }
        
        this.render();
    }
}

// Register component
customElements.define('brutal-button', Button);