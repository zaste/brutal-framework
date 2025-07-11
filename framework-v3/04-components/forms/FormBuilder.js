/**
 * BRUTAL V3 - FormBuilder Component
 * Dynamic form generation with reactive validation and two-way binding
 * Zero dependencies, GPU-accelerated animations, SharedArrayBuffer state
 */

import { FormComponent } from '../base/FormComponent.js';
import { html, css } from '../../01-core/Template.js';
import { animationSystem } from '../../02-performance/08-AnimationSystem.js';

export class FormBuilder extends FormComponent {
    constructor() {
        super();
        
        // Form schema
        this._schema = null;
        this._fields = new Map();
        this._sections = [];
        this._currentStep = 0;
        
        // Form configuration
        this._config = {
            layout: 'vertical', // vertical, horizontal, grid
            columns: 2,
            submitButton: true,
            resetButton: true,
            validateOnBlur: true,
            validateOnChange: false,
            showProgress: false,
            animation: true
        };
        
        // Conditional logic
        this._conditionals = new Map();
        this._computedFields = new Map();
        
        // Form state
        this._isSubmitting = false;
        this._isDirty = false;
        this._touchedFields = new Set();
    }
    
    static get observedAttributes() {
        return [...super.observedAttributes, 'schema', 'layout', 'columns', 
                'submit-text', 'reset-text', 'validate-on-blur', 'validate-on-change'];
    }
    
    /**
     * Load form schema
     */
    set schema(value) {
        this._schema = value;
        this._parseSchema();
        this._render();
    }
    
    get schema() {
        return this._schema;
    }
    
    /**
     * Parse form schema
     */
    _parseSchema() {
        if (!this._schema) return;
        
        // Clear existing fields
        this._fields.clear();
        this._sections = [];
        this._conditionals.clear();
        this._computedFields.clear();
        
        // Process sections
        if (this._schema.sections) {
            this._sections = this._schema.sections.map(section => ({
                ...section,
                fields: section.fields.map(field => this._createField(field))
            }));
        } else if (this._schema.fields) {
            // Single section form
            this._sections = [{
                fields: this._schema.fields.map(field => this._createField(field))
            }];
        }
        
        // Set initial values
        if (this._schema.initialValues) {
            this._formData = { ...this._schema.initialValues };
        }
        
        // Setup conditionals
        if (this._schema.conditionals) {
            this._setupConditionals(this._schema.conditionals);
        }
        
        // Setup computed fields
        if (this._schema.computed) {
            this._setupComputedFields(this._schema.computed);
        }
    }
    
    /**
     * Create field from schema
     */
    _createField(fieldSchema) {
        const field = {
            name: fieldSchema.name,
            type: fieldSchema.type || 'text',
            label: fieldSchema.label || fieldSchema.name,
            placeholder: fieldSchema.placeholder || '',
            required: fieldSchema.required || false,
            disabled: fieldSchema.disabled || false,
            readonly: fieldSchema.readonly || false,
            value: fieldSchema.defaultValue || '',
            options: fieldSchema.options || [],
            multiple: fieldSchema.multiple || false,
            min: fieldSchema.min,
            max: fieldSchema.max,
            step: fieldSchema.step,
            pattern: fieldSchema.pattern,
            validators: [],
            asyncValidators: [],
            dependencies: fieldSchema.dependencies || [],
            conditional: fieldSchema.conditional,
            computed: fieldSchema.computed,
            grid: fieldSchema.grid || { span: 1 },
            customComponent: fieldSchema.customComponent
        };
        
        // Setup validators
        if (fieldSchema.validators) {
            field.validators = fieldSchema.validators.map(v => 
                typeof v === 'function' ? v : this._createValidator(v)
            );
        }
        
        // Setup async validators
        if (fieldSchema.asyncValidators) {
            field.asyncValidators = fieldSchema.asyncValidators.map(v => 
                typeof v === 'function' ? v : this._createAsyncValidator(v)
            );
        }
        
        // Add built-in validators
        if (field.required) {
            field.validators.unshift(this._validators.required());
        }
        
        if (field.type === 'email') {
            field.validators.push(this._validators.email());
        }
        
        if (field.pattern) {
            field.validators.push(this._validators.pattern(field.pattern));
        }
        
        if (field.min !== undefined) {
            field.validators.push(this._validators.min(field.min));
        }
        
        if (field.max !== undefined) {
            field.validators.push(this._validators.max(field.max));
        }
        
        this._fields.set(field.name, field);
        return field;
    }
    
    /**
     * Create validator from config
     */
    _createValidator(config) {
        if (typeof config === 'string') {
            return this._validators[config]?.() || (() => null);
        }
        
        if (config.type) {
            const validator = this._validators[config.type];
            return validator ? validator(config.value, config.message) : (() => null);
        }
        
        return () => null;
    }
    
    /**
     * Setup conditional logic
     */
    _setupConditionals(conditionals) {
        for (const [fieldName, condition] of Object.entries(conditionals)) {
            this._conditionals.set(fieldName, {
                condition: typeof condition === 'function' ? condition : 
                    new Function('values', `return ${condition}`),
                dependsOn: this._extractDependencies(condition.toString())
            });
        }
    }
    
    /**
     * Setup computed fields
     */
    _setupComputedFields(computed) {
        for (const [fieldName, computation] of Object.entries(computed)) {
            this._computedFields.set(fieldName, {
                compute: typeof computation === 'function' ? computation :
                    new Function('values', `return ${computation}`),
                dependsOn: this._extractDependencies(computation.toString())
            });
        }
    }
    
    /**
     * Extract field dependencies from function string
     */
    _extractDependencies(fnString) {
        const matches = fnString.match(/values\.(\w+)/g) || [];
        return [...new Set(matches.map(m => m.split('.')[1]))];
    }
    
    /**
     * Render form
     */
    render() {
        if (!this._schema) {
            return '<div class="form-empty">No schema provided</div>';
        }
        
        const isWizard = this._schema.type === 'wizard';
        
        return html`
            <form class="brutal-form ${this._config.layout}" 
                  @submit="${this._handleSubmit}"
                  @reset="${this._handleReset}"
                  novalidate>
                
                ${isWizard ? this._renderWizardProgress() : ''}
                
                <div class="form-content">
                    ${isWizard ? 
                        this._renderWizardStep() : 
                        this._sections.map(section => this._renderSection(section))
                    }
                </div>
                
                ${this._renderActions(isWizard)}
            </form>
        `;
    }
    
    /**
     * Render wizard progress
     */
    _renderWizardProgress() {
        if (!this._config.showProgress) return '';
        
        const steps = this._sections;
        const progress = ((this._currentStep + 1) / steps.length) * 100;
        
        return html`
            <div class="form-progress">
                <div class="progress-bar" style="width: ${progress}%"></div>
                <div class="progress-steps">
                    ${steps.map((step, idx) => html`
                        <div class="progress-step ${idx === this._currentStep ? 'active' : ''} 
                                    ${idx < this._currentStep ? 'completed' : ''}">
                            <div class="step-number">${idx + 1}</div>
                            ${step.title ? html`<div class="step-title">${step.title}</div>` : ''}
                        </div>
                    `)}
                </div>
            </div>
        `;
    }
    
    /**
     * Render wizard step
     */
    _renderWizardStep() {
        const section = this._sections[this._currentStep];
        return this._renderSection(section);
    }
    
    /**
     * Render form section
     */
    _renderSection(section) {
        return html`
            <div class="form-section">
                ${section.title ? html`<h3 class="section-title">${section.title}</h3>` : ''}
                ${section.description ? html`<p class="section-description">${section.description}</p>` : ''}
                
                <div class="form-fields ${this._config.layout === 'grid' ? 'grid-layout' : ''}"
                     style="${this._config.layout === 'grid' ? `--columns: ${this._config.columns}` : ''}">
                    ${section.fields.map(field => this._renderField(field))}
                </div>
            </div>
        `;
    }
    
    /**
     * Render field
     */
    _renderField(field) {
        // Check conditional visibility
        if (field.conditional) {
            const condition = this._conditionals.get(field.name);
            if (condition && !condition.condition(this._formData)) {
                return '';
            }
        }
        
        // Check if field is computed
        if (field.computed) {
            const computed = this._computedFields.get(field.name);
            if (computed) {
                this._formData[field.name] = computed.compute(this._formData);
            }
        }
        
        const error = this._errors.get(field.name);
        const isTouched = this._touchedFields.has(field.name);
        const showError = error && (isTouched || this._showAllErrors);
        
        // Use custom component if provided
        if (field.customComponent) {
            return field.customComponent(field, this._formData[field.name], 
                (value) => this._handleFieldChange(field.name, value));
        }
        
        return html`
            <div class="form-field ${showError ? 'has-error' : ''} 
                        ${field.type} field-${field.name}"
                 style="grid-column: span ${field.grid.span}">
                
                ${field.label ? html`
                    <label class="field-label" for="${field.name}">
                        ${field.label}
                        ${field.required ? html`<span class="required">*</span>` : ''}
                    </label>
                ` : ''}
                
                <div class="field-input-wrapper">
                    ${this._renderInput(field)}
                    
                    ${field.type === 'password' ? html`
                        <button type="button" 
                                class="field-toggle-password"
                                @click="${() => this._togglePasswordVisibility(field.name)}">
                            ${this._passwordVisible?.has(field.name) ? '🙈' : '👁️'}
                        </button>
                    ` : ''}
                </div>
                
                ${showError ? html`
                    <div class="field-error" role="alert">
                        ${error}
                    </div>
                ` : ''}
                
                ${field.description ? html`
                    <div class="field-description">${field.description}</div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Render input based on type
     */
    _renderInput(field) {
        const value = this._formData[field.name] || '';
        const commonProps = {
            id: field.name,
            name: field.name,
            disabled: field.disabled,
            readonly: field.readonly,
            required: field.required,
            placeholder: field.placeholder,
            'aria-invalid': this._errors.has(field.name),
            'aria-describedby': this._errors.has(field.name) ? `${field.name}-error` : null
        };
        
        switch (field.type) {
            case 'textarea':
                return html`
                    <textarea class="field-input"
                              ...${commonProps}
                              .value="${value}"
                              @input="${(e) => this._handleFieldChange(field.name, e.target.value)}"
                              @blur="${() => this._handleFieldBlur(field.name)}"
                              rows="${field.rows || 4}"></textarea>
                `;
                
            case 'select':
                return html`
                    <select class="field-input"
                            ...${commonProps}
                            .value="${value}"
                            @change="${(e) => this._handleFieldChange(field.name, e.target.value)}"
                            @blur="${() => this._handleFieldBlur(field.name)}">
                        ${field.placeholder ? html`
                            <option value="" disabled>${field.placeholder}</option>
                        ` : ''}
                        ${field.options.map(opt => html`
                            <option value="${opt.value}" .selected="${opt.value === value}">
                                ${opt.label}
                            </option>
                        `)}
                    </select>
                `;
                
            case 'radio':
                return html`
                    <div class="field-radio-group" role="radiogroup">
                        ${field.options.map(opt => html`
                            <label class="field-radio">
                                <input type="radio"
                                       name="${field.name}"
                                       value="${opt.value}"
                                       .checked="${opt.value === value}"
                                       ?disabled="${field.disabled}"
                                       ?required="${field.required}"
                                       @change="${(e) => this._handleFieldChange(field.name, e.target.value)}">
                                <span class="radio-label">${opt.label}</span>
                            </label>
                        `)}
                    </div>
                `;
                
            case 'checkbox':
                if (field.multiple && field.options) {
                    return html`
                        <div class="field-checkbox-group" role="group">
                            ${field.options.map(opt => html`
                                <label class="field-checkbox">
                                    <input type="checkbox"
                                           name="${field.name}"
                                           value="${opt.value}"
                                           .checked="${(value || []).includes(opt.value)}"
                                           ?disabled="${field.disabled}"
                                           @change="${(e) => this._handleCheckboxChange(field.name, opt.value, e.target.checked)}">
                                    <span class="checkbox-label">${opt.label}</span>
                                </label>
                            `)}
                        </div>
                    `;
                } else {
                    return html`
                        <label class="field-checkbox">
                            <input type="checkbox"
                                   ...${commonProps}
                                   .checked="${!!value}"
                                   @change="${(e) => this._handleFieldChange(field.name, e.target.checked)}">
                            <span class="checkbox-label">${field.checkboxLabel || field.label}</span>
                        </label>
                    `;
                }
                
            case 'range':
                return html`
                    <div class="field-range">
                        <input type="range"
                               class="field-input"
                               ...${commonProps}
                               .value="${value}"
                               min="${field.min || 0}"
                               max="${field.max || 100}"
                               step="${field.step || 1}"
                               @input="${(e) => this._handleFieldChange(field.name, e.target.value)}">
                        <output class="range-value">${value}</output>
                    </div>
                `;
                
            case 'file':
                return html`
                    <input type="file"
                           class="field-input"
                           ...${commonProps}
                           ?multiple="${field.multiple}"
                           accept="${field.accept || ''}"
                           @change="${(e) => this._handleFileChange(field.name, e.target.files)}">
                `;
                
            case 'date':
            case 'time':
            case 'datetime-local':
            case 'month':
            case 'week':
                return html`
                    <input type="${field.type}"
                           class="field-input"
                           ...${commonProps}
                           .value="${value}"
                           min="${field.min || ''}"
                           max="${field.max || ''}"
                           @input="${(e) => this._handleFieldChange(field.name, e.target.value)}"
                           @blur="${() => this._handleFieldBlur(field.name)}">
                `;
                
            case 'color':
                return html`
                    <input type="color"
                           class="field-input field-color"
                           ...${commonProps}
                           .value="${value || '#000000'}"
                           @input="${(e) => this._handleFieldChange(field.name, e.target.value)}">
                `;
                
            case 'password':
                const showPassword = this._passwordVisible?.has(field.name);
                return html`
                    <input type="${showPassword ? 'text' : 'password'}"
                           class="field-input"
                           ...${commonProps}
                           .value="${value}"
                           @input="${(e) => this._handleFieldChange(field.name, e.target.value)}"
                           @blur="${() => this._handleFieldBlur(field.name)}">
                `;
                
            default:
                return html`
                    <input type="${field.type}"
                           class="field-input"
                           ...${commonProps}
                           .value="${value}"
                           min="${field.min || ''}"
                           max="${field.max || ''}"
                           step="${field.step || ''}"
                           pattern="${field.pattern || ''}"
                           @input="${(e) => this._handleFieldChange(field.name, e.target.value)}"
                           @blur="${() => this._handleFieldBlur(field.name)}">
                `;
        }
    }
    
    /**
     * Render form actions
     */
    _renderActions(isWizard) {
        return html`
            <div class="form-actions">
                ${isWizard ? html`
                    ${this._currentStep > 0 ? html`
                        <button type="button" 
                                class="btn btn-secondary"
                                @click="${this._previousStep}">
                            Previous
                        </button>
                    ` : ''}
                    
                    ${this._currentStep < this._sections.length - 1 ? html`
                        <button type="button" 
                                class="btn btn-primary"
                                @click="${this._nextStep}">
                            Next
                        </button>
                    ` : html`
                        <button type="submit" 
                                class="btn btn-primary"
                                ?disabled="${this._isSubmitting || !this._isValid}">
                            ${this._isSubmitting ? 'Submitting...' : 
                              this.getAttribute('submit-text') || 'Submit'}
                        </button>
                    `}
                ` : html`
                    ${this._config.resetButton ? html`
                        <button type="reset" 
                                class="btn btn-secondary">
                            ${this.getAttribute('reset-text') || 'Reset'}
                        </button>
                    ` : ''}
                    
                    ${this._config.submitButton ? html`
                        <button type="submit" 
                                class="btn btn-primary"
                                ?disabled="${this._isSubmitting || !this._isValid}">
                            ${this._isSubmitting ? 'Submitting...' : 
                              this.getAttribute('submit-text') || 'Submit'}
                        </button>
                    ` : ''}
                `}
            </div>
        `;
    }
    
    /**
     * Handle field change
     */
    _handleFieldChange(fieldName, value) {
        // Update form data
        this._formData[fieldName] = value;
        this._isDirty = true;
        
        // Mark as touched if validate on change
        if (this._config.validateOnChange) {
            this._touchedFields.add(fieldName);
        }
        
        // Update dependent computed fields
        this._updateComputedFields(fieldName);
        
        // Update conditional fields
        this._updateConditionalFields(fieldName);
        
        // Validate if needed
        if (this._config.validateOnChange) {
            this._validateField(fieldName);
        }
        
        // Emit change event
        this.dispatchEvent(new CustomEvent('fieldchange', {
            detail: { field: fieldName, value, formData: this._formData }
        }));
        
        this._render();
    }
    
    /**
     * Handle checkbox change for multiple selection
     */
    _handleCheckboxChange(fieldName, optionValue, checked) {
        const currentValue = this._formData[fieldName] || [];
        
        if (checked) {
            this._formData[fieldName] = [...currentValue, optionValue];
        } else {
            this._formData[fieldName] = currentValue.filter(v => v !== optionValue);
        }
        
        this._handleFieldChange(fieldName, this._formData[fieldName]);
    }
    
    /**
     * Handle file change
     */
    _handleFileChange(fieldName, files) {
        const field = this._fields.get(fieldName);
        const value = field.multiple ? Array.from(files) : files[0];
        this._handleFieldChange(fieldName, value);
    }
    
    /**
     * Handle field blur
     */
    _handleFieldBlur(fieldName) {
        this._touchedFields.add(fieldName);
        
        if (this._config.validateOnBlur) {
            this._validateField(fieldName);
            this._render();
        }
    }
    
    /**
     * Update computed fields
     */
    _updateComputedFields(changedField) {
        for (const [fieldName, computed] of this._computedFields) {
            if (computed.dependsOn.includes(changedField)) {
                const newValue = computed.compute(this._formData);
                if (this._formData[fieldName] !== newValue) {
                    this._formData[fieldName] = newValue;
                }
            }
        }
    }
    
    /**
     * Update conditional fields
     */
    _updateConditionalFields(changedField) {
        for (const [fieldName, conditional] of this._conditionals) {
            if (conditional.dependsOn.includes(changedField)) {
                // Re-render to show/hide fields
                this._render();
                break;
            }
        }
    }
    
    /**
     * Toggle password visibility
     */
    _togglePasswordVisibility(fieldName) {
        if (!this._passwordVisible) {
            this._passwordVisible = new Set();
        }
        
        if (this._passwordVisible.has(fieldName)) {
            this._passwordVisible.delete(fieldName);
        } else {
            this._passwordVisible.add(fieldName);
        }
        
        this._render();
    }
    
    /**
     * Navigate wizard steps
     */
    _previousStep() {
        if (this._currentStep > 0) {
            this._currentStep--;
            this._animateStepTransition('prev');
            this._render();
        }
    }
    
    _nextStep() {
        // Validate current step
        const currentSection = this._sections[this._currentStep];
        const stepValid = currentSection.fields.every(field => 
            !this._errors.has(field.name)
        );
        
        if (stepValid && this._currentStep < this._sections.length - 1) {
            this._currentStep++;
            this._animateStepTransition('next');
            this._render();
        }
    }
    
    /**
     * Animate step transitions
     */
    _animateStepTransition(direction) {
        if (!this._config.animation) return;
        
        const content = this.shadowRoot.querySelector('.form-content');
        if (!content) return;
        
        animationSystem.animate(content, {
            from: { opacity: 1, transform: 'translateX(0)' },
            to: { opacity: 0, transform: `translateX(${direction === 'next' ? '-20px' : '20px'})` },
            duration: 150,
            easing: 'ease-out',
            onComplete: () => {
                animationSystem.animate(content, {
                    from: { opacity: 0, transform: `translateX(${direction === 'next' ? '20px' : '-20px'})` },
                    to: { opacity: 1, transform: 'translateX(0)' },
                    duration: 150,
                    easing: 'ease-in'
                });
            }
        });
    }
    
    /**
     * Handle form submission
     */
    async _handleSubmit(event) {
        event.preventDefault();
        
        if (this._isSubmitting) return;
        
        // Show all errors
        this._showAllErrors = true;
        
        // Validate all fields
        await this.validate();
        
        if (!this._isValid) {
            this._render();
            return;
        }
        
        this._isSubmitting = true;
        this._render();
        
        // Emit submit event
        const submitEvent = new CustomEvent('submit', {
            detail: { 
                data: this._formData,
                schema: this._schema
            },
            cancelable: true
        });
        
        this.dispatchEvent(submitEvent);
        
        // If not prevented, submit to server
        if (!submitEvent.defaultPrevented && this._schema.action) {
            try {
                const response = await fetch(this._schema.action, {
                    method: this._schema.method || 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this._formData)
                });
                
                if (response.ok) {
                    this.dispatchEvent(new CustomEvent('success', {
                        detail: { response, data: this._formData }
                    }));
                    
                    // Reset form if configured
                    if (this._schema.resetOnSuccess) {
                        this.reset();
                    }
                } else {
                    throw new Error(`Server error: ${response.status}`);
                }
            } catch (error) {
                this.dispatchEvent(new CustomEvent('error', {
                    detail: { error, data: this._formData }
                }));
            }
        }
        
        this._isSubmitting = false;
        this._render();
    }
    
    /**
     * Handle form reset
     */
    _handleReset(event) {
        event.preventDefault();
        this.reset();
    }
    
    /**
     * Public API - Get form data
     */
    getData() {
        return { ...this._formData };
    }
    
    /**
     * Public API - Set form data
     */
    setData(data) {
        this._formData = { ...this._formData, ...data };
        this._render();
    }
    
    /**
     * Public API - Get field value
     */
    getFieldValue(fieldName) {
        return this._formData[fieldName];
    }
    
    /**
     * Public API - Set field value
     */
    setFieldValue(fieldName, value) {
        this._handleFieldChange(fieldName, value);
    }
    
    /**
     * Styles
     */
    styles() {
        return css`
            :host {
                display: block;
                font-family: system-ui, -apple-system, sans-serif;
                --form-spacing: 1.5rem;
                --field-spacing: 1rem;
                --input-height: 40px;
                --input-padding: 0.5rem 0.75rem;
                --input-border: 1px solid #ddd;
                --input-radius: 4px;
                --input-focus: #2196f3;
                --error-color: #f44336;
                --success-color: #4caf50;
                --label-color: #666;
                --text-color: #333;
            }
            
            .brutal-form {
                max-width: 100%;
            }
            
            /* Progress bar for wizard */
            .form-progress {
                margin-bottom: var(--form-spacing);
            }
            
            .progress-bar {
                height: 4px;
                background: var(--input-focus);
                border-radius: 2px;
                transition: width 0.3s ease;
                margin-bottom: 1rem;
            }
            
            .progress-steps {
                display: flex;
                justify-content: space-between;
            }
            
            .progress-step {
                text-align: center;
                position: relative;
                flex: 1;
            }
            
            .step-number {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #e0e0e0;
                color: #666;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                transition: all 0.3s;
            }
            
            .progress-step.active .step-number {
                background: var(--input-focus);
                color: white;
                transform: scale(1.1);
            }
            
            .progress-step.completed .step-number {
                background: var(--success-color);
                color: white;
            }
            
            .step-title {
                font-size: 0.875rem;
                margin-top: 0.5rem;
                color: var(--label-color);
            }
            
            /* Sections */
            .form-section {
                margin-bottom: var(--form-spacing);
            }
            
            .section-title {
                margin: 0 0 0.5rem 0;
                color: var(--text-color);
                font-size: 1.25rem;
            }
            
            .section-description {
                margin: 0 0 1rem 0;
                color: var(--label-color);
                font-size: 0.9rem;
            }
            
            /* Field layout */
            .form-fields {
                display: flex;
                flex-direction: column;
                gap: var(--field-spacing);
            }
            
            .form-fields.grid-layout {
                display: grid;
                grid-template-columns: repeat(var(--columns, 2), 1fr);
                gap: var(--field-spacing);
            }
            
            .horizontal .form-fields {
                flex-direction: row;
                flex-wrap: wrap;
            }
            
            /* Fields */
            .form-field {
                display: flex;
                flex-direction: column;
            }
            
            .field-label {
                display: block;
                margin-bottom: 0.25rem;
                color: var(--label-color);
                font-weight: 500;
                font-size: 0.9rem;
            }
            
            .required {
                color: var(--error-color);
                margin-left: 0.25rem;
            }
            
            .field-input-wrapper {
                position: relative;
            }
            
            /* Inputs */
            .field-input {
                width: 100%;
                height: var(--input-height);
                padding: var(--input-padding);
                border: var(--input-border);
                border-radius: var(--input-radius);
                font: inherit;
                color: var(--text-color);
                background: white;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            
            textarea.field-input {
                height: auto;
                min-height: calc(var(--input-height) * 2);
                resize: vertical;
            }
            
            .field-input:focus {
                outline: none;
                border-color: var(--input-focus);
                box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
            }
            
            .field-input:disabled {
                background: #f5f5f5;
                cursor: not-allowed;
                opacity: 0.6;
            }
            
            .has-error .field-input {
                border-color: var(--error-color);
            }
            
            .has-error .field-input:focus {
                box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
            }
            
            /* Special inputs */
            .field-color {
                height: var(--input-height);
                padding: 0.25rem;
                cursor: pointer;
            }
            
            .field-range {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .field-range input {
                flex: 1;
            }
            
            .range-value {
                min-width: 3ch;
                text-align: center;
                font-weight: 600;
                color: var(--input-focus);
            }
            
            /* Radio & Checkbox */
            .field-radio-group,
            .field-checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .field-radio,
            .field-checkbox {
                display: flex;
                align-items: center;
                cursor: pointer;
            }
            
            .field-radio input,
            .field-checkbox input {
                margin-right: 0.5rem;
                cursor: pointer;
            }
            
            .radio-label,
            .checkbox-label {
                color: var(--text-color);
                user-select: none;
            }
            
            /* Password toggle */
            .field-toggle-password {
                position: absolute;
                right: 0.5rem;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                cursor: pointer;
                padding: 0.25rem;
                font-size: 1.25rem;
                opacity: 0.6;
                transition: opacity 0.2s;
            }
            
            .field-toggle-password:hover {
                opacity: 1;
            }
            
            /* Error messages */
            .field-error {
                margin-top: 0.25rem;
                color: var(--error-color);
                font-size: 0.85rem;
                animation: slideIn 0.2s ease-out;
            }
            
            .field-description {
                margin-top: 0.25rem;
                color: var(--label-color);
                font-size: 0.85rem;
            }
            
            /* Actions */
            .form-actions {
                display: flex;
                gap: 1rem;
                margin-top: var(--form-spacing);
                padding-top: var(--form-spacing);
                border-top: 1px solid #e0e0e0;
            }
            
            .btn {
                padding: 0.625rem 1.5rem;
                border: none;
                border-radius: var(--input-radius);
                font: inherit;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                min-width: 100px;
            }
            
            .btn-primary {
                background: var(--input-focus);
                color: white;
            }
            
            .btn-primary:hover:not(:disabled) {
                background: #1976d2;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
            }
            
            .btn-secondary {
                background: #e0e0e0;
                color: var(--text-color);
            }
            
            .btn-secondary:hover:not(:disabled) {
                background: #d0d0d0;
            }
            
            .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            /* Animations */
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-5px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* Dark mode */
            @media (prefers-color-scheme: dark) {
                :host {
                    --input-border: 1px solid #444;
                    --label-color: #999;
                    --text-color: #e0e0e0;
                }
                
                .field-input {
                    background: #1e1e1e;
                    color: #e0e0e0;
                }
                
                .field-input:disabled {
                    background: #2a2a2a;
                }
                
                .form-actions {
                    border-top-color: #444;
                }
                
                .btn-secondary {
                    background: #333;
                    color: #e0e0e0;
                }
                
                .btn-secondary:hover:not(:disabled) {
                    background: #444;
                }
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .form-fields.grid-layout {
                    grid-template-columns: 1fr;
                }
                
                .form-field {
                    grid-column: span 1 !important;
                }
                
                .form-actions {
                    flex-direction: column;
                }
                
                .btn {
                    width: 100%;
                }
            }
        `;
    }
}

// Register component
customElements.define('brutal-formbuilder', FormBuilder);