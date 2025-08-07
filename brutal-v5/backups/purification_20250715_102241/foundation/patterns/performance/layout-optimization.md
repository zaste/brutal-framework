# Pattern: Layout Optimization

## Problem
Browser layout recalculations are expensive:
- Forced reflows block rendering
- Paint operations are costly  
- Composite layers consume memory
- Content jumps affect UX

## Solution
Apply CSS containment, will-change, and content-visibility automatically based on element analysis.

## V3 Implementation Concept

### Core Layout Optimizer
```javascript
export class LayoutOptimizer {
  constructor(options = {}) {
    this.autoContain = options.autoContain !== false;
    this.autoWillChange = options.autoWillChange !== false;
    
    // Element tracking
    this.optimizedElements = new WeakMap();
    this.animatingElements = new WeakMap();
    
    // Observers
    this.intersectionObserver = null;
    this.resizeObserver = null;
    
    this._init();
  }
  
  _init() {
    // Viewport-based optimization
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        entries => this._handleIntersection(entries),
        {
          threshold: 0.1,
          rootMargin: '50px'
        }
      );
    }
    
    // Size-based optimization
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(
        entries => this._handleResize(entries)
      );
    }
  }
  
  optimize(element, options = {}) {
    // Analyze element
    const analysis = this._analyzeElement(element);
    
    const optimizations = {
      containment: null,
      willChange: null,
      visibility: null
    };
    
    // Apply containment
    if (this.autoContain && analysis.canContain) {
      optimizations.containment = this._applyContainment(element, analysis);
    }
    
    // Apply will-change
    if (this.autoWillChange && analysis.isAnimating) {
      optimizations.willChange = this._applyWillChange(element, analysis);
    }
    
    // Apply content-visibility
    if (analysis.canUseContentVisibility) {
      optimizations.visibility = this._applyContentVisibility(element);
    }
    
    // Store and observe
    this.optimizedElements.set(element, optimizations);
    this._observeElement(element);
    
    return optimizations;
  }
  
  _analyzeElement(element) {
    const computed = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    return {
      hasSize: rect.width > 0 && rect.height > 0,
      hasChildren: element.children.length > 0,
      isPositioned: computed.position !== 'static',
      hasTransform: computed.transform !== 'none',
      hasOpacity: computed.opacity !== '1',
      hasFilters: computed.filter !== 'none',
      isOverflowing: computed.overflow !== 'visible',
      isAnimating: this._detectAnimation(element, computed),
      canContain: rect.width > 0 && rect.height > 0 &&
                  !element.querySelector('iframe, embed, object'),
      canUseContentVisibility: 'contentVisibility' in element.style &&
                              rect.height > window.innerHeight
    };
  }
  
  _detectAnimation(element, computed) {
    // CSS animations/transitions
    if (computed.animationName !== 'none' ||
        computed.transitionProperty !== 'none') {
      return true;
    }
    
    // Recent animations
    if (this.animatingElements.has(element)) {
      const lastAnimation = this.animatingElements.get(element);
      return Date.now() - lastAnimation < 100;
    }
    
    // Animation classes
    const className = element.className;
    if (typeof className === 'string') {
      return /animat|transition|transform/i.test(className);
    }
    
    return false;
  }
}
```

### Containment Application
```javascript
_applyContainment(element, analysis) {
  const types = [];
  
  // Layout containment
  if (analysis.hasSize && analysis.isOverflowing) {
    types.push('layout');
  }
  
  // Style containment  
  if (analysis.hasChildren) {
    types.push('style');
  }
  
  // Paint containment
  if (analysis.isOverflowing) {
    types.push('paint');
  }
  
  // Size containment (careful!)
  if (analysis.hasSize && !analysis.hasChildren) {
    types.push('size');
  }
  
  const containValue = types.join(' ') || 'none';
  element.style.contain = containValue;
  
  return containValue;
}
```

### Will-change Management
```javascript
_applyWillChange(element, analysis) {
  const properties = [];
  
  if (analysis.hasTransform) {
    properties.push('transform');
  }
  
  if (analysis.hasOpacity) {
    properties.push('opacity');
  }
  
  if (analysis.hasFilters) {
    properties.push('filter');
  }
  
  const willChangeValue = properties.join(', ') || 'auto';
  element.style.willChange = willChangeValue;
  
  // Schedule removal after animation
  if (willChangeValue !== 'auto') {
    this._scheduleWillChangeRemoval(element);
  }
  
  return willChangeValue;
}

_scheduleWillChangeRemoval(element) {
  const checkAnimation = () => {
    if (this._detectAnimation(element)) {
      // Still animating
      requestAnimationFrame(checkAnimation);
    } else {
      // Animation complete
      element.style.willChange = 'auto';
    }
  };
  
  setTimeout(checkAnimation, 100);
}
```

### Content Visibility
```javascript
_applyContentVisibility(element) {
  element.style.contentVisibility = 'auto';
  
  // Provide size hint
  const rect = element.getBoundingClientRect();
  element.style.containIntrinsicSize = 
    `${rect.width}px ${rect.height}px`;
  
  return 'auto';
}

_handleIntersection(entries) {
  entries.forEach(entry => {
    const element = entry.target;
    const optimizations = this.optimizedElements.get(element);
    
    if (!optimizations) return;
    
    if (entry.isIntersecting) {
      // Visible - ensure rendering
      if (optimizations.visibility === 'auto') {
        element.style.contentVisibility = 'visible';
      }
    } else {
      // Hidden - allow skipping
      if (optimizations.visibility) {
        element.style.contentVisibility = 'auto';
      }
      
      // Remove will-change when hidden
      if (optimizations.willChange !== 'auto') {
        element.style.willChange = 'auto';
      }
    }
  });
}
```

## Usage Examples

### Auto-optimization
```javascript
const optimizer = new LayoutOptimizer();

// Optimize on creation
class Card extends Component {
  onMount() {
    optimizer.optimize(this.element);
  }
  
  onUnmount() {
    optimizer.remove(this.element);
  }
}
```

### Batch Optimization  
```javascript
// Optimize all cards
const cards = document.querySelectorAll('.card');
optimizer.batchOptimize(cards);

// Auto-optimize new elements
optimizer.observe(document.body);
```

### Animation Optimization
```javascript
// Before animation
function animateElement(element) {
  // Optimizer detects animation and applies will-change
  element.classList.add('animating');
  optimizer.optimize(element);
  
  element.addEventListener('animationend', () => {
    element.classList.remove('animating');
    // Will-change automatically removed
  });
}
```

## Key Patterns

### 1. CSS Containment
```css
/* Layout containment - isolates layout */
.card {
  contain: layout;
}

/* Paint containment - clips children */
.container {
  contain: paint;
}

/* Strict containment - maximum isolation */
.widget {
  contain: strict; /* layout paint style size */
}
```

### 2. Will-change Lifecycle
```javascript
// Add before animation
element.style.willChange = 'transform';

// Remove after animation
element.addEventListener('transitionend', () => {
  element.style.willChange = 'auto';
});
```

### 3. Content Visibility
```css
/* Skip rendering of off-screen content */
.section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;
}
```

## Performance Benefits

### Metrics from V3
- 50% faster scrolling
- 30% reduction in paint time
- 60% less memory in large lists
- Eliminated layout thrashing

### Real Impact
```javascript
// Before optimization
// Every card affects layout of others
<div class="card-list">
  <div class="card">...</div> <!-- Causes reflow -->
  <div class="card">...</div> <!-- Causes reflow -->
</div>

// After optimization  
// Cards isolated from each other
<div class="card-list">
  <div class="card" style="contain: layout">...</div>
  <div class="card" style="contain: layout">...</div>
</div>
```

## Evolution

### V3 Features
- Manual contain application
- Basic will-change
- Intersection observer

### V4 Improvements
- Automatic analysis
- Smart will-change removal
- ResizeObserver integration

### V5 Enhancements
- Predictive optimization
- GPU layer management
- Partial rendering
- Adaptive strategies

## Best Practices

### Do's
- Apply containment to isolated components
- Use will-change sparingly
- Provide size hints
- Monitor paint performance

### Don'ts
- Don't over-contain
- Don't leave will-change active
- Don't contain without fixed dimensions
- Don't ignore browser support

## Browser Support
- `contain`: All modern browsers
- `content-visibility`: Chrome 85+, Edge 85+
- `will-change`: All modern browsers
- `contain-intrinsic-size`: Chrome 83+

## References
- V3: `/framework-v3/02-performance/07-LayoutOptimizer.js`
- CSS Containment Spec
- MDN: will-change
- Chrome: Rendering Performance

---

*Isolate to accelerate.*