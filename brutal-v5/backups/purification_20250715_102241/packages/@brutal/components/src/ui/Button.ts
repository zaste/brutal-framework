/**
 * Button component
 */

import { Component, component } from '../base/Component.js';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@component('brutal-button', {
  props: {
    variant: { type: 'string', default: 'primary' },
    size: { type: 'string', default: 'md' },
    disabled: { type: 'boolean', default: false },
    loading: { type: 'boolean', default: false },
    type: { type: 'string', default: 'button' }
  },
  template: `
    <button 
      type="{{type}}"
      class="btn btn-{{variant}} btn-{{size}} {{#if loading}}loading{{/if}} {{#if disabled}}disabled{{/if}}"
      {{#if disabled}}disabled{{/if}}
    >
      {{#if loading}}
        <span class="spinner"></span>
      {{/if}}
      <slot></slot>
    </button>
  `,
  styles: `
    :host {
      display: inline-block;
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      overflow: hidden;
    }
    
    /* Sizes */
    .btn-sm {
      padding: 0.25rem 0.75rem;
      font-size: 0.875rem;
    }
    
    .btn-md {
      padding: 0.5rem 1rem;
      font-size: 1rem;
    }
    
    .btn-lg {
      padding: 0.75rem 1.5rem;
      font-size: 1.125rem;
    }
    
    /* Variants */
    .btn-primary {
      background: #007bff;
      color: white;
    }
    
    .btn-primary:hover:not(.disabled) {
      background: #0056b3;
    }
    
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
    
    .btn-secondary:hover:not(.disabled) {
      background: #545b62;
    }
    
    .btn-danger {
      background: #dc3545;
      color: white;
    }
    
    .btn-danger:hover:not(.disabled) {
      background: #c82333;
    }
    
    .btn-ghost {
      background: transparent;
      color: #007bff;
      border: 1px solid #007bff;
    }
    
    .btn-ghost:hover:not(.disabled) {
      background: #007bff;
      color: white;
    }
    
    /* States */
    .disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .loading {
      color: transparent;
    }
    
    /* Spinner */
    .spinner {
      position: absolute;
      width: 1em;
      height: 1em;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `
})
export class Button extends Component {
  constructor() {
    super();
    this.attachShadow();
  }
  
  mounted() {
    // Add click handler
    this.$('button')?.addEventListener('click', (e) => {
      if (this.disabled || this.loading) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this.emit('click', e);
    });
  }
}