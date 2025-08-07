/**
 * TestComponent - Example Custom Element for testing lifecycle callbacks
 * Demonstrates all lifecycle methods with observable behavior
 */

import BaseElement from './base-element.js';

class TestComponent extends BaseElement {
  constructor() {
    super();
    this.clickCount = 0;
    this.lifecycle_events = [];
  }

  static get observedAttributes() {
    return ['label', 'color', 'disabled'];
  }

  render() {
    const label = this.getAttribute('label') || 'Test Component';
    const color = this.getAttribute('color') || '#007bff';
    const disabled = this.hasAttribute('disabled');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-family: system-ui, sans-serif;
        }
        .test-component {
          padding: 12px 24px;
          background: ${color};
          color: white;
          border: none;
          border-radius: 6px;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          opacity: ${disabled ? '0.5' : '1'};
          transition: all 0.2s ease;
          user-select: none;
        }
        .test-component:hover {
          opacity: ${disabled ? '0.5' : '0.8'};
        }
        .test-component:active {
          transform: ${disabled ? 'none' : 'scale(0.98)'};
        }
        .info {
          font-size: 0.8rem;
          margin-top: 8px;
          color: #666;
        }
      </style>
      <div class="test-component" id="button">
        ${label}
        <div class="info">Clicks: ${this.clickCount}</div>
      </div>
    `;
  }

  setupEventListeners() {
    const button = this.shadowRoot.getElementById('button');
    this._clickHandler = this._handleClick.bind(this);
    button.addEventListener('click', this._clickHandler);
  }

  cleanup() {
    const button = this.shadowRoot.getElementById('button');
    if (button && this._clickHandler) {
      button.removeEventListener('click', this._clickHandler);
    }
  }

  onConnect() {
    this.lifecycle_events.push({
      event: 'connected',
      timestamp: Date.now()
    });
    this.dispatchEvent(new CustomEvent('test-connected', {
      detail: { component: this }
    }));
  }

  onDisconnect() {
    this.lifecycle_events.push({
      event: 'disconnected', 
      timestamp: Date.now()
    });
    this.dispatchEvent(new CustomEvent('test-disconnected', {
      detail: { component: this }
    }));
  }

  onAttributeChange(name, newValue, oldValue) {
    this.lifecycle_events.push({
      event: 'attribute-changed',
      timestamp: Date.now(),
      attribute: name,
      oldValue,
      newValue
    });
    
    this.dispatchEvent(new CustomEvent('test-attribute-changed', {
      detail: { attribute: name, oldValue, newValue }
    }));
  }

  onAdopt() {
    this.lifecycle_events.push({
      event: 'adopted',
      timestamp: Date.now()
    });
    this.dispatchEvent(new CustomEvent('test-adopted', {
      detail: { component: this }
    }));
  }

  _handleClick(event) {
    if (this.hasAttribute('disabled')) {
      event.preventDefault();
      return;
    }

    this.clickCount++;
    this.render(); // Re-render to update click count
    
    this.dispatchEvent(new CustomEvent('test-click', {
      detail: { 
        clickCount: this.clickCount,
        timestamp: Date.now()
      }
    }));
  }

  // Public API methods for testing
  getLifecycleEvents() {
    return [...this.lifecycle_events];
  }

  getClickCount() {
    return this.clickCount;
  }

  resetClickCount() {
    this.clickCount = 0;
    this.render();
  }

  // Utility method for testing attribute changes
  setAttributes(attributes) {
    Object.entries(attributes).forEach(([name, value]) => {
      if (value === null || value === undefined) {
        this.removeAttribute(name);
      } else {
        this.setAttribute(name, value);
      }
    });
  }
}

// Register the custom element
customElements.define('test-component', TestComponent);

export default TestComponent;