# @brutal/enhanced-state

Enhanced state management for BRUTAL framework with time-travel debugging, persistence, computed properties, DevTools integration, and middleware support.

## Installation

```bash
npm install @brutal/enhanced-state
```

## Features

### 🕐 Time-Travel Debugging
- Undo/redo state changes
- Full history navigation
- Configurable snapshot limits
- Action tracking

### 💾 State Persistence
- Multiple adapter support (LocalStorage, SessionStorage, Memory)
- Automatic hydration
- Version migration
- Customizable serialization

### 🧮 Computed Properties
- Automatic dependency tracking
- Memoization support
- Lazy evaluation
- Cache invalidation on state change

### 🔍 DevTools Integration
- State inspection
- Change logging
- History export/import
- Performance metrics

### 🔌 Middleware System
- Async middleware support
- Built-in middleware (logger, validator, throttle)
- Pipeline composition
- Error handling

## Usage

```javascript
import { createEnhancedStore } from '@brutal/enhanced-state';

// Create store with all features
const store = createEnhancedStore(
  { count: 0, name: 'test' },
  {
    timeTravel: true,
    persistence: {
      key: 'app-state',
      adapter: new LocalStorageAdapter()
    },
    devTools: true,
    middleware: [
      middleware.logger(),
      middleware.validator(state => state.count >= 0)
    ]
  }
);

// Use computed properties
const doubleCount = store.computed(() => store.getState().count * 2);

// Update state
store.setState({ count: 5 });
console.log(doubleCount.get()); // 10

// Time travel
store.history.back(); // Undo
store.history.forward(); // Redo

// Persist state
await store.persist();
```

## API Reference

See [API.md](./docs/API.md) for detailed API documentation.

## Bundle Size

Current: 16KB (gzipped)
Target: 12KB (optimization in progress)

## Testing

```bash
npm test          # Run tests
npm test:coverage # Check coverage (currently 69%, target 95%)
```

## Status

- ✅ Fully implemented
- ⚠️ Bundle size optimization needed
- ⚠️ Test coverage needs improvement