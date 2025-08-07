# Pattern: Component Lifecycle

## Problem
Web Components need consistent initialization, rendering, and cleanup patterns that work with reactive state and avoid memory leaks.

## Context
Use this pattern when creating any BRUTAL component that:
- Needs reactive state
- Manages DOM updates
- Integrates with the event system
- Requires cleanup on disconnect

## Solution
Components follow a strict lifecycle with clear phases:

1. **Construction** - Basic setup, no DOM access
2. **Connection** - DOM available, initialize
3. **State Changes** - Reactive updates
4. **Disconnection** - Cleanup resources

## Implementation

```javascript
// WeakMaps for private storage (prevents memory leaks)
const componentStates = new WeakMap();
const componentCleanups = new WeakMap();

export class BrutalComponent extends HTMLElement {
  constructor() {
    super();
    // Only basic setup - no DOM access yet
    this.attachShadow({ mode: 'open' });
    componentCleanups.set(this, new Set());
  }

  connectedCallback() {
    // DOM is available
    this._setup();
    this._render();
    this._bindEvents();
  }

  disconnectedCallback() {
    // Clean up everything
    const cleanups = componentCleanups.get(this);
    cleanups?.forEach(cleanup => cleanup());
    cleanups?.clear();
    componentStates.delete(this);
  }

  _setup() {
    // Initialize state with auto-cleanup
    const state = createState(this.initialState || {});
    componentStates.set(this, state);
    
    // Auto-render on state changes
    const unsubscribe = state.$subscribe(() => {
      this._scheduleRender();
    });
    
    this._addCleanup(unsubscribe);
  }

  _addCleanup(cleanup) {
    componentCleanups.get(this).add(cleanup);
  }

  _scheduleRender() {
    // Batch renders for performance
    renderScheduler.schedule(() => {
      this._render();
    }, RenderPriority.NORMAL);
  }
}
```

## Key Insights

### 1. WeakMap Storage
- Prevents memory leaks
- Private to component
- Auto-cleaned by GC

### 2. Cleanup Registry
- Track all subscriptions
- Single cleanup point
- No forgotten listeners

### 3. Render Scheduling
- Batch DOM updates
- Respect browser frames
- Priority-based rendering

## Trade-offs

✅ **Benefits**:
- Predictable lifecycle
- Automatic cleanup
- Memory efficient
- Performance optimized

⚠️ **Considerations**:
- Slightly more setup code
- Must track cleanups
- Render scheduling complexity

## Evolution from V3/V4

### V3 Issues:
- Manual cleanup often forgotten
- Direct DOM manipulation
- No render batching

### V4 Improvements:
- WeakMap storage
- Cleanup registry
- Render scheduler

### V5 Enhancements:
- Simplified API
- Better TypeScript types
- Built-in error boundaries

## References
- V4: `/brutal-v4/core/foundation/Component.js`
- V3: `/framework-v3/01-core/Component.js`
- Web Components Spec: https://html.spec.whatwg.org/multipage/custom-elements.html

---

*A predictable lifecycle prevents unpredictable bugs.*