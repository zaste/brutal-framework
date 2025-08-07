# @brutal/foundation

The foundation package for BRUTAL Framework - providing core utilities, error handling, configuration management, and essential primitives with zero runtime dependencies.

## Features

- 🎯 **Zero Runtime Dependencies** - Pure JavaScript implementation
- 📦 **< 6KB Gzipped** - Minimal footprint for maximum performance
- 🔧 **Core Utilities** - Essential type checking, object/array helpers, and more
- ⚡ **High-Performance Primitives** - EventEmitter, Observable, Cache, and StateMachine
- 🛡️ **Robust Error System** - Typed errors with context and error boundaries
- 🌍 **Environment Profiles** - Browser and Node.js compatible environment detection
- 📋 **Configuration Management** - Flexible config loader with nested path access
- 🔌 **Polyfill Strategy** - Smart polyfill loading based on environment

## Installation

```bash
npm install @brutal/foundation
# or
pnpm add @brutal/foundation
# or
yarn add @brutal/foundation
```

## Usage

### Core Utilities

```typescript
import { utils } from '@brutal/foundation';

// Type checking
utils.isObject({}); // true
utils.isArray([]); // true
utils.isFunction(() => {}); // true

// Object utilities
utils.deepClone({ a: { b: 1 } });
utils.deepMerge({ a: 1 }, { b: 2 }, { a: 3 }); // { a: 3, b: 2 }

// Array utilities
utils.unique([1, 2, 2, 3]); // [1, 2, 3]
utils.compact([1, null, 2, undefined]); // [1, 2]
utils.flatten([[1, 2], [3, 4]]); // [1, 2, 3, 4]

// Function utilities
const debouncedFn = utils.debounce(() => console.log('called'), 100);
const throttledFn = utils.throttle(() => console.log('called'), 100);
const onceFn = utils.once(() => console.log('called once'));

// Promise utilities
await utils.delay(100); // Wait 100ms
await utils.nextTick(); // Defer to next tick
```

### Error Handling

```typescript
import { createError, ErrorCodes, tryAsync, errorBoundary } from '@brutal/foundation';

// Create typed errors
const error = createError(
  ErrorCodes.CONFIG_NOT_FOUND,
  'Configuration file missing',
  { path: '/config.json' }
);

// Safe async operations
const [result, error] = await tryAsync(async () => {
  return await fetchData();
}, 'fallback');

// Error boundaries
const safeFn = errorBoundary(
  (x: number) => {
    if (x < 0) throw new Error('Negative not allowed');
    return x * 2;
  },
  (error) => console.error('Caught:', error)
);
```

### Primitives

```typescript
import { primitives } from '@brutal/foundation';

// EventEmitter
const emitter = new primitives.EventEmitter<{
  data: [string, number];
  error: [Error];
}>();

emitter.on('data', (msg, count) => {
  console.log(`${msg}: ${count}`);
});

emitter.emit('data', 'hello', 42);

// Observable
const count = new primitives.Observable(0);
count.subscribe((value, oldValue) => {
  console.log(`Changed from ${oldValue} to ${value}`);
});
count.set(1);

// Cache with TTL
const cache = new primitives.Cache<string, any>(60000); // 1 minute TTL
cache.set('key', 'value');
const value = cache.get('key');

// State Machine
const machine = new primitives.StateMachine('idle', [
  { from: 'idle', event: 'start', to: 'running' },
  { from: 'running', event: 'stop', to: 'idle' }
]);

machine.transition('start'); // Now in 'running' state
```

### Configuration

```typescript
import { configLoader } from '@brutal/foundation';

// Load configuration
configLoader.load({
  debug: true,
  api: {
    url: 'https://api.example.com',
    timeout: 5000
  }
});

// Get nested values
const apiUrl = configLoader.get('api.url');
const debug = configLoader.get('debug');

// Set values
configLoader.set('api.timeout', 10000);
```

### Environment Profiles

```typescript
import { envProfiles } from '@brutal/foundation';

// Get current environment
const env = envProfiles.current();
console.log(env.name); // 'development' | 'production' | 'test'

// Check environment
if (envProfiles.isDevelopment()) {
  console.log('Dev mode enabled');
}

// Get specific profile
const prod = envProfiles.get('production');
console.log(prod.minify); // true
console.log(prod.features.devtools); // false
```

### Package Registry

```typescript
import { registry } from '@brutal/foundation';

// Register packages
registry.register('@brutal/core', '1.0.0');

// Check if loaded
if (registry.isLoaded('@brutal/core')) {
  const pkg = registry.get('@brutal/core');
  console.log(pkg.version); // '1.0.0'
}

// List all packages
const packages = registry.list();
```

## API Reference

### Utils

- **Type Checking**: `isObject`, `isArray`, `isFunction`, `isString`, `isNumber`, `isBoolean`, `isNull`, `isUndefined`, `isNullish`, `isDefined`
- **Object Utilities**: `hasOwn`, `deepClone`, `deepMerge`
- **Array Utilities**: `compact`, `unique`, `flatten`
- **Function Utilities**: `noop`, `once`, `debounce`, `throttle`
- **Promise Utilities**: `delay`, `nextTick`
- **String Utilities**: `uniqueId`, `camelCase`, `kebabCase`

### Primitives

- **EventEmitter**: Type-safe event emitter with `on`, `once`, `off`, `emit`
- **Observable**: Value container with change notifications
- **AsyncQueue**: Promise-based FIFO queue
- **Deferred**: Promise wrapper with external resolve/reject
- **Cache**: Key-value store with optional TTL
- **ObjectPool**: Reusable object pool for performance
- **StateMachine**: Type-safe finite state machine

### Error System

- **BrutalError**: Base error class with code, details, and timestamp
- **ErrorCodes**: Predefined error codes
- **createError**: Factory function for creating errors
- **tryAsync/trySync**: Safe execution with tuple return `[result, error]`
- **errorBoundary**: Wrap functions with error handling
- **assert**: Assertion utility that throws BrutalError

### Configuration

- **configLoader**: Load, get, set configuration values with nested path support
- **envProfiles**: Environment detection and profile management
- **polyfillStrategy**: Register and load polyfills based on feature detection

## Browser Support

Works in all modern browsers and Node.js 18+. The package includes browser-compatible environment detection and gracefully handles both environments.

## Size Budget

Current size: **4.46KB minified** (under 6KB budget ✅)

## Contributing

See the main BRUTAL repository for contribution guidelines.

## License

MIT