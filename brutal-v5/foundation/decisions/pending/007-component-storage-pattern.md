# Decision: Component Storage Pattern

## Status
🟡 PENDING

## Context
The component lifecycle pattern from V4 specifies using WeakMap for storing component instance data to prevent memory leaks. However, there are trade-offs to consider.

## Problem
How should we store component instance data and cleanup handlers?

## Options

### Option 1: WeakMap Storage (V4 Pattern)
```typescript
const componentStates = new WeakMap<Component, State>();
const componentCleanups = new WeakMap<Component, Cleanup[]>();
```

**Pros**:
- Automatic garbage collection
- No memory leaks
- Clean separation of concerns
- Cannot be inspected externally

**Cons**:
- Harder to debug
- No enumeration capability
- Requires component instance as key

### Option 2: Private Fields
```typescript
class Component {
  #state: State;
  #cleanups: Cleanup[];
}
```

**Pros**:
- True encapsulation
- Better TypeScript support
- Easier to debug
- Co-located with component

**Cons**:
- Increases instance size
- No shared storage benefits
- Requires ES2022 target

### Option 3: Symbol Properties
```typescript
const STATE = Symbol('state');
const CLEANUPS = Symbol('cleanups');

class Component {
  [STATE]: State;
  [CLEANUPS]: Cleanup[];
}
```

**Pros**:
- Hidden from enumeration
- Debuggable with symbols
- Works with older targets
- Instance-based storage

**Cons**:
- Not truly private
- Can be accessed via getOwnPropertySymbols
- Increases instance size

## Constraints
- Must prevent memory leaks
- Must support 95% test coverage
- Must work with @brutal/scheduling integration
- Must support error boundaries

## Trade-offs
- **Performance**: WeakMap has lookup cost, private fields are fastest
- **Memory**: WeakMap shares storage, instance properties duplicate
- **Debugging**: Private fields easiest, WeakMap hardest
- **Security**: Private fields most secure, symbols least

## Recommendation
TBD - Needs team input on priorities:
1. If debugging is priority → Private fields
2. If memory efficiency is priority → WeakMap
3. If compatibility is priority → Symbols

## Impact
- Affects @brutal/components implementation
- Impacts debugging experience
- Influences memory profile
- Sets pattern for other packages

## Questions for Team
1. What's our minimum JavaScript target?
2. How important is runtime inspection?
3. Do we need to support component pooling?
4. Should storage be extensible by plugins?

## Decision Deadline
Before implementing @brutal/components package

## References
- [Component Lifecycle V4 Pattern](../../patterns/core/component-lifecycle-v4.md)
- [MDN WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
- [Private Fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields)