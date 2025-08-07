/**
 * BRUTAL V4 - Form Handling Foundation
 * Native form validation and serialization
 * HTML5 constraint validation with custom validators
 */

/**
 * BrutalForms - Native form management system
 * Built on HTML5 form validation with enhanced features
 * Zero dependencies, maximum browser compatibility
 */
export class BrutalForms {
    static validators = new Map();
    static customMessages = new Map();
    static formInstances = new WeakMap();
    
    /**
     * Enhanced form wrapper
     */
    static enhance(form, options = {}) {
        if (!form || form.tagName !== 'FORM') {
            throw new Error('[BrutalForms] Element must be a form');
        }
        
        const instance = new FormInstance(form, options);
        this.formInstances.set(form, instance);
        
        return instance;
    }
    
    /**
     * Validate form using native and custom validators
     */
    static validate(form, showErrors = true) {
        const instance = this.formInstances.get(form) || this.enhance(form);
        return instance.validate(showErrors);
    }
    
    /**
     * Serialize form data
     */
    static serialize(form, options = {}) {
        const instance = this.formInstances.get(form) || this.enhance(form);
        return instance.serialize(options);
    }
    
    /**
     * Reset form validation
     */
    static resetValidation(form) {
        const instance = this.formInstances.get(form);
        if (instance) {
            instance.resetValidation();
        }
    }
    
    /**
     * Add custom validator
     */
    static addValidator(name, validator) {
        if (typeof validator !== 'function') {
            throw new Error('[BrutalForms] Validator must be a function');
        }
        
        this.validators.set(name, validator);
    }
    
    /**
     * Add custom validation message
     */
    static addMessage(constraint, message) {
        this.customMessages.set(constraint, message);
    }
    
    /**
     * Get form instance
     */
    static getInstance(form) {
        return this.formInstances.get(form);
    }
}

/**
 * Form instance class
 */
class FormInstance extends EventTarget {
    constructor(form, options = {}) {
        super();
        
        this.form = form;
        this.options = {
            validateOnInput: options.validateOnInput !== false,
            validateOnBlur: options.validateOnBlur !== false,
            showErrorsImmediately: options.showErrorsImmediately || false,
            errorClass: options.errorClass || 'brutal-error',
            errorContainer: options.errorContainer || null,
            customValidators: options.customValidators || {},
            ...options
        };
        
        this.errors = new Map();
        this.touched = new Set();
        this.isValid = true;
        this.isSubmitting = false;
        
        this.init();
    }
    
    /**
     * Initialize form instance
     */
    init() {
        this.setupEventListeners();
        this.setupCustomValidators();
        this.enhanceFormElements();
        
        // Mark form as enhanced
        this.form.setAttribute('data-brutal-enhanced', 'true');
        
        // Initial validation if requested
        if (this.options.showErrorsImmediately) {
            this.validate(true);
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (event) => {
            this.handleSubmit(event);
        });
        
        // Input validation
        if (this.options.validateOnInput) {
            this.form.addEventListener('input', (event) => {
                if (this.touched.has(event.target)) {
                    this.validateField(event.target);
                }
            });
        }
        
        // Blur validation
        if (this.options.validateOnBlur) {
            this.form.addEventListener('blur', (event) => {
                this.touched.add(event.target);
                this.validateField(event.target);
            }, true);
        }
        
        // Focus handling
        this.form.addEventListener('focus', (event) => {
            this.clearFieldError(event.target);
        }, true);
    }
    
    /**
     * Setup custom validators
     */
    setupCustomValidators() {
        Object.entries(this.options.customValidators).forEach(([name, validator]) => {
            BrutalForms.addValidator(name, validator);
        });
    }
    
    /**
     * Enhance form elements
     */
    enhanceFormElements() {
        const elements = this.getFormElements();
        
        elements.forEach(element => {
            // Add ARIA attributes
            if (!element.getAttribute('aria-describedby')) {
                const errorId = this.getErrorId(element);
                element.setAttribute('aria-describedby', errorId);
            }
            
            // Setup custom validators
            this.setupElementValidators(element);
        });
    }
    
    /**
     * Setup validators for element
     */
    setupElementValidators(element) {
        const validators = element.dataset.validators;
        if (!validators) return;
        
        const validatorList = validators.split(',').map(v => v.trim());
        
        validatorList.forEach(validatorName => {
            const validator = BrutalForms.validators.get(validatorName);
            if (validator) {
                element.addEventListener('input', () => {
                    const result = validator(element.value, element);
                    if (result !== true) {
                        this.setFieldError(element, result || `${validatorName} validation failed`);
                    } else {
                        this.clearFieldError(element);
                    }
                });
            }
        });
    }
    
    /**
     * Handle form submission
     */
    async handleSubmit(event) {
        if (this.isSubmitting) {
            event.preventDefault();
            return;
        }
        
        this.isSubmitting = true;
        
        // Validate form
        const isValid = this.validate(true);
        
        if (!isValid) {
            event.preventDefault();
            this.focusFirstError();
            this.emit('validation-failed', { errors: this.getErrors() });
            this.isSubmitting = false;
            return;
        }
        
        // Emit submit event
        const submitEvent = this.emit('submit', {
            data: this.serialize(),
            form: this.form
        });
        
        // Allow async handling
        if (submitEvent.defaultPrevented) {
            event.preventDefault();
        }
        
        this.isSubmitting = false;
    }
    
    /**
     * Validate entire form
     */
    validate(showErrors = false) {
        this.errors.clear();
        this.isValid = true;
        
        const elements = this.getFormElements();
        
        elements.forEach(element => {
            const isFieldValid = this.validateField(element, showErrors);
            if (!isFieldValid) {
                this.isValid = false;
            }
        });
        
        // Emit validation event
        this.emit('validated', {
            isValid: this.isValid,
            errors: this.getErrors()
        });
        
        return this.isValid;
    }
    
    /**
     * Validate single field
     */
    validateField(element, showError = true) {
        if (!this.isFormElement(element)) return true;
        
        let isValid = true;
        let errorMessage = '';
        
        // Native HTML5 validation
        if (!element.checkValidity()) {
            isValid = false;
            errorMessage = this.getValidationMessage(element);
        }
        
        // Custom validators
        if (isValid) {
            const customResult = this.runCustomValidators(element);
            if (customResult !== true) {
                isValid = false;
                errorMessage = customResult;
            }
        }
        
        // Handle validation result
        if (!isValid) {
            this.errors.set(element, errorMessage);
            if (showError) {
                this.showFieldError(element, errorMessage);
            }
        } else {
            this.errors.delete(element);
            if (showError) {
                this.clearFieldError(element);
            }
        }
        
        // Update element attributes
        element.setAttribute('aria-invalid', String(!isValid));
        
        return isValid;
    }
    
    /**
     * Run custom validators for element
     */
    runCustomValidators(element) {
        const validators = element.dataset.validators;
        if (!validators) return true;
        
        const validatorList = validators.split(',').map(v => v.trim());
        
        for (const validatorName of validatorList) {
            const validator = BrutalForms.validators.get(validatorName);
            if (validator) {
                const result = validator(element.value, element);
                if (result !== true) {
                    return result || `${validatorName} validation failed`;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Get validation message
     */
    getValidationMessage(element) {
        const validity = element.validity;
        
        // Custom messages
        for (const [constraint, message] of BrutalForms.customMessages) {
            if (validity[constraint]) {
                return typeof message === 'function' ? message(element) : message;
            }
        }
        
        // Default messages
        if (validity.valueMissing) {
            return element.dataset.requiredMessage || 'This field is required';
        }
        if (validity.typeMismatch) {
            return element.dataset.typeMessage || `Please enter a valid ${element.type}`;
        }
        if (validity.patternMismatch) {
            return element.dataset.patternMessage || 'Please match the requested format';
        }
        if (validity.tooShort) {
            return `Please use at least ${element.minLength} characters`;
        }
        if (validity.tooLong) {
            return `Please use no more than ${element.maxLength} characters`;
        }
        if (validity.rangeUnderflow) {
            return `Please enter a value of ${element.min} or higher`;
        }
        if (validity.rangeOverflow) {
            return `Please enter a value of ${element.max} or lower`;
        }
        if (validity.stepMismatch) {
            return `Please enter a valid value`;
        }
        
        return element.validationMessage || 'Please enter a valid value';
    }
    
    /**
     * Show field error
     */
    showFieldError(element, message) {
        // Add error class
        element.classList.add(this.options.errorClass);
        
        // Create or update error element
        const errorId = this.getErrorId(element);
        let errorElement = document.getElementById(errorId);
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorId;
            errorElement.className = 'brutal-field-error';
            errorElement.setAttribute('role', 'alert');
            errorElement.setAttribute('aria-live', 'polite');
            
            // Insert error element
            const container = this.getErrorContainer(element);
            container.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        
        // Update ARIA
        element.setAttribute('aria-describedby', errorId);
        element.setAttribute('aria-invalid', 'true');
    }
    
    /**
     * Clear field error
     */
    clearFieldError(element) {
        // Remove error class
        element.classList.remove(this.options.errorClass);
        
        // Remove error element
        const errorId = this.getErrorId(element);
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.remove();
        }
        
        // Update ARIA
        element.setAttribute('aria-invalid', 'false');
    }
    
    /**
     * Set field error programmatically
     */
    setFieldError(element, message) {
        this.errors.set(element, message);
        this.showFieldError(element, message);
    }
    
    /**
     * Get error container for element
     */
    getErrorContainer(element) {
        if (this.options.errorContainer) {
            return typeof this.options.errorContainer === 'string' 
                ? document.querySelector(this.options.errorContainer)
                : this.options.errorContainer;
        }
        
        // Try to find form group
        const formGroup = element.closest('.form-group, .field, .input-group');
        if (formGroup) {
            return formGroup;
        }
        
        // Insert after element
        return element.parentNode;
    }
    
    /**
     * Get error ID for element
     */
    getErrorId(element) {
        return `${element.id || element.name || 'field'}-error`;
    }
    
    /**
     * Focus first error
     */
    focusFirstError() {
        const firstError = this.errors.keys().next().value;
        if (firstError) {
            firstError.focus();
        }
    }
    
    /**
     * Serialize form data
     */
    serialize(options = {}) {
        const data = {};
        const formData = new FormData(this.form);
        
        // Basic serialization
        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (checkboxes, selects)
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        // Type conversion
        if (options.convertTypes !== false) {
            this.getFormElements().forEach(element => {
                const value = data[element.name];
                if (value === undefined) return;
                
                switch (element.type) {
                    case 'number':
                    case 'range':
                        data[element.name] = Number(value);
                        break;
                    case 'checkbox':
                        if (!Array.isArray(data[element.name])) {
                            data[element.name] = element.checked;
                        }
                        break;
                    case 'date':
                    case 'datetime-local':
                        data[element.name] = new Date(value);
                        break;
                }
            });
        }
        
        // Return format
        switch (options.format) {
            case 'formdata':
                return formData;
            case 'json':
                return JSON.stringify(data);
            case 'urlencoded':
                return new URLSearchParams(data).toString();
            default:
                return data;
        }
    }
    
    /**
     * Reset validation state
     */
    resetValidation() {
        this.errors.clear();
        this.touched.clear();
        this.isValid = true;
        
        // Clear all field errors
        this.getFormElements().forEach(element => {
            this.clearFieldError(element);
        });
        
        // Emit reset event
        this.emit('validation-reset');
    }
    
    /**
     * Get form elements
     */
    getFormElements() {
        return Array.from(this.form.elements).filter(element => 
            this.isFormElement(element)
        );
    }
    
    /**
     * Check if element is a form element
     */
    isFormElement(element) {
        const formElements = ['INPUT', 'SELECT', 'TEXTAREA'];
        return formElements.includes(element.tagName) && 
               element.type !== 'submit' && 
               element.type !== 'button' &&
               element.type !== 'reset';
    }
    
    /**
     * Get validation errors
     */
    getErrors() {
        const errors = {};
        for (const [element, message] of this.errors) {
            errors[element.name || element.id || 'unknown'] = message;
        }
        return errors;
    }
    
    /**
     * Emit event
     */
    emit(type, detail = {}) {
        const event = new CustomEvent(`brutal:form:${type}`, {
            detail,
            bubbles: true,
            composed: true
        });
        
        this.form.dispatchEvent(event);
        this.dispatchEvent(new CustomEvent(type, { detail }));
        
        return event;
    }
}

/**
 * Common validators
 */
export const CommonValidators = {
    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) || 'Please enter a valid email address';
    },
    
    phone: (value) => {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(value.replace(/\s/g, '')) || 'Please enter a valid phone number';
    },
    
    url: (value) => {
        try {
            new URL(value);
            return true;
        } catch {
            return 'Please enter a valid URL';
        }
    },
    
    minLength: (min) => (value) => {
        return value.length >= min || `Please enter at least ${min} characters`;
    },
    
    maxLength: (max) => (value) => {
        return value.length <= max || `Please enter no more than ${max} characters`;
    },
    
    numeric: (value) => {
        return !isNaN(value) && !isNaN(parseFloat(value)) || 'Please enter a valid number';
    },
    
    alphanumeric: (value) => {
        const alphanumericRegex = /^[a-zA-Z0-9]+$/;
        return alphanumericRegex.test(value) || 'Please use only letters and numbers';
    },
    
    strongPassword: (value) => {
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return strongRegex.test(value) || 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    },
    
    confirmPassword: (passwordFieldName) => (value, element) => {
        const passwordField = element.form.querySelector(`[name="${passwordFieldName}"]`);
        return passwordField && value === passwordField.value || 'Passwords do not match';
    }
};

/**
 * Form utilities
 */
export const FormUtils = {
    /**
     * Auto-enhance all forms
     */
    enhanceAll(options = {}) {
        const forms = document.querySelectorAll('form:not([data-brutal-enhanced])');
        return Array.from(forms).map(form => BrutalForms.enhance(form, options));
    },
    
    /**
     * Create form builder
     */
    createBuilder() {
        return new FormBuilder();
    },
    
    /**
     * Validate single field
     */
    validateField(element, validators = []) {
        const tempForm = document.createElement('form');
        tempForm.appendChild(element.cloneNode(true));
        
        const instance = BrutalForms.enhance(tempForm);
        return instance.validateField(element);
    }
};

/**
 * Form builder class
 */
class FormBuilder {
    constructor() {
        this.form = document.createElement('form');
        this.currentFieldset = null;
    }
    
    addField(type, name, options = {}) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-field';
        
        // Label
        if (options.label) {
            const label = document.createElement('label');
            label.textContent = options.label;
            label.setAttribute('for', name);
            wrapper.appendChild(label);
        }
        
        // Input
        const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
        if (type !== 'textarea') {
            input.type = type;
        }
        input.name = name;
        input.id = name;
        
        // Apply options
        Object.entries(options).forEach(([key, value]) => {
            if (key !== 'label' && key !== 'wrapper') {
                input.setAttribute(key, value);
            }
        });
        
        wrapper.appendChild(input);
        
        // Add to form or current fieldset
        const container = this.currentFieldset || this.form;
        container.appendChild(wrapper);
        
        return this;
    }
    
    addFieldset(legend) {
        this.currentFieldset = document.createElement('fieldset');
        
        if (legend) {
            const legendEl = document.createElement('legend');
            legendEl.textContent = legend;
            this.currentFieldset.appendChild(legendEl);
        }
        
        this.form.appendChild(this.currentFieldset);
        return this;
    }
    
    endFieldset() {
        this.currentFieldset = null;
        return this;
    }
    
    build() {
        return this.form;
    }
}

// Register common validators
Object.entries(CommonValidators).forEach(([name, validator]) => {
    BrutalForms.addValidator(name, validator);
});