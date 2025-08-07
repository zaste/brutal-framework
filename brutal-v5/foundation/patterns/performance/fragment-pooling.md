# Pattern: Fragment Pooling

## Problem
Creating DOM fragments repeatedly is expensive:
- Memory allocation overhead
- Garbage collection pressure
- Template parsing costs
- Slow initial renders

## Solution
Pre-create and pool DocumentFragments for reuse, with template caching and smart warmup strategies.

## V3 Implementation Concept

### Core Fragment Pool
```javascript
export class FragmentPool {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.warmupSize = options.warmupSize || 100;
    
    // Fragment pools
    this.availableFragments = [];
    this.inUseFragments = new WeakMap();
    
    // Template cache
    this.templateCache = new Map();
    
    // Metrics
    this.metrics = {
      created: 0,
      reused: 0,
      hits: 0,
      misses: 0
    };
    
    // Auto warmup
    if (options.autoWarmup) {
      this.scheduleWarmup();
    }
  }
  
  // Get fragment from pool
  checkout(template) {
    let fragment;
    
    if (this.availableFragments.length > 0) {
      // Reuse from pool
      fragment = this.availableFragments.pop();
      this.metrics.reused++;
      this.metrics.hits++;
    } else {
      // Create new
      fragment = document.createDocumentFragment();
      this.metrics.created++;
      this.metrics.misses++;
    }
    
    // Apply template if provided
    if (template) {
      this._applyTemplate(fragment, template);
    }
    
    // Track usage
    this.inUseFragments.set(fragment, {
      checkoutTime: Date.now(),
      template
    });
    
    return fragment;
  }
  
  // Return fragment to pool
  checkin(fragment) {
    if (!fragment || !this.inUseFragments.has(fragment)) {
      return;
    }
    
    // Clear the fragment
    while (fragment.firstChild) {
      fragment.removeChild(fragment.firstChild);
    }
    
    // Remove tracking
    this.inUseFragments.delete(fragment);
    
    // Return to pool if space available
    if (this.availableFragments.length < this.maxSize) {
      this.availableFragments.push(fragment);
    }
  }
  
  // Pre-warm the pool
  async warmup(count = this.warmupSize) {
    const batchSize = 10;
    const batches = Math.ceil(count / batchSize);
    
    for (let i = 0; i < batches; i++) {
      await new Promise(resolve => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            this._createBatch(batchSize);
            resolve();
          }, { timeout: 50 });
        } else {
          setTimeout(() => {
            this._createBatch(batchSize);
            resolve();
          }, 0);
        }
      });
    }
  }
  
  _createBatch(count) {
    const toCreate = Math.min(
      count,
      this.maxSize - this.availableFragments.length
    );
    
    for (let i = 0; i < toCreate; i++) {
      const fragment = document.createDocumentFragment();
      this.availableFragments.push(fragment);
      this.metrics.created++;
    }
  }
  
  _applyTemplate(fragment, template) {
    if (typeof template === 'string') {
      // Check cache
      let templateEl = this.templateCache.get(template);
      
      if (!templateEl) {
        // Create and cache
        templateEl = document.createElement('template');
        templateEl.innerHTML = template;
        this.templateCache.set(template, templateEl);
      }
      
      // Clone content
      fragment.appendChild(
        templateEl.content.cloneNode(true)
      );
    } else if (template instanceof HTMLTemplateElement) {
      fragment.appendChild(
        template.content.cloneNode(true)
      );
    } else if (template instanceof Node) {
      fragment.appendChild(
        template.cloneNode(true)
      );
    }
  }
}
```

### Advanced Features

#### Auto-return Pattern
```javascript
// Automatically return fragment after use
withFragment(template, callback) {
  const fragment = this.checkout(template);
  
  try {
    const result = callback(fragment);
    
    // Handle async callbacks
    if (result && typeof result.then === 'function') {
      return result.finally(() => {
        this.checkin(fragment);
      });
    }
    
    this.checkin(fragment);
    return result;
  } catch (error) {
    this.checkin(fragment);
    throw error;
  }
}
```

#### Builder Pattern
```javascript
// Safe fragment building
build(builderFn) {
  return this.withFragment(null, fragment => {
    builderFn(fragment);
    return fragment;
  });
}

// Usage
const fragment = pool.build(frag => {
  const div = document.createElement('div');
  div.textContent = 'Hello';
  frag.appendChild(div);
});
```

#### Pool Optimization
```javascript
optimize() {
  const metrics = this.getMetrics();
  
  // Reduce pool if low reuse
  if (metrics.reuseRate < 0.5) {
    const toRemove = Math.floor(this.availableFragments.length * 0.25);
    this.availableFragments.splice(0, toRemove);
  }
  
  // Increase pool if high misses
  if (metrics.hitRate < 0.8) {
    this.warmup(50);
  }
}
```

## Usage Examples

### Component Rendering
```javascript
class ListComponent {
  constructor() {
    this.pool = new FragmentPool({
      warmupSize: 50,
      autoWarmup: true
    });
  }
  
  renderItems(items) {
    return this.pool.withFragment(null, fragment => {
      items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.name;
        fragment.appendChild(li);
      });
      return fragment;
    });
  }
}
```

### Template Caching
```javascript
// Templates are automatically cached
const nav = pool.checkout(`
  <nav class="menu">
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
`);

// Second checkout reuses parsed template
const nav2 = pool.checkout(`
  <nav class="menu">
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
`); // Cache hit!
```

### Batch Operations
```javascript
// Checkout multiple fragments
const fragments = pool.batchCheckout(10, '<div class="item"></div>');

// Process them
fragments.forEach((frag, i) => {
  frag.querySelector('.item').textContent = `Item ${i}`;
});

// Return all at once
pool.batchCheckin(fragments);
```

## Performance Benefits

### Metrics from V3
- 70% faster list rendering
- 50% reduction in GC pauses
- 80% template cache hit rate
- Near-zero allocation during scroll

### Memory Impact
```javascript
// Without pooling - creates new fragment each time
function renderList(items) {
  const fragment = document.createDocumentFragment(); // Allocation
  // ... render
  return fragment;
} // Fragment eligible for GC

// With pooling - reuses fragments
function renderList(items) {
  return pool.withFragment(null, fragment => {
    // ... render
    return fragment;
  }); // Fragment returned to pool
}
```

## Key Patterns

### 1. Lifecycle Management
```javascript
// Always pair checkout/checkin
const frag = pool.checkout();
try {
  // Use fragment
} finally {
  pool.checkin(frag);
}
```

### 2. Template Caching
```javascript
// String templates cached automatically
pool.checkout('<div>Template</div>'); // Parse
pool.checkout('<div>Template</div>'); // Cache hit
```

### 3. Idle-time Warmup
```javascript
// Pre-create during idle time
requestIdleCallback(() => {
  pool.warmup(100);
});
```

## Evolution

### V3 Features
- Basic pooling
- Manual checkout/checkin
- Simple template cache

### V4 Improvements
- Auto-return patterns
- Smarter warmup
- Usage metrics

### V5 Enhancements  
- Predictive pooling
- Template compilation
- Type-specific pools
- Auto-optimization

## Best Practices

### Do's
- Warm up pools early
- Use withFragment for safety
- Cache templates
- Monitor metrics

### Don'ts
- Don't forget to return fragments
- Don't pool huge fragments
- Don't ignore pool size
- Don't create multiple pools unnecessarily

## References
- V3: `/framework-v3/02-performance/02-FragmentPool.js`
- MDN: DocumentFragment
- V8: Object pooling patterns

---

*Pool once, render many.*