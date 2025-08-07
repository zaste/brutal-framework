# @brutal/state

Ultra-lightweight state management library for BRUTAL V5.

## Features

- <¯ **Tiny Bundle**: Only 757 bytes (minified + gzipped)
- =% **Reactive**: Automatic updates on state changes
- =¾ **Persistence**: Built-in localStorage support
- = **DevTools**: Redux DevTools integration
- <¨ **TypeScript**: Full type safety
- ¡ **Zero Dependencies**: No external libraries

## Installation

```bash
npm install @brutal/state
```

## Usage

### Basic Store

```typescript
import { createStore } from '@brutal/state';

// Create a store
const store = createStore({
  count: 0,
  user: null
});

// Get state
console.log(store.count); // 0

// Update state via direct assignment
store.count = 5;

// Update state via setState
store.setState({ count: 10 });

// Update with function
store.setState(state => ({ count: state.count + 1 }));
```

### Subscriptions

```typescript
// Subscribe to all changes
const unsubscribe = store.subscribe((newState, prevState) => {
  console.log('State changed:', newState);
});

// Unsubscribe
unsubscribe();
```

### Selectors (Memoized)

```typescript
import { createSelector } from '@brutal/state';

// Create memoized selector
const getFilteredItems = createSelector((state) => {
  return state.items.filter(item => item.active);
});

// Use selector - only recomputes when state changes
const activeItems = getFilteredItems(store.getState());
```

### Persistence

```typescript
import { persist } from '@brutal/state';

const store = createStore({
  theme: 'light',
  preferences: {}
});

// Enable persistence to localStorage
const unpersist = persist(store, 'app-state');

// State will be saved automatically and restored on page reload
```

### DevTools Integration

```typescript
import { devtools } from '@brutal/state';

const store = createStore({ count: 0 });

// Connect to Redux DevTools
devtools(store, 'MyApp');
```

## API Reference

### createStore

Creates a new store with the given initial state.

```typescript
function createStore<T>(initialState: T | (() => T)): Store<T>
```

### Store Methods

- `getState()` - Get current state
- `setState(partial)` - Update state (partial or function)
- `subscribe(listener)` - Subscribe to changes
- `destroy()` - Clean up all listeners

### Utility Functions

- `shallow(a, b)` - Shallow equality check
- `createSelector(selector, equalityFn?)` - Create memoized selector
- `persist(store, key, storage?)` - Enable persistence
- `devtools(store, name?)` - Connect to Redux DevTools

## Examples

### Todo App

```typescript
const store = createStore({
  todos: [],
  filter: 'all'
});

// Add todo
function addTodo(text) {
  store.setState(state => ({
    todos: [...state.todos, { 
      id: Date.now(), 
      text, 
      completed: false 
    }]
  }));
}

// Toggle todo
function toggleTodo(id) {
  store.setState(state => ({
    todos: state.todos.map(todo =>
      todo.id === id 
        ? { ...todo, completed: !todo.completed }
        : todo
    )
  }));
}

// Filtered todos selector
const getVisibleTodos = createSelector(state => {
  switch (state.filter) {
    case 'active':
      return state.todos.filter(t => !t.completed);
    case 'completed':
      return state.todos.filter(t => t.completed);
    default:
      return state.todos;
  }
});
```

### Form State

```typescript
const formStore = createStore({
  values: { email: '', password: '' },
  errors: {},
  touched: {},
  isSubmitting: false
});

// Update field
function updateField(name, value) {
  formStore.setState(state => ({
    values: { ...state.values, [name]: value },
    errors: { ...state.errors, [name]: '' }
  }));
}

// Validate
function validate() {
  const { email, password } = formStore.values;
  const errors = {};
  
  if (!email) errors.email = 'Required';
  if (!password) errors.password = 'Required';
  
  formStore.errors = errors;
  return Object.keys(errors).length === 0;
}
```

## React Integration

While @brutal/state is framework-agnostic, it works great with React:

```typescript
import { useSyncExternalStore } from 'react';

function useStore(store, selector = state => state) {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
}

// Usage in component
function Counter() {
  const count = useStore(store, state => state.count);
  
  return (
    <button onClick={() => store.count++}>
      Count: {count}
    </button>
  );
}
```

## Performance

- Direct property access via Proxy
- Shallow equality checks for partial updates
- Memoized selectors prevent unnecessary computations
- No re-renders when updating unrelated state
- Batched updates within the same tick

## Bundle Size

| Export | Size (min+gzip) |
|--------|----------------|
| Full bundle | 757B |
| Core only | ~500B |
| + DevTools | ~100B |
| + Persist | ~150B |

## TypeScript

Full TypeScript support with type inference:

```typescript
interface AppState {
  user: { id: string; name: string } | null;
  theme: 'light' | 'dark';
  count: number;
}

const store = createStore<AppState>({
  user: null,
  theme: 'light',
  count: 0
});

// Type-safe access
store.theme = 'dark'; // 
store.theme = 'blue'; // L Type error
```

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- No IE11 support

## License

MIT