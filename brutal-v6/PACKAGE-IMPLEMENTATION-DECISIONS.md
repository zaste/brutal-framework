# 📋 Package Implementation Decisions

**Date**: 2025-07-15
**Status**: Exploring

## 🎯 Context

With foundation complete and protecting us from V5's mistakes, we need to decide how to implement the actual framework packages. This document captures the key decisions needed before writing code.

## 🔄 Decision 1: Development Approach

### The Question
How should we develop packages to ensure they meet real needs without over-engineering?

### Options Considered

#### Option A: Core-First (Bottom-Up)
```
Day 1: @brutal/core
Day 2: @brutal/dom + @brutal/state  
Day 3: @brutal/router + @brutal/animation
Day 4: Build example apps
Day 5: Refine based on usage
```

**Pros:**
- Clean architecture from start
- Dependencies flow correctly
- Systematic progress

**Cons:**
- Risk of imaginary requirements
- No user validation until day 4
- Might build unused features

**V5 Learning**: This is how V5 was built, resulting in 7 template implementations that nobody asked for.

#### Option B: App-First (Top-Down)
```
Day 1: Build TODO app with vanilla JS
Day 2: Extract common patterns
Day 3: Package the patterns
Day 4: Build second app using packages
Day 5: Refine and document
```

**Pros:**
- User-driven from hour 1
- Only build what's needed
- Real constraints guide design

**Cons:**
- Might miss architectural patterns
- Refactoring overhead
- Less systematic

**V5 Learning**: V5 never did this, built in isolation.

#### Option C: Parallel Development (Iterative)
```
Morning: Build small piece of core
Afternoon: Use it in example
Evening: Refine based on usage
Repeat: For each package
```

**Pros:**
- Immediate validation
- Balanced approach
- Continuous feedback

**Cons:**
- Context switching overhead
- Slower initial velocity
- Requires discipline

### Recommendation: Option C (Parallel)

**Rationale**: 
- Prevents both over-engineering AND under-architecting
- Every line of code is validated by real usage
- Matches our "user-driven development" principle

## 📝 Decision 2: API Design Strategy

### The Question
How verbose should our APIs be, given our 2KB/package constraint?

### Options Considered

#### Option A: Minified Only
```typescript
// Everything is single letters
export const c = (t) => document.createElement(t);
export const s = (i) => new Proxy(i, {/*...*/});
export const e = (l) => new EventTarget();
```

**Pros:**
- Smallest possible size
- Forces simplicity
- No redundancy

**Cons:**
- Terrible developer experience
- Hard to learn
- No IDE help

#### Option B: Verbose Only
```typescript
// Full names only
export const createElement = (tagName) => document.createElement(tagName);
export const createState = (initial) => new Proxy(initial, {/*...*/});
export const createEmitter = (listeners) => new EventTarget();
```

**Pros:**
- Great developer experience
- Self-documenting
- IDE autocomplete

**Cons:**
- Larger bundle size
- Might exceed 2KB limit
- Not aligned with size-first principle

#### Option C: Dual API (Verbose + Minified)
```typescript
// Both versions exported
export const createElement = (tagName) => document.createElement(tagName);
export const c = createElement; // Alias

// User chooses:
import { c } from '@brutal/core';           // Production
import { createElement } from '@brutal/core'; // Development
```

**Pros:**
- Best of both worlds
- Developer chooses tradeoff
- Good DX + small size

**Cons:**
- Slightly larger exports
- Two ways to do same thing
- Need clear convention

### Recommendation: Option C (Dual API)

**Rationale**:
- Development uses verbose (better DX)
- Production uses minified (smaller size)
- Build tool can auto-transform
- Aligns with both DX and size principles

**Implementation**:
```typescript
// Pattern for all exports
export function composeFunctions(...fns) { 
  return x => fns.reduceRight((v, f) => f(v), x);
}
export const c = composeFunctions; // Always provide minified alias
```

## 🏗️ Decision 3: Package Architecture

### The Question
How should packages be structured and related?

### Structure
```
packages/
├── @brutal/
│   ├── core/         # Foundation utilities
│   ├── dom/          # DOM manipulation
│   ├── state/        # State management
│   ├── events/       # Event system
│   ├── router/       # Routing
│   ├── animation/    # Animations
│   └── utils/        # Shared utilities
```

### Dependency Rules
```
        utils
          ↑
    ┌─────┴─────┐
    │           │
  core          │
    ↑           │
    ├─────┬─────┤
    │     │     │
   dom  state events
    ↑     ↑     ↑
    └─────┴─────┘
          │
    ┌─────┴─────┐
    │           │
  router   animation
```

### Size Budget
```typescript
const SIZE_BUDGETS = {
  '@brutal/core': 2048,      // 2KB
  '@brutal/dom': 2048,       // 2KB
  '@brutal/state': 1024,     // 1KB
  '@brutal/events': 1024,    // 1KB
  '@brutal/router': 1024,    // 1KB
  '@brutal/animation': 1024, // 1KB
  '@brutal/utils': 512,      // 0.5KB
  'TOTAL': 8704             // 8.5KB
};
```

### Recommendation: Strict Hierarchy

**Rationale**:
- Clear dependency flow
- No circular dependencies
- Each package has single purpose
- Total under 10KB target

## 🧪 Decision 4: Testing Strategy

### The Question
How do we ensure quality without bloating test infrastructure?

### Options Considered

#### Option A: Traditional Unit Tests
```typescript
// Separate test files
describe('compose', () => {
  it('should compose functions', () => {
    expect(compose(f, g)(x)).toBe(f(g(x)));
  });
});
```

**Cons**: Separate from usage, can test wrong things

#### Option B: Examples as Tests
```typescript
// examples/todo/app.js
import { c, s } from '@brutal/core';

// This IS the test - if it works, core works
const app = c(
  withState({ todos: [] }),
  withEvents
)(document.querySelector('#app'));
```

**Pros**: Tests real usage, not imaginary scenarios

#### Option C: Pattern Tests (Current)
```typescript
// patterns/composition.test.ts
it('demonstrates composition', () => {
  // This test IS the documentation
  const compose = (...fns) => x => 
    fns.reduceRight((v, f) => f(v), x);
  
  // Show it works
  expect(compose(double, add1)(5)).toBe(12);
});
```

### Recommendation: Examples + Pattern Tests

**Rationale**:
- Examples validate real usage
- Pattern tests document usage
- No separate test infrastructure
- Tests = Documentation = Examples

## 📚 Decision 5: Documentation Strategy

### The Question
How do we document without separate documentation?

### Approach: Self-Documenting System

1. **Pattern tests show HOW**
   ```typescript
   // patterns/state.test.ts shows exact usage
   ```

2. **Examples show WHEN**
   ```typescript
   // examples/todo shows real app usage
   ```

3. **Types show WHAT**
   ```typescript
   // TypeScript types are the API docs
   ```

4. **Comments show WHY**
   ```typescript
   // Minimal comments explain decisions
   ```

### Recommendation: No Separate Docs

**Rationale**:
- Docs get out of sync
- Code is truth
- Examples are better than docs
- Types are better than API docs

## 🚀 Decision 6: Implementation Order

### Recommended Sequence

1. **Core + Counter Example** (4 hours)
   - Validates composition pattern
   - Simplest possible example
   - Proves the concept

2. **DOM + State + TODO Example** (4 hours)
   - Real app functionality
   - Template rendering
   - State management

3. **Events + Router + SPA Example** (4 hours)
   - Enhanced functionality
   - Navigation
   - Event handling

4. **Animation + Dashboard Example** (4 hours)
   - Polish and performance
   - Complex interactions
   - GPU acceleration

5. **Utils + Integration** (2 hours)
   - Shared utilities
   - Package integration
   - Final optimization

### Success Criteria
Each package must:
- [ ] Stay under size budget
- [ ] Have working example
- [ ] Export both verbose and minified APIs
- [ ] Pass foundation validation
- [ ] Work in isolation

## 🎯 Final Recommendations

1. **Development Approach**: Parallel (build with usage)
2. **API Design**: Dual (verbose + minified)
3. **Architecture**: Strict hierarchy with size budgets
4. **Testing**: Examples are tests
5. **Documentation**: Self-documenting system
6. **Order**: Core → DOM/State → Events/Router → Animation

## ⏰ Timeline

- Day 1: Core + DOM + examples
- Day 2: State + Events + examples  
- Day 3: Router + Animation + examples
- Day 4: Integration + optimization
- Day 5: Polish + release prep

Total: 5 days to working framework

## ✅ Decision Checklist

- [ ] Agree on parallel development approach
- [ ] Confirm dual API strategy
- [ ] Approve package architecture
- [ ] Accept examples as tests
- [ ] Validate implementation order

---

**Next Step**: Upon approval, create package structure and begin core implementation with counter example.