# Decision: Aggressive Ambition Principle

**Date**: 2025-07-15
**Status**: PERMANENT AND SACRED

## Context

After completing Day 1, we faced a critical moment: accept being "React-lite" or maintain BRUTAL ambition. We choose ambition.

## Decision

BRUTAL V6 will demonstrate that 8.5KB can do EVERYTHING that matters from React's 300KB+. Not "the essentials". EVERYTHING that matters.

## What "Everything That Matters" Means

### ✅ INCLUDED (Must Have)
1. **Reactive Components** - Already proven with compose pattern
2. **Global State Management** - Without Redux ceremony
3. **SPA Routing** - Full client-side routing
4. **Animations** - GPU-accelerated, smooth
5. **Data Fetching** - Integrated, not bolted on
6. **Form Handling** - With validation
7. **Event System** - Beyond onClick
8. **Templates** - Powerful, not just strings
9. **Dev Experience** - Better than JSX
10. **Performance** - 50x faster than React

### ❌ EXCLUDED (Don't Need)
1. **Virtual DOM** - Direct manipulation is faster
2. **JSX Build Step** - Template literals are native
3. **Class Components** - Composition is superior
4. **PropTypes** - TypeScript exists
5. **Synthetic Events** - Native events work fine
6. **Redux/MobX** - Our state is simpler
7. **CSS-in-JS** - CSS is already good
8. **Server Components** - Different problem space
9. **Suspense** - Can be done simpler
10. **Concurrent Mode** - Over-engineering

## Implementation Strategy

### The 8.5KB Budget WILL Include:

```
@brutal/core      (2KB)  - ✅ Composition, behaviors
@brutal/dom       (2KB)  - Templates, rendering, queries
@brutal/state     (1KB)  - Global stores, subscriptions
@brutal/events    (1KB)  - Delegation, custom events
@brutal/router    (1KB)  - Full SPA routing
@brutal/animation (1KB)  - GPU animations, transitions
@brutal/utils     (0.5KB) - Critical helpers only
```

### Aggressive Optimizations Required:

1. **Shared Code** - Utils must be truly shared
2. **Minification** - Every character counts
3. **No Duplication** - ONE way to do things
4. **Browser APIs** - Use what's native
5. **Smart Defaults** - Convention over configuration

## Proof Points

### TODO App (Target: 30 lines)
```javascript
const TodoApp = compose(
  withGlobalState(todoStore),
  withTemplate(state => html`
    <input onenter=${e => state.add(e.target.value)} />
    <ul>${state.todos.map(todo => 
      html`<li onclick=${() => state.remove(todo.id)}>${todo.text}</li>`
    )}</ul>
  `)
)(element);
```

### SPA with Routing (Target: 40 lines)
```javascript
const App = compose(
  withRouter(routes),
  withAnimation({ transitions: true }),
  withGlobalState(appStore)
)(document.body);
```

### Data Dashboard (Target: 100 lines)
- Real-time data updates
- Charts and visualizations  
- Filtering and sorting
- All in 100 lines

## Enforcement

This decision is enforced by:

1. **Pattern Tests** - Must show full app examples
2. **Size Limits** - Build fails if over budget
3. **Capability Tests** - Proves we match React features
4. **North Star Check** - Daily reminder of ambition

## The Mindset

Every time we're tempted to say "that's good enough":
- Remember: React needs 300KB
- Remember: We have 8.5KB
- Remember: We're BRUTAL

Every feature must answer: "Does this prove 8.5KB > 300KB?"

## Success Metrics

V6 succeeds when developers say:
1. "This can't be real"
2. "Show me the code"
3. "Why would anyone use React?"

## NO COMPROMISE

- NO: "It's just for simple apps"
- NO: "It's React-lite"  
- NO: "For basic use cases"

YES: "Everything you need, nothing you don't, 35x smaller"

## This Is Sacred (With Reality Checks)

This decision cannot be reverted. If we can't do it in 8.5KB, we're not trying hard enough.

The moment we accept less, we become just another framework.

### Reality Checkpoints

**Day 3 Check**: If TODO app > 50 lines or > 4KB total
- STOP and evaluate
- Is the API too cryptic for bytes?
- Would 10KB with better DX be smarter?

**Day 5 Check**: If we're at 7KB without router
- HONEST assessment needed
- Document what worked/didn't
- Adjust target if needed WITH JUSTIFICATION

### Non-Negotiables Even With Adjustments

- NEVER exceed 15KB total (still 20x smaller)
- NEVER sacrifice DX for last 0.5KB
- NEVER hide failures - document them
- ALWAYS maintain 30x+ performance advantage

### Success Redefined

Primary: 8.5KB with everything promised
Acceptable: 10-12KB with superior DX
Failure: >15KB or unusable API