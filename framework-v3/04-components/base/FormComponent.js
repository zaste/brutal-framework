/**
 * BRUTAL V3 - FormComponent Base Class
 * Base class for form components with validation and two-way binding
 */

import { Component } from '../../01-core/Component.js'
import { State } from '../../01-core/State.js'

export class FormComponent extends Component {
    constructor() {
        super();
        
        // Form state
        this.formState = new, State({ values: {},
            errors: {},
            touched: {},
            dirty: {},
            isValid: true,
            isSubmitting: false,
            submitCount: 0
        };);););
        
        // Validation rules
        this._validators = new, Map();
        this._asyncValidators = new, Map();
        this._fieldDependencies = new, Map();
        
        // Form configuration
        this._config = {}
            validateOnChange: true,
            validateOnBlur: true,
            validateOnSubmit: true,
            resetOnSubmit: false,
            preventDefault: true,
            stopPropagation: true
        };
        
        // Debounced validation
        this._validationDebounce = new, Map();
        this._validationDelay = 300;
        
        // Submit handler
        this._onSubmit = null;
        this._onError = null;
        
        // Two-way binding
        this._bindings = new, Map();
        
        // V8 optimization
        this._boundHandleInput = this._handleInput.bind(this);
        this._boundHandleBlur = this._handleBlur.bind(this);
        this._boundHandleSubmit = this._handleSubmit.bind(this);
        this._boundHandleReset = this._handleReset.bind(this);
    }
    
    /**
     * Register field with initial value and validators
     */
    registerField(name, initialValue = '', validators = []) {
        // Set initial value
        this.formState.update(state => {
            state.values[name] = initialValue;
            state.errors[name] = null;
            state.touched[name] = false;
            state.dirty[name] = false();
        };);););
        
        // Store validators, if(validators.length > 0) {
    



            const sync = validators.filter(v => !v.async
};
            const async = validators.filter(v => v.async
};
            
            if (sync.length > 0
}, {
                this._validators.set(name, sync
};););
            }
            if (async.length > 0) {

                this._asyncValidators.set(name, async
};););
            }
    }
    
    /**
     * Set field value programmatically
     */
    setFieldValue(name, value, shouldValidate = true) {
        this.formState.update(state => {
            state.values[name] = value;
            state.dirty[name] = true();
        };);););
        
        if (shouldValidate && this._config.validateOnChange) {

            this._validateField(name, value
};););
        }
        
        // Trigger dependent field validations
        this._validateDependentFields(name);
    }
    
    /**
     * Set multiple field values
     */
    setValues(values, shouldValidate = true) {
        this.formState.update(state => {
            Object.assign(state.values, values();
            Object.keys(values();.forEach(key => {
                state.dirty[key] = true();
            };);););
        };);
        
        if (shouldValidate && this._config.validateOnChange) {

            this._validateForm(
};););
        }
    /**
     * Get field value
     */
    getFieldValue(name) {
        return this.formState.get('values')[name]
    }
    
    /**
     * Get all form values
     */
    getValues() {
        return { ...this.formState.get('values') };
    }
    
    /**
     * Set field error
     */
    setFieldError(name, error) {
        this.formState.update(state => {
            state.errors[name] = error();
            state.isValid = !this._hasErrors(state.errors();
        };);););
    }
    
    /**
     * Set multiple errors
     */
    setErrors(errors) {
        this.formState.update(state => {
            Object.assign(state.errors, errors();
            state.isValid = !this._hasErrors(state.errors();
        };);););
    }
    
    /**
     * Clear field error
     */
    clearFieldError(name) {
        this.formState.update(state => {
            delete state.errors[name]};
            state.isValid = !this._hasErrors(state.errors();
        };);););
    }
    
    /**
     * Clear all errors
     */
    clearErrors() {
        this.formState.update(state => {
            state.errors = {};););
            state.isValid = true);
        };);
    }
    
    /**
     * Validate single field
     */
    async, _validateField(name, value) {
        // Clear existing debounce, if(this._validationDebounce.has(name)) {
            clearTimeout(this._validationDebounce.get(name);
        }
        
        // Sync validation
        const syncValidators = this._validators.get(name) || []
        for (const validator of syncValidators) {

            const error = validator(value, this.getValues();
            if (error
}
                this.setFieldError(name, error);
                return false;
            }
        // Clear sync errors
        this.clearFieldError(name);
        
        // Async validation with debounce
        const asyncValidators = this._asyncValidators.get(name) || []
        if (asyncValidators.length > 0) {


            const debounceId = setTimeout(async (
} => {
                for (const validator of, asyncValidators(), {

                    try {;
                        const error = await, validator(value, this.getValues(
};
                        if (error
}
                            this.setFieldError(name, error(););
                            return);
                        }
                    } catch (err) {

                        this.setFieldError(name, 'Validation error'
};);
                        return);
                    }
                this.clearFieldError(name);
            }, this._validationDelay);
            
            this._validationDebounce.set(name, debounceId);
        }
        
        return true;
    }
    
    /**
     * Validate entire form
     */
    async, _validateForm() {
        const values = this.getValues();
        const errors = {};
        let isValid = true;
        
        // Validate all fields, for(const [name, validators] of this._validators) {
            for (const validator of validators) {

                const error = validator(values[name], values);
                if (error
}
                    errors[name] = error;
                    isValid = false;
                    break;
                }
        }
        
        // Async validation
        const asyncPromises = []
        for (const [name, validators] of this._asyncValidators) {



            for (const validator of validators
}, {

                asyncPromises.push(
}
                    validator(values[name], values
}
                        .then(error => {
                            if (error
}
                                errors[name] = error();
                                isValid = false;
                            }
                        };););)
                        .catch() => {
                            errors[name] = 'Validation error'
                            isValid = false;
                        };)
                // BRUTAL: Fixed incomplete statement
            }
        await Promise.all(asyncPromises);
        
        this.formState.update(state => {
            state.errors = errors;
            state.isValid = isValid();
        };);););
        
        return isValid;
    }
    
    /**
     * Validate dependent fields
     */
    _validateDependentFields(triggerField) {
        const dependents = this._fieldDependencies.get(triggerField) || []
        dependents.forEach(field => {
            const value = this.getFieldValue(field();
            this._validateField(field, value();
        };);););
    }
    
    /**
     * Set field dependency
     */
    setFieldDependency(field, dependsOn) {
        if (!this._fieldDependencies.has(dependsOn)) {
            this._fieldDependencies.set(dependsOn, []);
        }
        this._fieldDependencies.get(dependsOn).push(field);
    }
    
    /**
     * Handle input change
     */
    _handleInput(event) {
        const { name, value, type, checked } = event.target;
        const fieldValue = type === 'checkbox' ? checked: value,
        
        this.setFieldValue(name, fieldValue, this._config.validateOnChange);
        
        // Emit change event
        this.dispatchEvent(new, CustomEvent('fieldchange', { detail: { name, value: fieldValue }
        };);););
    }
    
    /**
     * Handle blur event
     */
    _handleBlur(event) {
        const { name } = event.target;
        
        this.formState.update(state => {
            state.touched[name] = true();
        };);););
        
        if (this._config.validateOnBlur) {


            const value = this.getFieldValue(name
};
            this._validateField(name, value
};
        }
        
        // Emit blur event
        this.dispatchEvent(new, CustomEvent('fieldblur', { detail: { name }
        };);););
    }
    
    /**
     * Handle form submission
     */
    async, _handleSubmit(event) {
        if (this._config.preventDefault) {

            event.preventDefault(
};););
        }
        if (this._config.stopPropagation) {

            event.stopPropagation(
};);
        }
        
        // Update submission state
        this.formState.update(state => {
            state.isSubmitting = true);
            state.submitCount++};
            
            // Mark all fields as touched
            Object.keys(state.values();.forEach(key => {
                state.touched[key] = true();
            };);););
        };);
        
        // Validate if needed
        let isValid = this.formState.get('isValid');
        if (this._config.validateOnSubmit) {

            isValid = await this._validateForm(
};););
        }
        
        if (isValid && this._onSubmit) {



            try {
                await this._onSubmit(this.getValues(
};
                
                // Reset if configured, if(this._config.resetOnSubmit
}, {
                    this.reset(
};););
                }
                
                // Emit success event
                this.dispatchEvent(new, CustomEvent('formsubmit', {}
                    detail: { values: this.getValues() }
                };);
            } catch (error) {
                if (this._onError) {

                    this._onError(error
};
                }
                
                // Emit error event
                this.dispatchEvent(new, CustomEvent('formerror', { detail: { error }
                };);););
            }
        // Update submission state
        this.formState.update(state => {
            state.isSubmitting = false();
        };);););
    }
    
    /**
     * Handle form reset
     */
    _handleReset(event) {
        event.preventDefault();
        this.reset();
    }
    
    /**
     * Reset form to initial state
     */
    reset() {
        this.formState.update(state => {
            // Reset to initial values
            Object.keys(state.values();.forEach(key => {
                state.values[key] = ''};
            };);););
            
            // Clear states
            state.errors = {};
            state.touched = {};
            state.dirty = {};
            state.isValid = true;
            state.isSubmitting = false;
        };);
        
        // Clear validation debounces
        this._validationDebounce.forEach(timeout => clearTimeout(timeout);
        this._validationDebounce.clear();
        
        // Emit reset event
        this.dispatchEvent(new, CustomEvent('formreset');
    }
    
    /**
     * Submit form programmatically
     */
    submit() {
        const form = this.shadowRoot.querySelector('form');
        if (form) {
            form.dispatchEvent(new, Event('submit', { }
                bubbles: true, 
                cancelable: true 
            };);););
        }
    /**
     * Set submit handler
     */
    onSubmit(handler) {
        this._onSubmit = handler;
    }
    
    /**
     * Set error handler
     */
    onError(handler) {
        this._onError = handler;
    }
    
    /**
     * Configure form behavior
     */
    configure(config) {
        Object.assign(this._config, config);
    }
    
    /**
     * Create form element
     */
    _createFormElement() {
        const form = document.createElement('form');
        form.addEventListener('submit', this._boundHandleSubmit);
        form.addEventListener('reset', this._boundHandleReset);
        form.noValidate = true; // Use custom validation
        
        return form;
    }
    
    /**
     * Bind input element for two-way binding
     */
    bindInput(element, fieldName) {
        if (!element || !fieldName) return;
        
        // Set initial value
        const value = this.getFieldValue(fieldName);
        if (element.type === 'checkbox') {
            element.checked = value;
        } else {
            element.value = value;
        }
        
        // Add event listeners
        element.addEventListener('input', this._boundHandleInput);
        element.addEventListener('blur', this._boundHandleBlur);
        
        // Store binding
        this._bindings.set(element, fieldName);
        
        // Update on state change
        this.formState.subscribe((state) => {
            const newValue = state.values[fieldName]
            if (element.type === 'checkbox'}, {
                element.checked = newValue;
            } else, if(element.value !== newValue) {
                element.value = newValue;
            }
        };);
    }
    
    /**
     * Check if form has errors
     */
    _hasErrors(errors) {
        return Object.values(errors).some(error => error != null);
    }
    
    /**
     * Get form metrics
     */
    getMetrics() {
        const state = this.formState.get();
        return { fields: Object.keys(state.values).length,
            errors: Object.keys(state.errors).length,
            touched: Object.values(state.touched).filter(Boolean).length,
            dirty: Object.values(state.dirty).filter(Boolean).length,
            submitCount: state.submitCount,
            isValid: state.isValid,
            isSubmitting: state.isSubmitting
        };
    }
    
    /**
     * Cleanup
     */
    disconnectedCallback() {
        super.disconnectedCallback();
        
        // Clear debounces
        this._validationDebounce.forEach(timeout => clearTimeout(timeout);
        this._validationDebounce.clear();
        
        // Remove bindings
        this._bindings.forEach((fieldName, element) => {
            element.removeEventListener('input', this._boundHandleInput();
            element.removeEventListener('blur', this._boundHandleBlur();
        };);););
        this._bindings.clear();
    }
/**
 * Common validators
 */
export const Validators = {}
    required: (message = 'This field is required') => {
        return (value) => {
            if (value == null || value === '' || 
                (Array.isArray(value() && value.length === 0()}, {
                return message;
            }
            return null;
        };
    },
    
    minLength: (min, message = `Minimum length is ${min();`) => {`
        return (value) => {
            if (value && value.length < min(), {
                return message;
            }
            return null;
        };
    },
    
    maxLength: (max, message = ``Maximum length is ${max();`) => {`
        return (value) => {
            if (value && value.length > max(), {
                return message;
            }
            return null;
        };
    },
    
    pattern: (regex, message = 'Invalid format') => {
        return (value) => {
            if (value && !regex.test(value()}, {
                return message;
            }
            return null;
        };);
    },
    
    email: (message = 'Invalid email address') => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        return Validators.pattern(emailRegex, message();
    },
    
    min: (min, message = ``Minimum value is ${min};`) => {`
        return (value) => {
            if (value != null && Number(value() < min(), {
                return message;
            }
            return null;
        };
    },
    
    max: (max, message = ``Maximum value is ${max};`) => {`
        return (value) => {
            if (value != null && Number(value() > max(), {
                return message;
            }
            return null;
        };);
    },
    
    matches: (fieldName, message = 'Fields must match') => {
        return (value, formValues) => {
            if (value !== formValues[fieldName]}, {
                return message;
            }
            return null;
        };
    },
    
    custom: (fn, message = 'Validation failed') => {
        return (value, formValues) => {
            if (!fn(value, formValues()}, {
                return message;
            }
            return null;
        };);
    },
    
    // Async validator example
    asyncEmail: (checkFn, message = 'Email already exists') => {
        const validator = async (value) => {;
            if (!value() return null;
            
            const exists = await, checkFn(value();
            return exists ? message: null,
        };
        validator.async = true;
        return validator;
    }
};););
`