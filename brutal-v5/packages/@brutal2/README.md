# @brutal2

> Clean reimplementation of BRUTAL - Zero dependencies, pure composition, minimal size

## Overview

@brutal2 is a ground-up reimplementation of the BRUTAL framework, focusing on:
- **Pure composition** - No inheritance, just functions
- **Minimal size** - 8.5KB total (vs 71KB in V5)
- **Natural JavaScript** - Proxy-based reactivity
- **Zero dependencies** - Nothing external

## Packages

| Package | Size | Purpose |
|---------|------|---------|
| `@brutal2/core` | 2KB | Composition utilities and component factory |
| `@brutal2/dom` | 2KB | Template compilation and rendering |
| `@brutal2/state` | 1KB | Reactive state management |
| `@brutal2/events` | 1KB | Event system and delegation |
| `@brutal2/router` | 1KB | SPA routing |
| `@brutal2/animation` | 1KB | GPU-accelerated animations |
| `@brutal2/utils` | 0.5KB | Shared utilities |
| **Total** | **8.5KB** | Complete framework |

## Quick Start

```typescript
import { component, html, render } from '@brutal2';

// Create a component
const Counter = component({
  state: { count: 0 },
  
  render() {
    return html`
      <div>
        <button @click=${() => this.state.count--}>-</button>
        <span>${this.state.count}</span>
        <button @click=${() => this.state.count++}>+</button>
      </div>
    `;
  }
});

// Use it
render(Counter(), document.body);
```

## Core Concepts

### 1. Composition Over Inheritance

```typescript
// Not this
class MyComponent extends Component { }

// But this
const MyComponent = component({
  behaviors: [withState, withEvents, withStyle]
});
```

### 2. Natural State Management

```typescript
// Direct property access
store.user = { name: 'John' };
store.todos.push({ text: 'New todo' });

// Automatic reactivity
store.subscribe(changes => {
  console.log('Changed:', changes);
});
```

### 3. Template Literals

```typescript
// Real JavaScript template literals
const template = html`
  <ul>
    ${todos.map(todo => html`
      <li class=${todo.done ? 'done' : ''}>
        ${todo.text}
      </li>
    `)}
  </ul>
`;
```

## Philosophy

1. **Sin pérdida** - No feature loss from V5
2. **Sin ruido** - No redundant code
3. **Zero magic** - Everything is just JavaScript
4. **Brutal efficiency** - Maximum power, minimum size

## Migration from @brutal

See [Migration Guide](./MIGRATION.md) for detailed instructions.

## License

MIT