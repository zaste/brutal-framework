# Principle: Modular Architecture

## The Principle

Everything is a module. Small, focused, composable.

## Why This Matters

1. **Use only what you need** - No paying for unused features
2. **Independent evolution** - Packages can improve without breaking others
3. **Clear dependencies** - Explicit is better than implicit
4. **Easy to understand** - Small modules are comprehensible

## How We Apply It

### Package Size Targets
- Core packages: 3-8KB each
- Enhanced packages: 8-15KB each  
- No package over 20KB

### Single Responsibility
Each package does one thing well:
- `@brutal/events` - Event system only
- `@brutal/state` - State management only
- `@brutal/routing` - Routing only

### Composition Over Inheritance
```javascript
// Not this:
class SuperComponent extends MegaBase { }

// But this:
import { html } from '@brutal/templates';
import { createState } from '@brutal/state';
import { on } from '@brutal/events';

function Component() {
  const state = createState({});
  const template = html`<div>...</div>`;
  on(element, 'click', handler);
}
```

## The Test

Before adding to a package:
1. Does it belong here?
2. Could it be its own package?
3. Will it bloat the package?

When in doubt, split it out.

---

*Small modules, loosely coupled, highly focused.*