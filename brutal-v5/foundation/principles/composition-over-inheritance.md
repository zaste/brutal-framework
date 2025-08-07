# 🔧 Composition Over Inheritance

> **Core Principle**: Use function composition and higher-order components instead of class inheritance to enable true modularity and tree-shaking.

## Why This Matters

### The Problem with Inheritance
```typescript
// ❌ WRONG: Deep inheritance chains
abstract class BrutalComponent extends HTMLElement {
  abstract init(): void;
}

class AsyncComponent extends BrutalComponent {
  async init() { /*...*/ }
}

class LazyComponent extends AsyncComponent {
  // Now stuck with async even if not needed
}
```

### The Power of Composition
```typescript
// ✅ CORRECT: Composable functions
export const withLifecycle = (Component) => {
  return class extends Component {
    connectedCallback() {
      super.connectedCallback?.();
      // Lifecycle logic
    }
  };
};

export const withAsync = (Component) => {
  return class extends Component {
    async load() {
      // Async logic
    }
  };
};

// Use only what you need
const MyComponent = withLifecycle(withAsync(HTMLElement));
const SimpleComponent = withLifecycle(HTMLElement);
```

## Benefits

### 1. **True Modularity**
- Each feature is independently importable
- No forced inheritance of unwanted features
- Enables scaling to 42+ packages

### 2. **Tree-Shaking**
- Unused compositions are eliminated
- Smaller bundle sizes
- Only pay for what you use

### 3. **Flexibility**
- Mix and match features as needed
- No rigid hierarchy
- Easy to extend without modifying base

### 4. **Testing**
- Test each composition in isolation
- Simpler mocks and stubs
- Better test coverage

## Implementation Guidelines

### Creating Composable Functions
```typescript
// 1. Define the enhancer
export const withFeature = <T extends Constructor>(Base: T) => {
  return class extends Base {
    // Add feature behavior
    featureMethod() {
      // Implementation
    }
  };
};

// 2. Type it properly
type Constructor = new (...args: any[]) => {};
type Composable<T> = T & {
  featureMethod(): void;
};

// 3. Export typed composition
export const withFeature = <T extends Constructor>(
  Base: T
): Constructor<Composable<InstanceType<T>>> => {
  // Implementation
};
```

### Using Compositions
```typescript
// Single composition
const EnhancedElement = withFeature(HTMLElement);

// Multiple compositions (order matters!)
const SuperElement = withCache(
  withState(
    withLifecycle(HTMLElement)
  )
);

// With custom base
class MyBase extends HTMLElement {
  baseMethod() {}
}
const MyComponent = withFeature(MyBase);
```

## Anti-Patterns to Avoid

### ❌ Deep Inheritance
```typescript
// DON'T: Creates rigid hierarchy
class A extends HTMLElement {}
class B extends A {}
class C extends B {}
class D extends C {} // 4 levels deep!
```

### ❌ God Objects
```typescript
// DON'T: Everything in one class
class BrutalComponent extends HTMLElement {
  // 50+ methods for every possible feature
}
```

### ❌ Forced Dependencies
```typescript
// DON'T: Can't use state without events
class StatefulComponent extends EventfulComponent {
  // Forced to include event system
}
```

## Migration Strategy

### From Inheritance to Composition
```typescript
// Before (Inheritance)
abstract class BrutalComponent extends HTMLElement {
  protected abstract init(): void;
  protected state = {};
  protected cleanup: Function[] = [];
}

// After (Composition)
export const withInit = (Base) => class extends Base {
  connectedCallback() {
    super.connectedCallback?.();
    this.init?.();
  }
};

export const withState = (Base) => class extends Base {
  #state = {};
  get state() { return this.#state; }
};

export const withCleanup = (Base) => class extends Base {
  #cleanup: Function[] = [];
  addCleanup(fn: Function) { this.#cleanup.push(fn); }
};
```

## Composition Patterns

### 1. **Higher-Order Components**
```typescript
const withTheme = (Component) => {
  return class extends Component {
    get theme() {
      return document.body.dataset.theme || 'light';
    }
  };
};
```

### 2. **Mixin Functions**
```typescript
export function applyMixins(Base: Constructor, ...mixins: Function[]) {
  return mixins.reduce((mixed, mixin) => mixin(mixed), Base);
}

const MyComponent = applyMixins(
  HTMLElement,
  withState,
  withEvents,
  withLifecycle
);
```

### 3. **Factory Functions**
```typescript
export function createComponent(features: string[]) {
  let Component = HTMLElement;
  
  if (features.includes('state')) {
    Component = withState(Component);
  }
  if (features.includes('events')) {
    Component = withEvents(Component);
  }
  
  return Component;
}
```

## Real-World Example

```typescript
// Define feature compositions
const withReactive = (Base) => class extends Base {
  #observers = new Set();
  observe(fn) { this.#observers.add(fn); }
  notify() { this.#observers.forEach(fn => fn()); }
};

const withTemplate = (Base) => class extends Base {
  render(template: string) {
    this.innerHTML = template;
  }
};

const withShadow = (Base) => class extends Base {
  constructor(...args) {
    super(...args);
    this.attachShadow({ mode: 'open' });
  }
};

// Compose as needed
const ReactiveElement = withReactive(HTMLElement);
const TemplatedElement = withTemplate(withReactive(HTMLElement));
const ShadowComponent = withShadow(withTemplate(withReactive(HTMLElement)));

// Use only what you need
class MySimpleComponent extends ReactiveElement {
  // Just reactive, no template or shadow
}

class MyComplexComponent extends ShadowComponent {
  // All features composed
}
```

## Validation Checklist

- [ ] No abstract classes in public API
- [ ] No inheritance chains deeper than 2 levels
- [ ] All features available as compositions
- [ ] Each composition is independently testable
- [ ] Type safety maintained through generics
- [ ] Documentation shows composition examples
- [ ] Migration path from inheritance documented

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md#composition-pattern-required)
- [TypeScript Mixins](https://www.typescriptlang.org/docs/handbook/mixins.html)
- [Web Components Best Practices](https://developers.google.com/web/fundamentals/web-components/best-practices)

---

*Composition enables the modularity required to scale to 42 packages while maintaining small bundle sizes and maximum flexibility.*