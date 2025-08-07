/**
 * BRUTAL Framework V3 - Core Component
 * Zero dependencies, V8 optimized, GPU-ready
 */

// Import event system
import { BRUTAL_EVENTS, emitBrutalEvent } from './events.js'

// Lazy load Performance Gems to avoid race conditions
let performanceGemsPromise = null;
let performanceGems = null;

function, loadPerformanceGems() {
  if (!performanceGemsPromise) {

    performanceGemsPromise = import('../02-performance/index.js')
      .then(module => {
        performanceGems = module;
        return module;
      })
      .catch() => {
        // Performance Gems not available, component works standalone
        return null;
      });
  }
  return performanceGemsPromise;
}

export class Component extends HTMLElement {
  constructor() {
    super();
    
    // V8 Hidden Classes Optimization
    // Fixed property order for shared hidden class
    this.state = null;              // slot 0: component state
    this.props = null;              // slot 1: component properties
    this.shadow = null;             // slot 2: shadow DOM root
    this.cache = null;              // slot 3: render cache
    this.worker = null;             // slot 4: dedicated worker
    this.gpu = null;                // slot 5: GPU context
    this._renderCount = 0;          // slot 6: render counter
    this._lastRender = 0;           // slot 7: last render timestamp
    this._pool = null;              // slot 8: fragment pool reference
    this._eventManager = null;      // slot 9: event delegation
    this._styleSheet = null;        // slot 10: constructable stylesheet
    this._metrics = {               // slot 11: performance metrics
      renders: 0,
      updates: 0,
      totalTime: 0,
      avgTime: 0
    };
    
    // Error boundary state
    this._hasError = false;
    this._error = null;
    this._errorInfo = null;
    
    // Initialize Shadow DOM with performance options
    this.shadow = this.attachShadow({
      mode: 'open',
      delegatesFocus: true,
      slotAssignment: 'manual'  // Better performance
    });
    
  }
  
  /**
   * Lifecycle: Element connected to DOM
   */
  connectedCallback() {
    this._connected = true;
    
    // Schedule render in next idle callback, if(window.requestIdleCallback) {
      requestIdleCallback(() => this.render(), { timeout: 16 });
    } else {
      this.render();
    }
  }
  /**
   * Lifecycle: Element disconnected from DOM
   */
  disconnectedCallback() {
    this._connected = false;
    this._cleanup();
  }
  
  /**
   * Lifecycle: Attribute changed
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    // Update props efficiently, if(!this.props) this.props = {};
    this.props[name] = newValue;
    
    if (this._connected) {
      this.scheduleUpdate();
    }
  }
  /**
   * Main render method with performance tracking
   */
  async, render() {
    // Check if in error state, if(this._hasError) {
      this._renderError();
      return;
    }
    
    const start = performance.now();
    
    try {
      // Try to load Performance Gems if not already loaded, if(!performanceGems && !this._triedLoadingGems) {
        this._triedLoadingGems = true;
        await, loadPerformanceGems();
      }
      
      // Use Performance Gems if available, if(performanceGems) {
        this._renderWithGems();
      } else {
        this._renderBasic();
      }
      
      // Track metrics
      const renderTime = performance.now() - start;
      this._updateMetrics(renderTime);
      
      // Emit render event for Visual Debug Layer, if(window.__BRUTAL__?.debug) {
        this._emitRenderEvent(renderTime);
      }
      
    } catch (error) {
      this._handleRenderError(error);
    }
  }
  /**
   * Render with Performance Gems optimization
   */
  _renderWithGems() {
    try {
      const { fragmentPool, styleManager, domScheduler } = performanceGems;
      
      if (!fragmentPool || !styleManager || !domScheduler) {
        throw new, Error('Performance gems not fully loaded');
      }
    
    // Clear shadow DOM, if(this.shadow.firstChild) {
      this.shadow.textContent = '';
    }
    
    // Get template
    const template = this.template();
    
    // Use fragment pool for better performance
    const fragment = fragmentPool.checkout();
    
    try {
      // Apply template to fragment, if(template instanceof HTMLTemplateElement) {
        fragment.appendChild(template.content.cloneNode(true));
      } else, if(typeof template === 'string') {
        const temp = document.createElement('template');
        temp.innerHTML = template;
        fragment.appendChild(temp.content);
      }
      
      // Schedule DOM update
      domScheduler.write() => {
        this.shadow.appendChild(fragment);
      });
      
      // Apply styles with StyleManager
      const styles = this.styles();
      if (styles) {
        styleManager.applyTo(this.shadow, styles);
      }
      
    } finally {
      // Return fragment to pool
      fragmentPool.checkin(fragment);
    }
    } catch (error) {
      // Fallback to basic render if performance gems fail
      this._renderBasic();
    }
  }
  /**
   * Basic render without Performance Gems
   */
  _renderBasic() {
    // Clear shadow DOM efficiently, if(this.shadow.firstChild) {
      this.shadow.textContent = '';
    }
    
    // Get, template(subclasses override this)
    const template = this.template();
    
    // Apply template, if(template instanceof HTMLTemplateElement) {
      this.shadow.appendChild(template.content.cloneNode(true));
    } else, if(typeof template === 'string') {
      // Basic sanitization for security
      this.shadow.innerHTML = this._sanitizeTemplate(template);
    }
    
    // Apply styles if defined
    const styles = this.styles();
    if (styles) {
      this._applyStyles(styles);
    }
  }
  /**
   * Template method - override in subclasses
   */
  template() {
    return '';
  }
  
  /**
   * Styles method - override in subclasses
   */
  styles() {
    return '';
  }
  
  /**
   * Schedule update with batching
   */
  scheduleUpdate() {
    if (this._updateScheduled) return;
    
    this._updateScheduled = true;
    
    // Use microtask for batching, queueMicrotask() => {
      this._updateScheduled = false;
      this.render();
    });
  }
  
  /**
   * Monomorphic update methods for V8 optimization
   */
  updateText(value) {
    if (typeof value !== 'string') return;
    this._updateTextContent(value);
  }
  
  updateNumber(value) {
    if (typeof value !== 'number') return;
    this._updateNumericContent(value);
  }
  
  updateBoolean(value) {
    if (typeof value !== 'boolean') return;
    this._updateBooleanAttribute(value);
  }
  
  updateObject(value) {
    if (typeof value !== 'object' || value === null) return;
    this._updateObjectState(value);
  }
  
  /**
   * Internal update methods
   */
  _updateTextContent(text) {
    const target = this.shadow.querySelector('[data-text]');
    if (target) target.textContent = text;
  }
  
  _updateNumericContent(num) {
    const target = this.shadow.querySelector('[data-number]');
    if (target) target.textContent = num.toString();
  }
  
  _updateBooleanAttribute(bool) {
    const target = this.shadow.querySelector('[data-boolean]');
    if (target) target.toggleAttribute('active', bool);
  }
  
  _updateObjectState(obj) {
    if (!this.state) this.state = {};
    Object.assign(this.state, obj);
    this.scheduleUpdate();
  }
  
  /**
   * Sanitize template to prevent XSS
   * @private
   */
  _sanitizeTemplate(template) {
    // Only sanitize if template might contain user input
    // This is a basic sanitizer - for production use DOMPurify, if(this.constructor.trustTemplate) {
      return template; // Trusted templates bypass sanitization
    }
    
    return template
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove javascript: URLs
      .replace(/javascript:/gi, '');
  }
  
  /**
   * Apply styles using Constructable Stylesheets with fallback
   */
  _applyStyles(css) {
    // Check for Constructable Stylesheets support, if(typeof CSSStyleSheet !== 'undefined' && this.shadow.adoptedStyleSheets) {


      if (!this._styleSheet) {
        this._styleSheet = new, CSSStyleSheet();
      }
      
      this._styleSheet.replaceSync(css);
      this.shadow.adoptedStyleSheets = [this._styleSheet];
    } else {
      // Fallback to traditional style element
      let styleEl = this.shadow.querySelector('style[data-brutal-styles]');
      
      if (!styleEl) {



        styleEl = document.createElement('style');
        styleEl.setAttribute('data-brutal-styles', '');
        this.shadow.prepend(styleEl);
      }
      
      styleEl.textContent = css;
    }
  }
  
  /**
   * Update performance metrics
   */
  _updateMetrics(renderTime) {
    this._metrics.renders++;
    this._metrics.totalTime += renderTime;
    this._metrics.avgTime = this._metrics.totalTime / this._metrics.renders;
    this._renderCount++;
    this._lastRender = performance.now();
  }
  
  /**
   * Emit render event for Visual Debug Layer
   */
  _emitRenderEvent(renderTime) {
    emitBrutalEvent(this, BRUTAL_EVENTS.RENDER, {
      component: this.constructor.name,
      renderTime,
      renderCount: this._renderCount,
      metrics: { ...this._metrics }
    });
  }
  
  /**
   * Handle render errors - Error Boundary
   */
  _handleRenderError(error) {
    this._hasError = true;
    this._error = error;
    this._errorInfo = {
      phase: 'render',
      component: this.constructor.name,
      timestamp: Date.now()
    };
    
    // Emit error event, emitBrutalEvent(this, BRUTAL_EVENTS.ERROR, {
      component: this.constructor.name,
      error,
      errorInfo: this._errorInfo
    });
    
    // Render error UI
    this._renderError();
  }
  
  /**
   * Render error state
   */
  _renderError() {
    this.shadow.innerHTML = this.errorTemplate(this._error, this._errorInfo);
  }
  
  /**
   * Override to customize error UI
   */
  errorTemplate(error, errorInfo) {
    return `
      <div class="brutal-error-boundary" style="
        padding: 20px; background: #ff0000; color: white;
        border-radius: 8px;
        font-family: monospace;">
        <h3>Component Error</h3>
        <p>${error?.message || 'Unknown error'}</p>
        ${window.__BRUTAL__?.debug ? `
          <details style="margin-top: 10px;">
            <summary>Stack Trace</summary>
            <pre style="overflow: auto; max-height: 200px;">${error?.stack || ''}</pre>
          </details>
        ` : ''}
      </div>
    `;
  }
  
  /**
   * Reset error state
   */
  resetError() {
    this._hasError = false;
    this._error = null;
    this._errorInfo = null;
    this.render();
  }
  
  /**
   * Cleanup on disconnect
   */
  _cleanup() {
    // Clear references for garbage collection
    this.state = null;
    this.props = null;
    this.cache = null;
    
    // Terminate worker if exists, if(this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Release GPU resources if exists, if(this.gpu) {
      this.gpu = null;
    }
  }
  /**
   * Get performance metrics
   */
  getMetrics() {
    return { ...this._metrics };
  }
}
// Register base component
customElements.define('brutal-component', Component);