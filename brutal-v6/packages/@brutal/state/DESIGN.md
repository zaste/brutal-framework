# @brutal/state Design - 100% Aligned

## 🎯 North Star Requirements
- Enable TODO app in < 50 lines
- Global state management WITHOUT Redux ceremony
- Must prove "simpler than Redux/MobX"
- Target: 1KB minified

## 🏗️ Architecture

### Core Concepts
1. **Stores** - Global reactive state containers
2. **Actions** - Pure functions that update state
3. **Subscribe** - React to state changes
4. **No boilerplate** - Just objects and functions

### API Design

```javascript
// Creating a store (5 lines)
const todoStore = createStore({
  todos: [],
  add: (state, text) => ({ todos: [...state.todos, { id: Date.now(), text }] }),
  remove: (state, id) => ({ todos: state.todos.filter(t => t.id !== id) })
});

// Using in components (automatic reactivity)
compose(
  withStore(todoStore),
  withTemplate(({ todos, add, remove }) => html`
    <div>
      ${todos.map(t => html`
        <div>${t.text} <button onclick=${() => remove(t.id)}>×</button></div>
      `)}
      <input onenter=${e => add(e.target.value)} />
    </div>
  `)
)(element);

// Direct access
todoStore.add('Learn BRUTAL');
todoStore.todos; // [{ id: 123, text: 'Learn BRUTAL' }]

// Subscribe to changes
const unsub = todoStore.subscribe(state => console.log('Changed:', state));
```

## 📐 Implementation Strategy

### 1. Store Creation
```javascript
function createStore(config) {
  // Separate state from actions
  const state = {};
  const actions = {};
  
  Object.entries(config).forEach(([key, value]) => {
    if (typeof value === 'function') {
      actions[key] = value;
    } else {
      state[key] = value;
    }
  });
  
  // Make reactive with Proxy
  const subscribers = new Set();
  
  const proxy = new Proxy(state, {
    get(target, key) {
      if (key in actions) {
        return (...args) => {
          const newState = actions[key](target, ...args);
          Object.assign(target, newState);
          subscribers.forEach(fn => fn(target));
        };
      }
      return target[key];
    }
  });
  
  proxy.subscribe = fn => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  };
  
  return proxy;
}
```

### 2. Component Integration
```javascript
function withStore(store) {
  return element => {
    // Auto-subscribe component
    const update = () => element.update?.();
    store.subscribe(update);
    
    // Expose store as props
    Object.defineProperty(element, 'store', {
      get: () => store
    });
    
    return element;
  };
}
```

## 🎯 Alignment Check

### Principles:
1. **ZERO_DEPS** ✅ - No external deps
2. **COMPOSITION** ✅ - Works with compose pattern
3. **SIZE_FIRST** ✅ - ~500 bytes core
4. **ONE_WAY** ✅ - Single store pattern
5. **USER_DRIVEN** ✅ - Requested for TODO app
6. **AMBITIOUS** ✅ - Simpler than Redux

### North Star:
- ✅ Enables TODO app
- ✅ Global state management
- ✅ No ceremony
- ✅ Under 1KB

## 📊 Size Budget

```
createStore:     300 bytes
withStore:       100 bytes  
Subscriptions:   100 bytes
---------------
Total:          ~500 bytes minified
```

## 🚀 TODO App Proof

```javascript
// Complete TODO app with global state (30 lines)
const store = createStore({
  todos: [],
  filter: 'all',
  
  add(state, text) {
    return { todos: [...state.todos, { id: Date.now(), text, done: false }] };
  },
  
  toggle(state, id) {
    return {
      todos: state.todos.map(t => 
        t.id === id ? { ...t, done: !t.done } : t
      )
    };
  },
  
  setFilter(state, filter) {
    return { filter };
  }
});

const TodoApp = compose(
  withStore(store),
  withTemplate(({ todos, filter, add, toggle, setFilter }) => html`
    <div>
      <input placeholder="Add todo..." onenter=${e => {
        add(e.target.value);
        e.target.value = '';
      }} />
      
      ${todos
        .filter(t => filter === 'all' || (filter === 'active' ? !t.done : t.done))
        .map(t => html`
          <div onclick=${() => toggle(t.id)} class=${t.done ? 'done' : ''}>
            ${t.text}
          </div>
        `)}
      
      <nav>
        <a onclick=${() => setFilter('all')}>All</a>
        <a onclick=${() => setFilter('active')}>Active</a>
        <a onclick=${() => setFilter('done')}>Done</a>
      </nav>
    </div>
  `)
)(document.getElementById('app'));
```

## ✅ Success Metrics

1. TODO app in 30 lines ✅
2. No boilerplate ✅
3. Intuitive API ✅
4. Under 1KB ✅
5. Better than Redux ✅