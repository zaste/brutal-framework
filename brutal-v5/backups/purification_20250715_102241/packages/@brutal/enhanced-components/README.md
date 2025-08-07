# @brutal/enhanced-components

Enhanced components for BRUTAL framework with async loading, portals, observers, and advanced lifecycle management.

## Installation

```bash
npm install @brutal/enhanced-components
```

## Features

### 🔄 Async Components
- Lazy loading with dynamic imports
- Loading/error states
- Configurable timeouts
- Retry mechanisms

### 🌀 Portal Components
- Render outside DOM hierarchy
- Multiple portal targets
- Event bubbling preservation
- Cleanup on unmount

### 👁️ Observer Components
- Intersection Observer integration
- Lazy loading components
- Visibility tracking
- Performance optimized

### 🎯 Advanced Lifecycle
- Extended lifecycle hooks
- Error boundaries
- Performance monitoring
- Cleanup management

## Usage

```javascript
import { 
  createAsyncComponent, 
  Portal, 
  LazyComponent,
  LifecycleComponent 
} from '@brutal/enhanced-components';

// Async component
const AsyncChart = createAsyncComponent({
  loader: () => import('./Chart.js'),
  loading: () => '<div>Loading...</div>',
  error: (err) => `<div>Error: ${err.message}</div>`,
  timeout: 5000
});

// Portal usage
class ModalPortal extends Portal {
  connectedCallback() {
    super.connectedCallback();
    this.target = document.body;
    this.render();
  }
}

// Lazy loading
class LazyImage extends LazyComponent {
  threshold = 0.1;
  rootMargin = '50px';
  
  onVisible() {
    this.loadImage();
  }
}

// Lifecycle hooks
class DataComponent extends LifecycleComponent {
  onBeforeMount() {
    console.log('Before mount');
  }
  
  onMounted() {
    console.log('Mounted');
  }
  
  onError(error) {
    console.error('Component error:', error);
  }
}
```

## API Reference

See [API.md](./docs/API.md) for detailed API documentation.

## Bundle Size

Current: 18.12KB (gzipped)
Target: 12KB (optimization in progress)

## Testing

```bash
npm test # Run tests (currently 38/89 failing - fix in progress)
```

## Status

- ✅ Fully implemented
- ❌ Tests need fixing (timer mocks, references)
- ⚠️ Bundle size optimization needed