# @brutal/enhanced-components

> Enhanced components using composition pattern for async loading, portals, observers, and advanced lifecycle

## Installation

```bash
npm install @brutal/enhanced-components
```

## Quick Start

### New Composition Pattern (Recommended)

```typescript
import { 
  createEnhancedComponent,
  withAsyncLoading,
  withPortal,
  withLazyLoading,
  withVisibilityTracking,
  compose
} from '@brutal/enhanced-components';

// Single enhancer
const LazyImage = createEnhancedComponent(
  'LazyImage',
  withLazyLoading(function() {
    const src = this.getAttribute('data-src');
    this.innerHTML = `<img src="${src}" alt="">`;
  })
);

// Multiple enhancers
const TrackedModal = createEnhancedComponent(
  'TrackedModal',
  withPortal('#modal-root'),
  withVisibilityTracking(0.5)
);

// With custom class
class MyComponent extends createEnhancedComponent(
  'MyComponent',
  withAsyncLoading({
    loader: () => import('./HeavyComponent.js'),
    loading: LoadingSpinner,
    error: ErrorComponent
  })
) {
  // Additional methods and properties
}
```

### Legacy API (Deprecated but supported)

```typescript
// Still works for backward compatibility
import { createAsyncComponent, Portal, LazyComponent } from '@brutal/enhanced-components';

const AsyncHero = createAsyncComponent({
  loader: () => import('./HeroSection.js')
});
```

## Features

- 🧩 **Composition Pattern** - Flexible component enhancement without deep inheritance
- 🚀 **Async Components** - Load components on demand with loading states
- 🌀 **Portals** - Render content outside the DOM hierarchy
- 👁️ **Observers** - Built-in intersection, resize, and mutation observers
- 🔄 **Advanced Lifecycle** - Enhanced lifecycle hooks with error boundaries
- 📊 **Performance Tracking** - Built-in visibility time tracking
- 🎯 **Lazy Loading** - Intersection observer-based lazy loading
- 🛡️ **Error Boundaries** - Graceful error handling for components
- 🌳 **Tree-shakeable** - Only import what you use

## API Overview

### Composition API (New)
- `createEnhancedComponent()` - Create components with enhancers
- `compose()` - Compose multiple enhancers
- `withAsyncLoading()` - Add async loading capabilities
- `withLazyLoading()` - Add lazy loading when visible
- `withVisibilityTracking()` - Track component visibility
- `withPortal()` - Render in different DOM location
- `withMixin()` - Apply object mixins

### Legacy API (Deprecated)
- `createAsyncComponent()` - Create async-loaded components
- `AsyncComponent` - Base class for async components
- `Portal` - Component that renders to different DOM location
- `LazyComponent` - Lazy-loading component
- `ObserverComponent` - Base class with observer support
- `VisibilityTracker` - Track visibility time

See [API.md](./API.md) for complete reference.

## Documentation

- [Composition Pattern Guide](./COMPOSITION-PATTERN.md) - Learn the new composition pattern
- [API Reference](./API.md) - Complete API documentation
- [Examples](./EXAMPLES.md) - Code examples and patterns
- [Migration Guide](./MIGRATION.md) - Migrate from inheritance to composition

## Size

- **Current**: ~26KB (includes legacy for compatibility)
- **Target**: ~10KB (after legacy removal)
- **Gzipped**: ~8KB
- **Brotli**: ~6KB

## Dependencies

- @brutal/components (only dependency)

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Node.js 18+

## License

MIT © 2024 BRUTAL Team