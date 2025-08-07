# 🎯 Composition Pattern Guide

## Overview

The enhanced-components package now uses a **composition pattern** instead of deep inheritance. This makes components more flexible, reusable, and maintainable.

## Basic Usage

### Creating Enhanced Components

```typescript
import { createEnhancedComponent, withLazyLoading, withPortal } from '@brutal/enhanced-components';

// Single enhancer
const LazyComponent = createEnhancedComponent(
  'LazyComponent',
  withLazyLoading(() => loadContent())
);

// Multiple enhancers
const LazyPortalComponent = createEnhancedComponent(
  'LazyPortalComponent',
  withLazyLoading(() => loadContent()),
  withPortal('#modal-root')
);
```

### Using the compose() function

```typescript
import { compose, withLazyLoading, withVisibilityTracking } from '@brutal/enhanced-components';

// Compose enhancers manually
const enhancer = compose(
  withLazyLoading(loadFn),
  withVisibilityTracking(0.5)
);

const MyComponent = enhancer(BrutalComponent);
```

## Available Enhancers

### withAsyncLoading

Adds async loading capabilities to a component.

```typescript
const AsyncComponent = createEnhancedComponent(
  'AsyncComponent',
  withAsyncLoading({
    loader: () => import('./heavy-component'),
    loading: LoadingComponent,
    error: ErrorComponent,
    delay: 200,
    timeout: 10000
  })
);
```

### withLazyLoading

Loads content when the component becomes visible.

```typescript
const LazyImage = createEnhancedComponent(
  'LazyImage',
  withLazyLoading(function() {
    const src = this.getAttribute('data-src');
    this.innerHTML = `<img src="${src}" alt="">`;
  }, {
    threshold: 0.1,
    rootMargin: '50px'
  })
);
```

### withVisibilityTracking

Tracks how long a component has been visible.

```typescript
const TrackedAd = createEnhancedComponent(
  'TrackedAd',
  withVisibilityTracking(0.5)
);

// Listen for events
trackedAd.addEventListener('visible', () => console.log('Ad visible'));
trackedAd.addEventListener('hidden', (e) => {
  console.log('Ad was visible for:', e.detail.totalTime);
});

// Get visibility time
const visibleTime = trackedAd.getVisibleTime();
```

### withPortal

Renders component content in a different part of the DOM.

```typescript
const Modal = createEnhancedComponent(
  'Modal',
  withPortal('#modal-root')
);

// Dynamic target
<modal-component target="#custom-target">
  Modal content
</modal-component>
```

## Creating Custom Enhancers

```typescript
import type { ComponentEnhancer } from '@brutal/enhanced-components';

function withCustomFeature(options: CustomOptions): ComponentEnhancer {
  return (Component) => {
    return class extends Component {
      protected init(): void {
        super.init?.();
        // Add your initialization logic
      }
      
      // Add new methods
      customMethod() {
        // Implementation
      }
      
      disconnectedCallback(): void {
        // Cleanup
        super.disconnectedCallback?.();
      }
    };
  };
}
```

## Combining with Class Components

```typescript
class MyComponent extends createEnhancedComponent(
  'MyComponent',
  withLazyLoading(loadFn),
  withPortal()
) {
  constructor() {
    super();
    // Additional initialization
  }
  
  // Additional methods
  myMethod() {
    // Access enhancer features
    const visibleTime = this.getVisibleTime?.();
  }
}

customElements.define('my-component', MyComponent);
```

## Migration Guide

### From Inheritance to Composition

```typescript
// Old (inheritance)
import { LazyComponent } from '@brutal/enhanced-components';

class MyLazyComponent extends LazyComponent {
  async loadContent() {
    // Loading logic
  }
}

// New (composition)
import { createEnhancedComponent, withLazyLoading } from '@brutal/enhanced-components';

const MyLazyComponent = createEnhancedComponent(
  'MyLazyComponent',
  withLazyLoading(async function() {
    // Loading logic
  })
);
```

### From AsyncComponent

```typescript
// Old
class MyAsync extends AsyncComponent {
  async loadData() {
    return fetch('/api/data').then(r => r.json());
  }
  
  renderContent(data) {
    return `<div>${data.title}</div>`;
  }
}

// New
const MyAsync = createEnhancedComponent(
  'MyAsync',
  withAsyncLoading({
    loader: async () => {
      const data = await fetch('/api/data').then(r => r.json());
      const Component = class extends BrutalComponent {
        render() {
          this.innerHTML = `<div>${data.title}</div>`;
        }
      };
      return Component;
    }
  })
);
```

## Best Practices

1. **Order matters**: Enhancers are applied right-to-left
   ```typescript
   compose(A, B, C)(Component)
   // Equivalent to: A(B(C(Component)))
   ```

2. **Keep enhancers focused**: Each enhancer should do one thing well

3. **Use TypeScript**: Enhancers preserve type safety
   ```typescript
   const Enhanced = withVisibilityTracking()(BrutalComponent);
   const instance = new Enhanced();
   instance.getVisibleTime(); // ✅ TypeScript knows this exists
   ```

4. **Test enhancers independently**: Each enhancer can be tested in isolation

## Performance Benefits

- **Tree-shaking**: Only import the enhancers you use
- **No deep prototype chains**: Better performance than inheritance
- **Lazy loading**: Enhancers can be dynamically imported
- **Smaller bundles**: Unused legacy code can be removed

## Future-Proof

This pattern scales to support all 42 planned BRUTAL packages:

```typescript
// Future example with many enhancers
const SuperComponent = createEnhancedComponent(
  'SuperComponent',
  withGPUAcceleration(),
  withAnimation({ duration: 300 }),
  withForm({ validation: true }),
  withWorker({ offloadCompute: true }),
  withLazyLoading(loadFn),
  withPortal('#modal')
);
```