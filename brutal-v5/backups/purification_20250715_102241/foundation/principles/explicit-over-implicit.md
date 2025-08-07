# Principle: Explicit Over Implicit

## The Principle

Make everything explicit. No magic. No assumptions. No hidden behavior.

## Why This Matters

Implicit behavior causes:
- Debugging nightmares
- Unexpected side effects
- Learning curve cliffs
- Maintenance confusion

Explicit code enables:
- Clear understanding
- Predictable behavior
- Easy debugging
- Confident changes

## How We Apply It

### Dependencies
```javascript
// ❌ BAD: Implicit global dependency
class Component {
  constructor() {
    // Assumes Router exists globally
    this.router = Router.instance;
  }
}

// ✅ GOOD: Explicit import
import { Router } from '@brutal/routing';

class Component {
  constructor(router = new Router()) {
    this.router = router;
  }
}
```

### Side Effects
```javascript
// ❌ BAD: Hidden side effect
function createState(initial) {
  // Secretly registers globally
  window.__states__.push(state);
  return new Proxy(initial, handler);
}

// ✅ GOOD: Explicit registration
function createState(initial, registry = null) {
  const state = new Proxy(initial, handler);
  if (registry) {
    registry.register(state);
  }
  return state;
}
```

### Configuration
```javascript
// ❌ BAD: Magic configuration
// Looks for brutal.config.js in 5 different places
const config = loadConfig();

// ✅ GOOD: Explicit config
import config from './brutal.config.js';
// Or
const config = loadConfig('./brutal.config.js');
```

### Bundle Composition
```javascript
// ❌ BAD: Implicit inclusion
// "core" bundle magically includes stuff

// ✅ GOOD: Explicit list
export const BUNDLES = {
  core: [
    '@brutal/foundation',
    '@brutal/shared',
    '@brutal/events',
    '@brutal/templates',
    '@brutal/components',
    '@brutal/state',
    '@brutal/routing',
    '@brutal/cache',
    '@brutal/scheduling',
    '@brutal/a11y',
    '@brutal/plugins'
  ]
};
```

### Error Handling
```javascript
// ❌ BAD: Swallow errors
try {
  doSomething();
} catch (e) {
  // Silent fail
}

// ✅ GOOD: Explicit handling
try {
  doSomething();
} catch (error) {
  logger.error('Failed to do something', error);
  throw new BrutalError('SOMETHING_FAILED', { cause: error });
}
```

## Examples in V5

### Explicit Package Dependencies
Each package.json lists exact dependencies:
```json
{
  "dependencies": {
    "@brutal/shared": "workspace:^",
    "@brutal/events": "workspace:^"
  }
}
```
No hidden peer dependencies or assumptions.

### Explicit Quality Requirements
Not "try to have good coverage" but:
```javascript
coverageThreshold: {
  global: {
    branches: 95,
    functions: 95,
    lines: 95,
    statements: 95
  }
}
```

### Explicit File Organization
Not "put files somewhere logical" but:
```
packages/[name]/
├── src/          # Source code
├── tests/        # Test files
├── package.json  # Package manifest
└── README.md     # Package docs
```

## The Test

Before implementing anything, ask:
1. Will someone understand this without explanation?
2. Are all dependencies visible?
3. Are all side effects documented?
4. Could this surprise someone?

If any answer is "no", make it more explicit.

## Anti-patterns

### ❌ Convention Over Configuration
```javascript
// BAD: Assumes file structure
loadComponents('./components/**/*.js');

// GOOD: Explicit imports
import { Button } from './components/Button.js';
import { Input } from './components/Input.js';
```

### ❌ Implicit Type Coercion
```javascript
// BAD: Relies on coercion
if (value) { }  // What's truthy?

// GOOD: Explicit check
if (value !== null && value !== undefined) { }
```

### ❌ Magic Methods
```javascript
// BAD: Magic lifecycle
class Component {
  __init__() { }  // When does this run?
}

// GOOD: Explicit lifecycle
class Component {
  connectedCallback() { }  // Web standard
}
```

## Benefits

1. **Onboarding**: New developers understand immediately
2. **Debugging**: Clear trace of execution
3. **Refactoring**: Safe to change without surprises
4. **Documentation**: Code documents itself

---

*Explicit code is self-documenting code.*