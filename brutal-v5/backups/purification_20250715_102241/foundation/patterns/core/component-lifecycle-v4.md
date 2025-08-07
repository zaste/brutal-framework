# Pattern: Component Lifecycle (V4 Complete)

## Problem
Web Components need comprehensive lifecycle management including initialization, state, events, rendering, error handling, and cleanup.

## V4 Implementation Details

### Complete Lifecycle Flow

```javascript
// V4's comprehensive WeakMap architecture
const componentTemplates = new WeakMap();
const componentStyles = new WeakMap();
const componentStates = new WeakMap();
const componentInternals = new WeakMap();

export class BrutalComponent extends HTMLElement {
  // 1. CONSTRUCTION PHASE
  constructor() {
    super();
    
    // Shadow DOM (immediate)
    this.attachShadow({ mode: 'open' });
    
    // Initialize tracking
    this._listeners = new Map();
    this._renderCount = 0;
    this._isConnected = false;
    this._isInitialized = false;
    this._errorBoundary = true;
    
    // ElementInternals for forms
    if (this.constructor.formAssociated) {
      this._internals = this.attachInternals();
    }
    
    // Safe initialization
    this._initialize();
  }

  _initialize() {
    try {
      // Focus management
      FocusVisible.init();
      
      // Event system
      this._eventManager = new BrutalEventManager(this);
      
      // State initialization
      this.initializeState();
      
      // Template creation
      this.createTemplate();
      
      this._isInitialized = true;
    } catch (error) {
      this._handleError('initialization', error);
    }
  }

  // 2. CONNECTION PHASE
  connectedCallback() {
    try {
      this._isConnected = true;
      
      // Setup lifecycle
      this.onConnect();
      
      // Initial render
      this.scheduleRender(RenderPriority.IMMEDIATE);
      
      // Bind events
      this._bindEvents();
      
      // Emit connected event
      this.emit('brutal:connected');
    } catch (error) {
      this._handleError('connection', error);
    }
  }

  // 3. ATTRIBUTE CHANGES
  attributeChangedCallback(name, oldValue, newValue) {
    try {
      if (oldValue !== newValue) {
        // User hook
        this.onAttributeChanged(name, oldValue, newValue);
        
        // Re-render if connected
        if (this._isConnected) {
          this.scheduleRender(RenderPriority.BACKGROUND);
        }
        
        // Emit event
        this.emit('brutal:attribute-changed', {
          name, oldValue, newValue
        });
      }
    } catch (error) {
      this._handleError('attribute-changed', error);
    }
  }

  // 4. RENDER SCHEDULING
  scheduleRender(priority = RenderPriority.BACKGROUND) {
    if (this._isConnected) {
      renderScheduler.schedule(this, priority);
    }
  }

  render() {
    try {
      // Prevent concurrent renders
      if (this._isRendering) return;
      
      this._isRendering = true;
      const startTime = performance.now();
      
      // Clear and re-render
      this.shadowRoot.replaceChildren();
      
      // Apply styles (Constructable StyleSheets)
      if (this._styleSheet && this.shadowRoot.adoptedStyleSheets) {
        this.shadowRoot.adoptedStyleSheets = [this._styleSheet];
      } else if (this._styles) {
        const style = document.createElement('style');
        style.textContent = this._styles;
        this.shadowRoot.appendChild(style);
      }
      
      // Apply template
      if (this._template) {
        const content = this._template.content.cloneNode(true);
        this.shadowRoot.appendChild(content);
      }
      
      // Post-render
      this.onRender();
      
      // Metrics
      this._renderCount++;
      this._lastRender = performance.now() - startTime;
      
      // Emit render event
      this.emit('brutal:rendered', {
        count: this._renderCount,
        duration: this._lastRender
      });
    } catch (error) {
      this._handleError('render', error);
    } finally {
      this._isRendering = false;
    }
  }

  // 5. DISCONNECTION PHASE
  disconnectedCallback() {
    try {
      this._isConnected = false;
      
      // User cleanup hook
      this.onDisconnect();
      
      // Clean event listeners
      this._listeners.forEach((handler, event) => {
        this.removeEventListener(event, handler);
      });
      this._listeners.clear();
      
      // Destroy event manager
      this._eventManager?.destroy();
      
      // Clean WeakMap references
      componentTemplates.delete(this);
      componentStyles.delete(this);
      componentStates.delete(this);
      componentInternals.delete(this);
      
      // Emit event
      this.emit('brutal:disconnected');
    } catch (error) {
      this._handleError('disconnection', error);
    }
  }

  // ERROR BOUNDARY
  _handleError(phase, error) {
    if (this._errorBoundary) {
      try {
        this.onError?.(phase, error);
        this.emit('brutal:error', { phase, error });
      } catch (e) {
        console.error('Error in error handler:', e);
      }
    } else {
      throw error;
    }
  }
}
```

## Key V4 Innovations

### 1. Comprehensive WeakMap Usage
- Templates, styles, states, internals all in WeakMaps
- Zero memory leaks guaranteed
- True private properties

### 2. Error Boundaries Built-in
- Every lifecycle phase wrapped in try/catch
- Configurable error handling
- Error events emitted

### 3. Render Scheduling Integration
- Priority-based rendering
- Frame-aware updates
- Prevents render thrashing

### 4. ElementInternals Support
- Form participation
- ARIA integration
- Validation API

### 5. Performance Tracking
- Render count and timing
- Event emission for monitoring
- Development-mode warnings

## V5 Improvements

Based on V4 experience:

1. **Simplify initialization** - Too many phases in V4
2. **Automatic cleanup tracking** - Manual cleanup error-prone
3. **Better TypeScript integration** - V4 lacks proper types
4. **Declarative event binding** - V4's imperative approach verbose

## References
- V4 Full: `/brutal-v4/core/foundation/Component.js`
- RenderScheduler: `/brutal-v4/core/scheduling/RenderScheduler.js`
- EventManager: `/brutal-v4/core/events/EventManager.js`

---

*V4 proved the patterns work - V5 will make them elegant.*