/**
 * Modal component with portal rendering
 */

import { Component, component } from '../base/Component.js';

@component('brutal-modal', {
  props: {
    open: { type: 'boolean', default: false },
    title: { type: 'string', default: '' },
    size: { type: 'string', default: 'md' },
    closable: { type: 'boolean', default: true },
    closeOnOverlay: { type: 'boolean', default: true }
  },
  template: `
    {{#if open}}
      <div class="modal-overlay" {{#if closeOnOverlay}}data-close{{/if}}>
        <div class="modal modal-{{size}}" role="dialog">
          {{#if title}}
            <div class="modal-header">
              <h3 class="modal-title">{{title}}</h3>
              {{#if closable}}
                <button class="modal-close" data-close aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              {{/if}}
            </div>
          {{/if}}
          <div class="modal-body">
            <slot></slot>
          </div>
          <div class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    {{/if}}
  `,
  styles: `
    :host {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      pointer-events: none;
    }
    
    .modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      animation: fadeIn 0.2s;
    }
    
    .modal {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.2s;
    }
    
    /* Sizes */
    .modal-sm {
      width: 300px;
    }
    
    .modal-md {
      width: 500px;
    }
    
    .modal-lg {
      width: 800px;
    }
    
    .modal-header {
      padding: 1rem;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .modal-title {
      margin: 0;
      font-size: 1.25rem;
    }
    
    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      line-height: 1;
      color: #adb5bd;
      cursor: pointer;
      padding: 0;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .modal-close:hover {
      color: #495057;
    }
    
    .modal-body {
      padding: 1rem;
      overflow-y: auto;
      flex: 1;
    }
    
    .modal-footer {
      padding: 1rem;
      border-top: 1px solid #e9ecef;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    
    .modal-footer:empty {
      display: none;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `
})
export class Modal extends Component {
  private _portal?: HTMLElement;
  
  constructor() {
    super();
    this.attachShadow();
  }
  
  mounted() {
    // Create portal container if not exists
    if (!document.getElementById('brutal-modal-portal')) {
      this._portal = document.createElement('div');
      this._portal.id = 'brutal-modal-portal';
      document.body.appendChild(this._portal);
    } else {
      this._portal = document.getElementById('brutal-modal-portal')!;
    }
    
    // Move to portal
    this._portal.appendChild(this);
    
    // Handle close events
    this.shadowRoot?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.hasAttribute('data-close')) {
        this.close();
      }
    });
    
    // Handle escape key
    this._handleEscape = this._handleEscape.bind(this);
    document.addEventListener('keydown', this._handleEscape);
  }
  
  unmounted() {
    document.removeEventListener('keydown', this._handleEscape);
    this.remove();
  }
  
  updated() {
    // Update body scroll
    if (this.open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
  
  private _handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.open && this.closable) {
      this.close();
    }
  }
  
  // Public methods
  close() {
    this.open = false;
    this.emit('close');
  }
  
  open() {
    this.open = true;
    this.emit('open');
  }
}