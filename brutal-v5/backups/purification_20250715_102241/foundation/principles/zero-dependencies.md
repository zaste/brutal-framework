# Principle: Zero Dependencies

## The Principle

BRUTAL has zero runtime dependencies. This is non-negotiable.

## Why This Matters

1. **Security** - No supply chain vulnerabilities
2. **Performance** - No bloat from unused code
3. **Stability** - No breaking changes from dependencies
4. **Control** - We own every line of code

## How We Apply It

- Implement utilities ourselves
- Choose simplicity over features
- Build only what we need
- Quality over convenience

## Common Patterns

### Event Emitter
```javascript
class EventEmitter {
  constructor() {
    this.events = {};
  }
  on(event, handler) {
    (this.events[event] ||= []).push(handler);
  }
  emit(event, ...args) {
    this.events[event]?.forEach(h => h(...args));
  }
}
```

### Type Checking
```javascript
const isObject = v => v !== null && typeof v === 'object';
const isArray = Array.isArray;
const isFunction = v => typeof v === 'function';
```

## The Test

Before adding anything, ask:
1. Do we really need this?
2. Can we build it simply?
3. Will it stay simple?

If any answer is "no", we don't build it.

---

*Zero dependencies is not a limitation - it's liberation.*