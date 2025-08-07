/**
 * BRUTAL V4 - Input Component Example
 * Demonstrates form integration with validation and accessibility
 */

import { BrutalComponent } from '../core/foundation/Component.js';
import { html, css } from '../core/templates/index.js';
import { BrutalCore } from '../core/integration/CoreIntegration.js';
import { BrutalForms } from '../core/forms/Forms.js';
import { BrutalA11y } from '../core/accessibility/A11y.js';

/**
 * BrutalInput - Example input component with full integration
 */
export class BrutalInput extends BrutalComponent {
    // Enable form association
    static formAssociated = true;
    
    static get observedAttributes() {
        return ['type', 'placeholder', 'disabled', 'required', 'label', 'error', 'value', 'name'];
    }
    
    constructor() {
        super();
        
        // Wire with core systems
        BrutalCore.wireComponent(this);
        
        // Input-specific setup
        this.inputId = BrutalA11y.generateId('brutal-input');
        this.labelId = BrutalA11y.generateId('brutal-label');
        this.errorId = BrutalA11y.generateId('brutal-error');
        this.helpId = BrutalA11y.generateId('brutal-help');
    }
    
    /**
     * Initialize input state
     */
    initializeState() {
        super.initializeState();
        
        // Input-specific state
        this._state.set({
            type: this.getAttribute('type') || 'text',
            placeholder: this.getAttribute('placeholder') || '',
            disabled: this.hasAttribute('disabled'),
            required: this.hasAttribute('required'),
            label: this.getAttribute('label') || '',
            error: this.getAttribute('error') || '',
            value: this.getAttribute('value') || '',
            focused: false,
            valid: true,
            touched: false
        });
        
        // Validate on state changes
        this._state.subscribe((changes) => {
            if ('value' in changes) {
                this.validateInput();
            }
        });
    }
    
    /**
     * Create input template
     */
    createTemplate() {
        const state = this._state.getAll();
        
        // Set styles using Constructable StyleSheets
        this.setStyles(this.getInputStyles());
        
        this._template = html`
            <div class="brutal-input">
                ${state.label ? html`
                    <label 
                        class="brutal-input__label" 
                        for="${this.inputId}"
                        id="${this.labelId}"
                    >
                        ${state.label}
                        ${state.required ? html`<span class="brutal-input__required" aria-label="required">*</span>` : ''}
                    </label>
                ` : ''}
                
                <div class="brutal-input__wrapper">
                    <input
                        class="brutal-input__field"
                        id="${this.inputId}"
                        type="${state.type}"
                        placeholder="${state.placeholder}"
                        ?disabled="${state.disabled}"
                        ?required="${state.required}"
                        value="${state.value}"
                        aria-labelledby="${state.label ? this.labelId : ''}"
                        aria-describedby="${state.error ? this.errorId : this.helpId}"
                        aria-invalid="${!state.valid}"
                    />
                    
                    ${this.renderInputAddons()}
                </div>
                
                ${state.error ? html`
                    <div 
                        class="brutal-input__error" 
                        id="${this.errorId}"
                        role="alert"
                        aria-live="polite"
                    >
                        ${state.error}
                    </div>
                ` : ''}
                
                <div class="brutal-input__help" id="${this.helpId}">
                    <slot name="help"></slot>
                </div>
            </div>
        `;
    }
    
    /**
     * Render input addons (icons, buttons, etc.)
     */
    renderInputAddons() {
        return html`
            <slot name="prefix"></slot>
            <slot name="suffix"></slot>
        `;
    }
    
    /**
     * Get input styles with design tokens
     */
    getInputStyles() {
        return css`
            :host {
                display: block;
                width: 100%;
            }
            
            .brutal-input {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-1);
            }
            
            .brutal-input__label {
                font-size: var(--text-sm);
                font-weight: var(--font-medium);
                color: var(--theme-text-primary);
                margin-bottom: var(--spacing-1);
                display: block;
            }
            
            .brutal-input__required {
                color: var(--color-error-500);
                margin-left: var(--spacing-1);
            }
            
            .brutal-input__wrapper {
                position: relative;
                display: flex;
                align-items: center;
            }
            
            .brutal-input__field {
                flex: 1;
                width: 100%;
                padding: var(--spacing-3);
                border: 1px solid var(--theme-border-primary);
                border-radius: var(--borderRadius-md);
                background: var(--theme-bg-primary);
                color: var(--theme-text-primary);
                font-family: var(--typography-font-sans);
                font-size: var(--text-base);
                line-height: var(--leading-normal);
                transition: all var(--animation-duration-200) var(--animation-ease-out);
                outline: none;
            }
            
            .brutal-input__field::placeholder {
                color: var(--theme-text-tertiary);
            }
            
            /* Focus styles */
            .brutal-input__field:focus {
                border-color: var(--theme-border-focus);
                box-shadow: 0 0 0 1px var(--theme-border-focus);
            }
            
            /* Hover styles */
            .brutal-input__field:hover:not(:disabled) {
                border-color: var(--theme-border-secondary);
            }
            
            /* Error styles */
            :host([error]) .brutal-input__field,
            .brutal-input__field[aria-invalid="true"] {
                border-color: var(--color-error-500);
            }
            
            :host([error]) .brutal-input__field:focus,
            .brutal-input__field[aria-invalid="true"]:focus {
                border-color: var(--color-error-500);
                box-shadow: 0 0 0 1px var(--color-error-500);
            }
            
            /* Success styles */
            :host([valid]) .brutal-input__field {
                border-color: var(--color-success-500);
            }
            
            /* Disabled styles */
            .brutal-input__field:disabled {
                background: var(--theme-bg-secondary);
                color: var(--theme-text-tertiary);
                cursor: not-allowed;
                opacity: 0.6;
            }
            
            /* Size variants */
            :host([size="small"]) .brutal-input__field {
                padding: var(--spacing-2);
                font-size: var(--text-sm);
            }
            
            :host([size="large"]) .brutal-input__field {
                padding: var(--spacing-4);
                font-size: var(--text-lg);
            }
            
            /* Error message */
            .brutal-input__error {
                font-size: var(--text-sm);
                color: var(--color-error-600);
                margin-top: var(--spacing-1);
                display: flex;
                align-items: center;
                gap: var(--spacing-1);
            }
            
            .brutal-input__error::before {
                content: "⚠️";
                font-size: var(--text-xs);
            }
            
            /* Help text */
            .brutal-input__help {
                font-size: var(--text-xs);
                color: var(--theme-text-tertiary);
                margin-top: var(--spacing-1);
            }
            
            .brutal-input__help:empty {
                display: none;
            }
            
            /* Addons */
            ::slotted([slot="prefix"]) {
                position: absolute;
                left: var(--spacing-3);
                z-index: 1;
                pointer-events: none;
                color: var(--theme-text-tertiary);
            }
            
            ::slotted([slot="suffix"]) {
                position: absolute;
                right: var(--spacing-3);
                z-index: 1;
                color: var(--theme-text-tertiary);
            }
            
            :host([prefix]) .brutal-input__field {
                padding-left: calc(var(--spacing-3) * 3);
            }
            
            :host([suffix]) .brutal-input__field {
                padding-right: calc(var(--spacing-3) * 3);
            }
            
            /* Type-specific styles */
            .brutal-input__field[type="search"] {
                padding-right: calc(var(--spacing-3) * 2);
            }
            
            .brutal-input__field[type="password"] {
                font-family: text-security-disc;
            }
            
            /* High contrast support */
            @media (prefers-contrast: high) {
                .brutal-input__field {
                    border-width: 2px;
                }
                
                .brutal-input__field:focus {
                    border-width: 3px;
                }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .brutal-input__field {
                    transition: none;
                }
            }
        `;
    }
    
    /**
     * Setup input event listeners
     */
    setupEventListeners() {
        super.setupEventListeners();
        
        const input = this.shadowRoot?.querySelector('.brutal-input__field');
        if (!input) return;
        
        // Input events
        input.addEventListener('input', (event) => {
            const value = event.target.value;
            this._state.set({ value, touched: true });
            
            this.emit('brutal:input:input', {
                value,
                type: this._state.get('type'),
                valid: this._state.get('valid')
            });
        });
        
        input.addEventListener('change', (event) => {
            const value = event.target.value;
            this._state.set({ value });
            
            this.emit('brutal:input:change', {
                value,
                type: this._state.get('type'),
                valid: this._state.get('valid')
            });
        });
        
        // Focus events
        input.addEventListener('focus', () => {
            this._state.set({ focused: true });
            this.emit('brutal:input:focus');
        });
        
        input.addEventListener('blur', () => {
            this._state.set({ focused: false, touched: true });
            this.validateInput();
            this.emit('brutal:input:blur', {
                value: this._state.get('value'),
                valid: this._state.get('valid')
            });
        });
        
        // Keyboard events
        input.addEventListener('keydown', (event) => {
            this.emit('brutal:input:keydown', {
                key: event.key,
                value: event.target.value
            });
            
            if (event.key === 'Enter') {
                this.emit('brutal:input:enter', {
                    value: event.target.value,
                    valid: this._state.get('valid')
                });
            }
        });
    }
    
    /**
     * Validate input value
     */
    validateInput() {
        const value = this._state.get('value');
        const type = this._state.get('type');
        const required = this._state.get('required');
        
        let isValid = true;
        let errorMessage = '';
        
        // Required validation
        if (required && !value.trim()) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        
        // Type-specific validation
        if (isValid && value) {
            switch (type) {
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid email address';
                    }
                    break;
                    
                case 'url':
                    try {
                        new URL(value);
                    } catch {
                        isValid = false;
                        errorMessage = 'Please enter a valid URL';
                    }
                    break;
                    
                case 'tel':
                    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                        isValid = false;
                        errorMessage = 'Please enter a valid phone number';
                    }
                    break;
            }
        }
        
        // Custom validation
        const customValidation = this.getAttribute('validation');
        if (isValid && customValidation && value) {
            try {
                const validator = new Function('value', customValidation);
                const result = validator(value);
                if (result !== true) {
                    isValid = false;
                    errorMessage = typeof result === 'string' ? result : 'Invalid input';
                }
            } catch (error) {
                console.warn('[BrutalInput] Custom validation error:', error);
            }
        }
        
        // Update state
        this._state.set({ 
            valid: isValid,
            error: isValid ? '' : errorMessage
        });
        
        // Update form validity via ElementInternals
        if (this._internals) {
            if (isValid) {
                this._internals.setValidity({});
            } else {
                this._internals.setValidity(
                    { customError: true },
                    errorMessage,
                    this.shadowRoot?.querySelector('.brutal-input__field')
                );
            }
        }
        
        // Update attributes for styling
        if (isValid) {
            this.setAttribute('valid', '');
            this.removeAttribute('error');
        } else {
            this.removeAttribute('valid');
            this.setAttribute('error', errorMessage);
        }
        
        // Emit validation event
        this.emit('brutal:input:validation', {
            valid: isValid,
            error: errorMessage,
            value
        });
        
        return isValid;
    }
    
    /**
     * Public API methods
     */
    
    /**
     * Get input value
     */
    getValue() {
        return this._state.get('value');
    }
    
    /**
     * Set input value
     */
    setValue(value) {
        this._state.set({ value: String(value) });
        const input = this.shadowRoot?.querySelector('.brutal-input__field');
        if (input) {
            input.value = String(value);
        }
        this.validateInput();
    }
    
    /**
     * Focus input
     */
    focus() {
        const input = this.shadowRoot?.querySelector('.brutal-input__field');
        if (input) {
            input.focus();
        }
    }
    
    /**
     * Clear input
     */
    clear() {
        this.setValue('');
    }
    
    /**
     * Reset input to initial state
     */
    reset() {
        this.setValue(this.getAttribute('value') || '');
        this._state.set({
            valid: true,
            error: '',
            touched: false,
            focused: false
        });
        this.removeAttribute('error');
        this.removeAttribute('valid');
    }
    
    /**
     * Check if input is valid
     */
    isValid() {
        return this._state.get('valid');
    }
    
    /**
     * Get input state
     */
    getInputState() {
        return {
            ...this._state.getAll(),
            element: this
        };
    }
    
    /**
     * Form lifecycle callbacks
     */
    onFormAssociated(form) {
        // Called when input is associated with a form
        if (this._internals && this.hasAttribute('value')) {
            this._internals.setFormValue(this.getAttribute('value'));
        }
    }
    
    onFormReset() {
        // Reset to default value on form reset
        this.reset();
        if (this._internals) {
            this._internals.setFormValue('');
            this._internals.setValidity({});
        }
    }
    
    onFormDisabled(disabled) {
        // Sync disabled state with form
        if (disabled) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
        this._state.set({ disabled });
    }
    
    /**
     * Handle attribute changes
     */
    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        
        if (this._state) {
            switch (name) {
                case 'value':
                    if (newValue !== this._state.get('value')) {
                        this.setValue(newValue || '');
                    }
                    break;
                case 'disabled':
                    this._state.set({ disabled: newValue !== null });
                    break;
                case 'required':
                    this._state.set({ required: newValue !== null });
                    this.validateInput();
                    break;
                case 'type':
                case 'placeholder':
                case 'label':
                    this._state.set({ [name]: newValue || '' });
                    break;
                case 'error':
                    this._state.set({ error: newValue || '', valid: !newValue });
                    break;
            }
        }
    }
}

// Register input component
if (!customElements.get('brutal-input')) {
    customElements.define('brutal-input', BrutalInput);
}