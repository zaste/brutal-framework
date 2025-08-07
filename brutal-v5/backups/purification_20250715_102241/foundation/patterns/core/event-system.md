# Pattern: Event System with Delegation

## Problem
Traditional event handling creates problems:
- Memory leaks from unremoved listeners
- Performance issues with many elements
- Complex cleanup requirements
- No central event management

## Solution
Implement event delegation with WeakMap storage and automatic cleanup, providing centralized event management with performance tracking.

## V4 Implementation

```javascript
// WeakMaps for memory-safe storage
const eventSystemData = new WeakMap();
const handlerReferences = new WeakMap();

export class BrutalEvents {
  constructor(component) {
    // All data in WeakMap - auto cleanup
    eventSystemData.set(this, {
      component: component,
      listeners: new Map(),
      delegatedEvents: new Map(),
      eventCount: 0,
      handlerExecutions: 0,
      averageHandlerTime: 0
    });
    
    this.setupEventDelegation();
  }

  // Setup delegation for common events
  setupEventDelegation() {
    const data = eventSystemData.get(this);
    const commonEvents = [
      'click', 'input', 'change', 'submit', 
      'focus', 'blur', 'mouseenter', 'mouseleave', 
      'keydown', 'keyup'
    ];
    
    for (const eventType of commonEvents) {
      const handler = (event) => this.handleDelegatedEvent(event);
      
      // Store for cleanup
      if (!handlerReferences.has(this)) {
        handlerReferences.set(this, new Map());
      }
      handlerReferences.get(this).set(eventType, handler);
      
      // Single listener per event type
      data.component.addEventListener(eventType, handler);
    }
  }

  // Handle all delegated events
  handleDelegatedEvent(event) {
    const data = eventSystemData.get(this);
    const startTime = performance.now();
    
    // Walk up from target to component
    let current = event.target;
    
    while (current && current !== data.component) {
      const handlers = data.delegatedEvents.get(current);
      
      if (handlers && handlers.has(event.type)) {
        const handlerList = handlers.get(event.type);
        
        for (const handler of handlerList) {
          try {
            handler.call(current, event);
            data.handlerExecutions++;
          } catch (error) {
            this.handleError(event, error, current);
          }
        }
        
        if (event.cancelBubble) break;
      }
      
      current = current.parentElement;
    }
    
    // Track performance
    const handlerTime = performance.now() - startTime;
    data.averageHandlerTime = 
      (data.averageHandlerTime + handlerTime) / 2;
  }

  // Add delegated event listener
  on(element, eventType, handler, options = {}) {
    const data = eventSystemData.get(this);
    
    if (!data.delegatedEvents.has(element)) {
      data.delegatedEvents.set(element, new Map());
    }
    
    const elementHandlers = data.delegatedEvents.get(element);
    
    if (!elementHandlers.has(eventType)) {
      elementHandlers.set(eventType, new Set());
    }
    
    elementHandlers.get(eventType).add(handler);
    data.eventCount++;
    
    // Return cleanup function
    return () => this.off(element, eventType, handler);
  }

  // Remove event listener
  off(element, eventType, handler) {
    const data = eventSystemData.get(this);
    const elementHandlers = data.delegatedEvents.get(element);
    
    if (elementHandlers && elementHandlers.has(eventType)) {
      elementHandlers.get(eventType).delete(handler);
      
      // Cleanup empty structures
      if (elementHandlers.get(eventType).size === 0) {
        elementHandlers.delete(eventType);
      }
      if (elementHandlers.size === 0) {
        data.delegatedEvents.delete(element);
      }
    }
  }

  // Cleanup all events
  destroy() {
    const data = eventSystemData.get(this);
    const handlers = handlerReferences.get(this);
    
    // Remove all delegated listeners
    if (handlers) {
      handlers.forEach((handler, eventType) => {
        data.component.removeEventListener(eventType, handler);
      });
    }
    
    // Clear all maps
    data.delegatedEvents.clear();
    data.listeners.clear();
    
    // Remove from WeakMaps
    eventSystemData.delete(this);
    handlerReferences.delete(this);
  }
}
```

## Key Patterns

### 1. Event Delegation
```javascript
// Instead of:
button1.addEventListener('click', handler);
button2.addEventListener('click', handler);
button3.addEventListener('click', handler);

// Use delegation:
events.on(button1, 'click', handler);
events.on(button2, 'click', handler);
events.on(button3, 'click', handler);
// Only ONE listener on parent!
```

### 2. Automatic Cleanup
```javascript
// Return cleanup function
const cleanup = events.on(element, 'click', handler);

// Later...
cleanup(); // Removes handler
```

### 3. Performance Tracking
```javascript
// Built-in metrics
getEventMetrics() {
  const data = eventSystemData.get(this);
  return {
    totalEvents: data.eventCount,
    executions: data.handlerExecutions,
    avgTime: data.averageHandlerTime
  };
}
```

### 4. Error Boundaries
```javascript
// Errors don't break event system
handleError(event, error, target) {
  console.error('[BrutalEvents] Handler error:', error);
  
  // Emit error event for monitoring
  this.component.emit('brutal:event-error', {
    event: event.type,
    error: error.message,
    target
  });
}
```

## Usage in Components

```javascript
class MyComponent extends BrutalComponent {
  connectedCallback() {
    super.connectedCallback();
    
    // Setup events
    this.events = new BrutalEvents(this);
    
    // Add listeners with automatic delegation
    const button = this.shadowRoot.querySelector('button');
    this.events.on(button, 'click', this.handleClick);
    
    // Dynamic elements work automatically!
    this.shadowRoot.innerHTML += '<button>New Button</button>';
    const newButton = this.shadowRoot.lastElementChild;
    this.events.on(newButton, 'click', this.handleClick);
  }
  
  disconnectedCallback() {
    // One line cleanup!
    this.events.destroy();
    super.disconnectedCallback();
  }
}
```

## Performance Benefits

### Memory Usage
- Single listener per event type (not per element)
- WeakMap storage (automatic GC)
- No reference leaks

### CPU Usage
- O(depth) instead of O(elements)
- Batched event handling
- Performance tracking built-in

## Evolution

### V3 Issues
- Manual addEventListener/removeEventListener
- Memory leaks common
- No performance tracking

### V4 Improvements
- Centralized event management
- Automatic delegation
- Built-in cleanup
- Performance metrics

### V5 Enhancements
- TypeScript event types
- Custom event namespacing
- Event middleware
- Better error handling

## References
- V4: `/brutal-v4/core/events/Events.js`
- V4: `/brutal-v4/core/events/EventManager.js`
- Event Delegation: https://javascript.info/event-delegation

---

*Delegate once, handle everywhere.*