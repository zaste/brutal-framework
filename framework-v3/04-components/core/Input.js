/**
 * @fileoverview BRUTAL Input Component - High-performance form input
 * @version 3.0.0
 */

import { FormComponent } from '../base/FormComponent.js';

/**
 * BRUTAL Input - Fastest input in the universe
 * Multi-type support, validation, masks, auto-complete
 */
export class Input extends FormComponent {
    static get observedAttributes() {
        return [
            'type',        // text | number | email | password | tel | url | search | date
            'value',       // current value
            'placeholder', // placeholder text
            'label',       // floating label
            'helper',      // helper text
            'error',       // error message
            'required',    // boolean
            'disabled',    // boolean
            'readonly',    // boolean
            'pattern',     // validation pattern
            'mask',        // input mask
            'min',         // min value/length
            'max',         // max value/length
            'step',        // number step
            'autocomplete', // autocomplete attribute
            'icon',        // icon/emoji
            'loading',     // loading state
            'clearable',   // show clear button
            'size'         // small | medium | large
        ];
    }
    
    constructor() {
        super();
        
        // State
        this.state = {
            type: 'text',
            value: '',
            placeholder: '',
            label: '',
            helper: '',
            error: '',
            required: false,
            disabled: false,
            readonly: false,
            pattern: null,
            mask: null,
            min: null,
            max: null,
            step: null,
            autocomplete: 'off',
            icon: null,
            loading: false,
            clearable: false,
            size: 'medium',
            focused: false,
            touched: false,
            valid: true,
            maskedValue: '',
            showPassword: false,
            suggestions: []
        };
        
        // Internal value for unmasked data
        this._rawValue = '';
        
        // Debounce timer
        this._debounceTimer = null;
        
        // V8 optimization
        this._boundHandleInput = this._handleInput.bind(this);
        this._boundHandleFocus = this._handleFocus.bind(this);
        this._boundHandleBlur = this._handleBlur.bind(this);
        this._boundHandleKeyDown = this._handleKeyDown.bind(this);
        this._boundHandleClear = this._handleClear.bind(this);
        this._boundTogglePassword = this._togglePassword.bind(this);
        this._boundValidate = this._validate.bind(this);
    }
    
    connectedCallback() {
        super.connectedCallback();
        this._setupMask();
    }
    
    /**
     * Render input
     */
    render() {
        const {
            type,
            value,
            placeholder,
            label,
            helper,
            error,
            required,
            disabled,
            readonly,
            pattern,
            min,
            max,
            step,
            autocomplete,
            icon,
            loading,
            clearable,
            size,
            focused,
            touched,
            valid,
            showPassword
        } = this.state;
        
        // Build classes
        const wrapperClasses = ['brutal-input-wrapper'];
        wrapperClasses.push(`brutal-input-wrapper--${size}`);
        if (focused) wrapperClasses.push('brutal-input-wrapper--focused');
        if (error || (!valid && touched)) wrapperClasses.push('brutal-input-wrapper--error');
        if (disabled) wrapperClasses.push('brutal-input-wrapper--disabled');
        if (value || focused) wrapperClasses.push('brutal-input-wrapper--filled');
        if (label) wrapperClasses.push('brutal-input-wrapper--with-label');
        
        const inputType = type === 'password' && showPassword ? 'text' : type;
        
        this.shadowRoot.innerHTML = `
            <style>${this._getStyles()}</style>
            <div class="${wrapperClasses.join(' ')}" part="wrapper">
                ${label ? `
                    <label class="brutal-input-label" for="input">
                        ${label}${required ? ' *' : ''}
                    </label>
                ` : ''}
                
                <div class="brutal-input-container">
                    ${icon ? `<span class="brutal-input-icon">${icon}</span>` : ''}
                    
                    <input
                        id="input"
                        class="brutal-input"
                        type="${inputType}"
                        .value="${value}"
                        placeholder="${placeholder}"
                        ?required="${required}"
                        ?disabled="${disabled}"
                        ?readonly="${readonly}"
                        pattern="${pattern || ''}"
                        min="${min || ''}"
                        max="${max || ''}"
                        step="${step || ''}"
                        autocomplete="${autocomplete}"
                        part="input"
                        aria-describedby="${helper ? 'helper' : ''} ${error ? 'error' : ''}"
                        aria-invalid="${!valid}"
                    />
                    
                    ${this._renderActions()}
                </div>
                
                ${helper || error ? `
                    <div class="brutal-input-message">
                        ${error ? `
                            <span id="error" class="brutal-input-error">${error}</span>
                        ` : `
                            <span id="helper" class="brutal-input-helper">${helper}</span>
                        `}
                        ${this._renderCounter()}
                    </div>
                ` : ''}
                
                ${this._renderSuggestions()}
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
            
            .brutal-input-wrapper {
                position: relative;
            }
            
            /* Label */
            .brutal-input-label {
                display: block;
                margin-bottom: 0.5rem;
                font-size: 0.875rem;
                font-weight: 500;
                color: #ccc;
                transition: all 0.2s;
            }
            
            .brutal-input-wrapper--with-label.brutal-input-wrapper--filled .brutal-input-label,
            .brutal-input-wrapper--with-label.brutal-input-wrapper--focused .brutal-input-label {
                color: #00ff88;
            }
            
            .brutal-input-wrapper--error .brutal-input-label {
                color: #ff0044;
            }
            
            /* Container */
            .brutal-input-container {
                position: relative;
                display: flex;
                align-items: center;
                background: #111;
                border: 2px solid #333;
                border-radius: 6px;
                transition: all 0.2s;
                overflow: hidden;
            }
            
            .brutal-input-wrapper--focused .brutal-input-container {
                border-color: #00ff88;
                box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.1);
            }
            
            .brutal-input-wrapper--error .brutal-input-container {
                border-color: #ff0044;
            }
            
            .brutal-input-wrapper--disabled .brutal-input-container {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            /* Input */
            .brutal-input {
                flex: 1;
                padding: 0.75rem 1rem;
                background: transparent;
                border: none;
                color: #fff;
                font-family: inherit;
                font-size: 1rem;
                outline: none;
                min-width: 0;
            }
            
            /* Sizes */
            .brutal-input-wrapper--small .brutal-input {
                padding: 0.5rem 0.75rem;
                font-size: 0.875rem;
            }
            
            .brutal-input-wrapper--large .brutal-input {
                padding: 1rem 1.25rem;
                font-size: 1.125rem;
            }
            
            /* Placeholder */
            .brutal-input::placeholder {
                color: #666;
            }
            
            /* Disabled */
            .brutal-input:disabled {
                cursor: not-allowed;
                color: #666;
            }
            
            /* Number input arrows */
            .brutal-input[type="number"]::-webkit-inner-spin-button,
            .brutal-input[type="number"]::-webkit-outer-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
            
            .brutal-input[type="number"] {
                -moz-appearance: textfield;
            }
            
            /* Icon */
            .brutal-input-icon {
                display: flex;
                align-items: center;
                padding: 0 0 0 1rem;
                color: #666;
                font-size: 1.2rem;
            }
            
            .brutal-input-wrapper--focused .brutal-input-icon {
                color: #00ff88;
            }
            
            /* Actions */
            .brutal-input-actions {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0 0.5rem;
            }
            
            .brutal-input-action {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 2rem;
                height: 2rem;
                background: transparent;
                border: none;
                border-radius: 4px;
                color: #666;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 1.2rem;
            }
            
            .brutal-input-action:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
            }
            
            .brutal-input-action:active {
                transform: scale(0.9);
            }
            
            /* Spinner */
            .brutal-spinner {
                width: 1.2rem;
                height: 1.2rem;
                border: 2px solid #333;
                border-top-color: #00ff88;
                border-radius: 50%;
                animation: brutal-spin 0.8s linear infinite;
            }
            
            @keyframes brutal-spin {
                to { transform: rotate(360deg); }
            }
            
            /* Messages */
            .brutal-input-message {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 0.25rem;
                font-size: 0.75rem;
            }
            
            .brutal-input-helper {
                color: #666;
            }
            
            .brutal-input-error {
                color: #ff0044;
            }
            
            .brutal-input-counter {
                color: #666;
                font-variant-numeric: tabular-nums;
            }
            
            .brutal-input-counter--exceeded {
                color: #ff0044;
            }
            
            /* Suggestions */
            .brutal-suggestions {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                margin-top: 0.25rem;
                background: #111;
                border: 2px solid #333;
                border-radius: 6px;
                max-height: 200px;
                overflow-y: auto;
                z-index: 10;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            }
            
            .brutal-suggestion {
                padding: 0.75rem 1rem;
                cursor: pointer;
                transition: background 0.1s;
            }
            
            .brutal-suggestion:hover,
            .brutal-suggestion--active {
                background: rgba(0, 255, 136, 0.1);
            }
            
            /* Animations */
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-4px); }
                75% { transform: translateX(4px); }
            }
            
            .brutal-input-wrapper--error .brutal-input-container {
                animation: shake 0.3s;
            }
            
            /* Focus visible */
            .brutal-input:focus-visible {
                outline: none;
            }
            
            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                * {
                    animation: none !important;
                    transition: none !important;
                }
            }
        `;
    }
    
    /**
     * Render action buttons
     */
    _renderActions() {
        const { type, value, clearable, loading, showPassword } = this.state;
        const actions = [];
        
        if (loading) {
            actions.push('<div class="brutal-spinner"></div>');
        }
        
        if (type === 'password') {
            actions.push(`
                <button 
                    type="button"
                    class="brutal-input-action"
                    aria-label="${showPassword ? 'Hide' : 'Show'} password"
                >
                    ${showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
            `);
        }
        
        if (clearable && value && !this.state.disabled) {
            actions.push(`
                <button 
                    type="button"
                    class="brutal-input-action"
                    aria-label="Clear input"
                >
                    ✕
                </button>
            `);
        }
        
        return actions.length > 0 ? `
            <div class="brutal-input-actions">
                ${actions.join('')}
            </div>
        ` : '';
    }
    
    /**
     * Render character counter
     */
    _renderCounter() {
        const { value, max, type } = this.state;
        
        if (!max || type === 'number') return '';
        
        const length = value.length;
        const exceeded = length > parseInt(max);
        
        return `
            <span class="brutal-input-counter ${exceeded ? 'brutal-input-counter--exceeded' : ''}">
                ${length}/${max}
            </span>
        `;
    }
    
    /**
     * Render suggestions dropdown
     */
    _renderSuggestions() {
        const { suggestions } = this.state;
        
        if (!suggestions.length) return '';
        
        return `
            <div class="brutal-suggestions" role="listbox">
                ${suggestions.map((suggestion, i) => `
                    <div 
                        class="brutal-suggestion"
                        role="option"
                        data-index="${i}"
                    >
                        ${suggestion}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Handle input
     */
    _handleInput(e) {
        const input = e.target;
        let value = input.value;
        
        // Apply mask if needed
        if (this.state.mask) {
            value = this._applyMask(value);
            input.value = value;
        }
        
        this._rawValue = this._unmask(value);
        this.state.value = value;
        this.state.touched = true;
        
        // Debounced validation
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(this._boundValidate, 300);
        
        // Emit change event
        this.dispatchEvent(new CustomEvent('brutal:input', {
            bubbles: true,
            composed: true,
            detail: { 
                value: this._rawValue,
                maskedValue: value
            }
        }));
        
        this.render();
    }
    
    /**
     * Handle focus
     */
    _handleFocus() {
        this.state.focused = true;
        this.render();
        
        this.dispatchEvent(new CustomEvent('brutal:focus', {
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Handle blur
     */
    _handleBlur() {
        this.state.focused = false;
        this.state.touched = true;
        this._validate();
        this.render();
        
        this.dispatchEvent(new CustomEvent('brutal:blur', {
            bubbles: true,
            composed: true
        }));
    }
    
    /**
     * Handle key down
     */
    _handleKeyDown(e) {
        // Handle suggestions navigation
        if (this.state.suggestions.length > 0) {
            switch (e.key) {
                case 'ArrowDown':
                case 'ArrowUp':
                    e.preventDefault();
                    // Handle suggestion navigation
                    break;
                case 'Enter':
                    // Select suggestion
                    break;
                case 'Escape':
                    this.state.suggestions = [];
                    this.render();
                    break;
            }
        }
    }
    
    /**
     * Handle clear
     */
    _handleClear() {
        this.state.value = '';
        this._rawValue = '';
        const input = this.shadowRoot.querySelector('.brutal-input');
        input.value = '';
        input.focus();
        
        this.dispatchEvent(new CustomEvent('brutal:clear', {
            bubbles: true,
            composed: true
        }));
        
        this.render();
    }
    
    /**
     * Toggle password visibility
     */
    _togglePassword() {
        this.state.showPassword = !this.state.showPassword;
        this.render();
    }
    
    /**
     * Validate input
     */
    _validate() {
        const { value, required, pattern, type, min, max } = this.state;
        let valid = true;
        let error = '';
        
        // Required validation
        if (required && !value) {
            valid = false;
            error = 'This field is required';
        }
        
        // Pattern validation
        if (pattern && value) {
            const regex = new RegExp(pattern);
            if (!regex.test(value)) {
                valid = false;
                error = 'Invalid format';
            }
        }
        
        // Type-specific validation
        switch (type) {
            case 'email':
                if (value && !this._isValidEmail(value)) {
                    valid = false;
                    error = 'Invalid email address';
                }
                break;
            case 'url':
                if (value && !this._isValidUrl(value)) {
                    valid = false;
                    error = 'Invalid URL';
                }
                break;
            case 'tel':
                if (value && !this._isValidPhone(value)) {
                    valid = false;
                    error = 'Invalid phone number';
                }
                break;
            case 'number':
                if (min !== null && parseFloat(value) < parseFloat(min)) {
                    valid = false;
                    error = `Value must be at least ${min}`;
                }
                if (max !== null && parseFloat(value) > parseFloat(max)) {
                    valid = false;
                    error = `Value must be at most ${max}`;
                }
                break;
        }
        
        // Length validation
        if (type !== 'number' && max && value.length > parseInt(max)) {
            valid = false;
            error = `Maximum ${max} characters`;
        }
        
        this.state.valid = valid;
        this.state.error = this.state.touched ? error : '';
        
        // Emit validation event
        this.dispatchEvent(new CustomEvent('brutal:validate', {
            bubbles: true,
            composed: true,
            detail: { valid, error }
        }));
        
        return valid;
    }
    
    /**
     * Email validation
     */
    _isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    /**
     * URL validation
     */
    _isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Phone validation (basic)
     */
    _isValidPhone(phone) {
        return /^[\d\s\-\+\(\)]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }
    
    /**
     * Setup input mask
     */
    _setupMask() {
        if (!this.state.mask) return;
        
        // Predefined masks
        const masks = {
            phone: '(###) ###-####',
            date: '##/##/####',
            time: '##:##',
            creditcard: '#### #### #### ####',
            zip: '#####'
        };
        
        if (masks[this.state.mask]) {
            this._maskPattern = masks[this.state.mask];
        } else {
            this._maskPattern = this.state.mask;
        }
    }
    
    /**
     * Apply mask to value
     */
    _applyMask(value) {
        if (!this._maskPattern) return value;
        
        const clean = value.replace(/\D/g, '');
        let masked = '';
        let valueIndex = 0;
        
        for (let i = 0; i < this._maskPattern.length && valueIndex < clean.length; i++) {
            if (this._maskPattern[i] === '#') {
                masked += clean[valueIndex++];
            } else {
                masked += this._maskPattern[i];
            }
        }
        
        return masked;
    }
    
    /**
     * Remove mask from value
     */
    _unmask(value) {
        if (!this._maskPattern) return value;
        return value.replace(/\D/g, '');
    }
    
    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        const input = this.shadowRoot.querySelector('.brutal-input');
        input.addEventListener('input', this._boundHandleInput);
        input.addEventListener('focus', this._boundHandleFocus);
        input.addEventListener('blur', this._boundHandleBlur);
        input.addEventListener('keydown', this._boundHandleKeyDown);
        
        // Action buttons
        const actions = this.shadowRoot.querySelectorAll('.brutal-input-action');
        actions.forEach((action, index) => {
            if (this.state.type === 'password' && index === 0) {
                action.addEventListener('click', this._boundTogglePassword);
            } else if (this.state.clearable) {
                action.addEventListener('click', this._boundHandleClear);
            }
        });
    }
    
    /**
     * Get input value
     */
    get value() {
        return this._rawValue || this.state.value;
    }
    
    /**
     * Set input value
     */
    set value(val) {
        this.state.value = val;
        this._rawValue = this._unmask(val);
        this.render();
    }
    
    /**
     * Check validity
     */
    checkValidity() {
        return this._validate();
    }
    
    /**
     * Focus input
     */
    focus() {
        this.shadowRoot.querySelector('.brutal-input')?.focus();
    }
    
    /**
     * Blur input
     */
    blur() {
        this.shadowRoot.querySelector('.brutal-input')?.blur();
    }
}

// Register component
customElements.define('brutal-input', Input);