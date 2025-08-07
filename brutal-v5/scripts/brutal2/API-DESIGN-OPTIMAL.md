# 🎯 @brutal2 Optimal API Design
*Maximum power, minimum surface*

## 🌟 Core API (90% of use cases)

```typescript
import { html, component, render } from '@brutal2';

// That's it. 3 functions cover 90% of needs.
```

## 📦 Complete API Surface

### @brutal2/core
```typescript
// Component creation
export function component(config: ComponentConfig): Component;

// Composition utilities  
export function compose(...behaviors: Behavior[]): Behavior;
export function withState(initial?: State): Behavior;
export function withEvents(handlers?: EventHandlers): Behavior;
export function withLifecycle(hooks?: LifecycleHooks): Behavior;
export function withStyle(styles?: Styles): Behavior;
export function withComputed(getters?: ComputedGetters): Behavior;

// Types
export interface ComponentConfig {
  name?: string;        // Custom element name
  tag?: string;         // Base tag (default: 'div')
  behaviors?: Behavior[];
  state?: State;
  render?: () => Template;
  style?: Styles;
  
  // Lifecycle
  onMount?: () => void;
  onUnmount?: () => void;
  onUpdate?: (changes: Changes) => void;
  onError?: (error: Error) => void;
}
```

### @brutal2/dom
```typescript
// Template literal tag
export function html(strings: TemplateStringsArray, ...values: any[]): Template;

// Render function
export function render(template: Template, container: Element): void;

// Event delegation
export function delegate(root: Element, handlers: DelegatedEvents): () => void;

// Template syntax
${expression}             // Interpolation
@click=${handler}         // Events  
.value=${value}          // Properties
?hidden=${condition}     // Boolean attributes
...${spread}             // Spread attributes
```

### @brutal2/state
```typescript
// Create reactive store
export function store<T>(initial: T): Store<T>;

// Computed values
export function computed<T, C>(store: Store<T>, getters: Getters<T, C>): Computed<C>;

// Store API (via Proxy)
store.name = 'John';           // Set
const name = store.name;       // Get
store.subscribe(listener);     // Subscribe
```

### @brutal2/events
```typescript
// Global event bus
export const events: EventBus;

// Event bus API
events.on(event, handler);     // Subscribe
events.off(event, handler);    // Unsubscribe  
events.emit(event, data);      // Publish
events.once(event, handler);   // One-time

// Wildcard support
events.on('*', (event, data) => {});
```

### @brutal2/router
```typescript
// Create router
export function router(routes: Route[]): Router;

// Router API
router.navigate(path, options?);
router.match(path);
router.on('navigate', handler);

// Route syntax
{ path: '/', component: Home }
{ path: '/user/:id', component: User }
{ path: '/posts/:id?', component: Posts }
```

### @brutal2/animation
```typescript
// Animate element
export function animate(
  element: Element,
  keyframes: Keyframes,
  options?: AnimationOptions
): Promise<void>;

// Animation options
{
  duration: 300,
  easing: 'ease-out',
  fill: 'forwards'
}

// Easing functions
export const easings: {
  linear, ease, easeIn, easeOut, easeInOut,
  spring, bounce, elastic
};
```

## 💡 Usage Patterns

### 1. Simple Component
```typescript
const Button = component({
  render() {
    return html`<button @click=${() => alert('Hi!')}>Click me</button>`;
  }
});
```

### 2. Stateful Component
```typescript
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
```

### 3. Composed Component
```typescript
const TodoItem = component({
  behaviors: [
    withState({ done: false, editing: false }),
    withEvents({
      toggle() { this.state.done = !this.state.done; },
      edit() { this.state.editing = true; },
      save(e) {
        this.state.text = e.target.value;
        this.state.editing = false;
      }
    }),
    withStyle({
      '.done': { textDecoration: 'line-through' }
    })
  ],
  
  render() {
    const { done, editing, text } = this.state;
    
    return html`
      <li class=${done ? 'done' : ''}>
        ${editing ? html`
          <input .value=${text} @blur=${this.save} />
        ` : html`
          <span @click=${this.toggle}>${text}</span>
          <button @click=${this.edit}>Edit</button>
        `}
      </li>
    `;
  }
});
```

### 4. Global State
```typescript
// stores/app.js
export const app = store({
  user: null,
  theme: 'light',
  todos: []
});

export const stats = computed(app, {
  total: state => state.todos.length,
  done: state => state.todos.filter(t => t.done).length,
  remaining: state => state.todos.filter(t => !t.done).length
});

// components/header.js
const Header = component({
  onMount() {
    this.unsubscribe = app.subscribe((changes) => {
      if ('user' in changes || 'theme' in changes) {
        this.update();
      }
    });
  },
  
  onUnmount() {
    this.unsubscribe();
  },
  
  render() {
    return html`
      <header class=${app.theme}>
        ${app.user ? `Welcome, ${app.user.name}` : 'Please login'}
        <span>${stats.remaining} todos left</span>
      </header>
    `;
  }
});
```

### 5. Routing
```typescript
const app = router([
  { path: '/', component: Home },
  { path: '/todos', component: TodoList },
  { path: '/todo/:id', component: TodoDetail, 
    guard: () => app.user !== null }
]);

// Navigation
app.navigate('/todos');
app.navigate('/todo/123', { state: { from: 'list' } });

// Listen
app.on('navigate', ({ path, params, state }) => {
  const match = app.match(path);
  if (match) {
    render(match.route.component(match.params), document.body);
  }
});
```

### 6. Animations
```typescript
// Simple animation
await animate(element, {
  transform: ['scale(0)', 'scale(1)'],
  opacity: [0, 1]
}, {
  duration: 300,
  easing: 'ease-out'
});

// Sequence
async function slideIn(elements) {
  for (const [i, el] of elements.entries()) {
    await animate(el, {
      transform: [`translateX(-100%)`, `translateX(0)`]
    }, {
      duration: 200,
      delay: i * 50
    });
  }
}
```

## 🔌 Plugin System

```typescript
// Custom behavior
export function withLocalStorage(key: string): Behavior {
  return (component) => {
    component.onMount = () => {
      const saved = localStorage.getItem(key);
      if (saved) component.state = JSON.parse(saved);
      
      component.subscribe(() => {
        localStorage.setItem(key, JSON.stringify(component.state));
      });
    };
    return component;
  };
}

// Usage
const TodoApp = component({
  behaviors: [
    withState({ todos: [] }),
    withLocalStorage('todos')  // Auto-persist
  ]
});
```

## 📏 Size Budget Per Feature

| Feature | API Methods | Size | Value/KB |
|---------|------------|------|----------|
| Component | 6 | 1KB | High |
| Templates | 3 | 1KB | High |
| State | 2 | 0.5KB | High |
| Events | 4 | 0.5KB | Medium |
| Router | 3 | 0.5KB | Medium |
| Animation | 2 | 0.5KB | Medium |
| **Total** | **20** | **4KB** | **Optimal** |

## ✅ Design Principles Achieved

1. **Minimal API**: 20 total methods (vs 100+ in other frameworks)
2. **Natural JS**: Proxy-based state, template literals
3. **Composable**: Everything built from behaviors
4. **Zero magic**: No compilers, no plugins, no config
5. **Progressive**: Start with 3 functions, scale up as needed

---

**The perfect API: So simple it fits on a napkin, so powerful it can build anything.**