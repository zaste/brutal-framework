/**
 * Input component with validation and masking
 */

import { Component, component } from '../base/Component.js';

@component('brutal-input', {
  props: {
    type: { type: 'string', default: 'text' },
    value: { type: 'string', default: '' },
    placeholder: { type: 'string', default: '' },
    disabled: { type: 'boolean', default: false },
    readonly: { type: 'boolean', default: false },
    required: { type: 'boolean', default: false },
    pattern: { type: 'string', default: '' },
    mask: { type: 'string', default: '' },
    error: { type: 'string', default: '' }
  },
  template: `
    <div class="input-wrapper {{#if error}}has-error{{/if}}">
      <input
        type="{{type}}"
        value="{{value}}"
        placeholder="{{placeholder}}"
        {{#if disabled}}disabled{{/if}}
        {{#if readonly}}readonly{{/if}}
        {{#if required}}required{{/if}}
        {{#if pattern}}pattern="{{pattern}}"{{/if}}
        class="input"
      />
      {{#if error}}
        <span class="error-message">{{error}}</span>
      {{/if}}
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    
    .input-wrapper {
      position: relative;
    }
    
    .input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.15s;
    }
    
    .input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
    }
    
    .input:disabled {
      background: #e9ecef;
      cursor: not-allowed;
    }
    
    .has-error .input {
      border-color: #dc3545;
    }
    
    .has-error .input:focus {
      box-shadow: 0 0 0 0.2rem rgba(220,53,69,.25);
    }
    
    .error-message {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.875rem;
      color: #dc3545;
    }
  `
})
export class Input extends Component {
  private _input?: HTMLInputElement;
  
  constructor() {
    super();
    this.attachShadow();
  }
  
  mounted() {
    this._input = this.$('input') as HTMLInputElement;
    
    // Handle input events
    this._input?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      let value = target.value;
      
      // Apply mask if provided
      if (this.mask) {
        value = this._applyMask(value);
        target.value = value;
      }
      
      this.value = value;
      this.emit('input', value);
      this._validate();
    });
    
    // Handle change events
    this._input?.addEventListener('change', (e) => {
      this.emit('change', (e.target as HTMLInputElement).value);
    });
    
    // Handle blur events
    this._input?.addEventListener('blur', () => {
      this.emit('blur');
      this._validate();
    });
    
    // Handle focus events
    this._input?.addEventListener('focus', () => {
      this.emit('focus');
    });
  }
  
  updated() {
    // Sync input value with prop
    if (this._input && this._input.value !== this.value) {
      this._input.value = this.value;
    }
  }
  
  private _applyMask(value: string): string {
    if (!this.mask) return value;
    
    // Simple mask implementation
    let masked = '';
    let valueIndex = 0;
    
    for (let i = 0; i < this.mask.length && valueIndex < value.length; i++) {
      const maskChar = this.mask[i];
      
      if (maskChar === '#') {
        // Number placeholder
        if (/\d/.test(value[valueIndex])) {
          masked += value[valueIndex];
          valueIndex++;
        }
      } else if (maskChar === 'A') {
        // Letter placeholder
        if (/[a-zA-Z]/.test(value[valueIndex])) {
          masked += value[valueIndex];
          valueIndex++;
        }
      } else if (maskChar === '*') {
        // Any character
        masked += value[valueIndex];
        valueIndex++;
      } else {
        // Literal character
        masked += maskChar;
        if (value[valueIndex] === maskChar) {
          valueIndex++;
        }
      }
    }
    
    return masked;
  }
  
  private _validate() {
    let error = '';
    
    if (this.required && !this.value) {
      error = 'This field is required';
    } else if (this.pattern && this.value) {
      const regex = new RegExp(this.pattern);
      if (!regex.test(this.value)) {
        error = 'Invalid format';
      }
    }
    
    if (error !== this.error) {
      this.error = error;
      this.emit('validation', { valid: !error, error });
    }
  }
  
  // Public methods
  focus() {
    this._input?.focus();
  }
  
  blur() {
    this._input?.blur();
  }
  
  select() {
    this._input?.select();
  }
  
  setSelectionRange(start: number, end: number) {
    this._input?.setSelectionRange(start, end);
  }
}