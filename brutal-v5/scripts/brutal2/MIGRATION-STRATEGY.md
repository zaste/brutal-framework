# 🔄 Migration Strategy: V5 → @brutal2
*Smooth transition, zero breakage*

## 📊 Migration Overview

### Approach Options
1. **Big Bang**: Replace everything at once ❌
2. **Gradual**: Component by component ✅
3. **Parallel**: Run both versions ✅

### Recommended: Gradual + Parallel
- Keep V5 running
- Migrate component by component
- Use adapter pattern for interop
- Deprecate V5 after full migration

## 🛠️ Migration Tools

### 1. Automated Migrator
```typescript
// @brutal2/migrate
export function migrate(v5Component) {
  // Analyze V5 component
  const analysis = analyze(v5Component);
  
  // Generate V2 equivalent
  return component({
    name: analysis.name,
    state: analysis.state,
    behaviors: [
      ...analysis.lifecycle && withLifecycle(analysis.lifecycle),
      ...analysis.methods && withEvents(analysis.methods)
    ],
    render: () => html`${analysis.template}`
  });
}
```

### 2. Compatibility Layer
```typescript
// @brutal2/compat
// Makes V2 components work in V5 apps
export function toV5(v2Component) {
  return class extends V5Component {
    constructor() {
      super();
      Object.assign(this, v2Component);
    }
  };
}

// Makes V5 components work in V2 apps
export function toV2(V5Component) {
  return migrate(V5Component);
}
```

### 3. Codemod Scripts
```bash
# Transform imports
npx @brutal2/codemod imports
# Before: import { Component } from '@brutal/components'
# After:  import { component } from '@brutal2'

# Transform classes
npx @brutal2/codemod classes
# Before: class Button extends Component { }
# After:  const Button = component({ })

# Transform templates
npx @brutal2/codemod templates
# Before: compile(`<div>${this.state.count}</div>`)
# After:  html`<div>${this.state.count}</div>`
```

## 📝 Migration Patterns

### Components

#### V5 Pattern
```typescript
import { Component } from '@brutal/components';

export class Counter extends Component {
  state = { count: 0 };
  
  increment() {
    this.state.count++;
  }
  
  decrement() {
    this.state.count--;
  }
  
  render() {
    return `
      <div class="counter">
        <button onclick="${this.decrement}">-</button>
        <span>${this.state.count}</span>
        <button onclick="${this.increment}">+</button>
      </div>
    `;
  }
}
```

#### V2 Pattern
```typescript
import { component, html } from '@brutal2';

export const Counter = component({
  state: { count: 0 },
  
  render() {
    return html`
      <div class="counter">
        <button @click=${() => this.state.count--}>-</button>
        <span>${this.state.count}</span>
        <button @click=${() => this.state.count++}>+</button>
      </div>
    `;
  }
});
```

#### Using Migrator
```typescript
import { migrate } from '@brutal2/migrate';
import { Counter as V5Counter } from './old/Counter';

export const Counter = migrate(V5Counter);
```

### State Management

#### V5 Pattern
```typescript
import { createStore } from '@brutal/state';

const store = createStore({
  todos: [],
  filter: 'all'
});

store.subscribe((state) => {
  console.log('State changed:', state);
});

store.dispatch({ type: 'ADD_TODO', payload: { text: 'New' } });
```

#### V2 Pattern  
```typescript
import { store } from '@brutal2/state';

const app = store({
  todos: [],
  filter: 'all'
});

app.subscribe((changes) => {
  console.log('Changed:', changes);
});

// Direct assignment!
app.todos = [...app.todos, { text: 'New' }];
```

### Templates

#### V5 Pattern
```typescript
import { compile } from '@brutal/templates';

const template = compile(`
  <ul>
    ${items.map(item => `
      <li class="${item.done ? 'done' : ''}">
        ${item.text}
      </li>
    `).join('')}
  </ul>
`);
```

#### V2 Pattern
```typescript
import { html } from '@brutal2';

const template = html`
  <ul>
    ${items.map(item => html`
      <li class=${item.done ? 'done' : ''}>
        ${item.text}
      </li>
    `)}
  </ul>
`;
```

### Events

#### V5 Pattern
```typescript
import { EventBus } from '@brutal/events';

const bus = new EventBus();
bus.on('user:login', (user) => { });
bus.emit('user:login', { id: 1 });
```

#### V2 Pattern
```typescript
import { events } from '@brutal2/events';

events.on('user:login', (user) => { });
events.emit('user:login', { id: 1 });
```

## 🚦 Migration Phases

### Phase 1: Setup (Day 1)
```bash
# Install alongside V5
npm install @brutal2

# Add compatibility layer
npm install @brutal2/compat

# Install migration tools
npm install -D @brutal2/migrate
```

### Phase 2: Leaf Components (Days 2-3)
Start with components that have no dependencies:
- Buttons
- Inputs  
- Cards
- Lists

```typescript
// Keep both versions during transition
export { Button as ButtonV5 } from './v5/Button';
export { Button } from './v2/Button';
```

### Phase 3: State Layer (Day 4)
Migrate stores and state management:
```typescript
// Adapter pattern
const v2store = store(initialState);
const v5store = createV5Store(initialState);

// Sync both stores
v2store.subscribe(changes => {
  v5store.dispatch({ type: 'SYNC', payload: changes });
});
```

### Phase 4: Routes & Features (Day 5)
Migrate page components and routes:
```typescript
// Gradual route migration
const router = createRouter([
  { path: '/', component: HomeV2 },        // New
  { path: '/about', component: AboutV5 },  // Old
  { path: '/user/:id', component: UserV2 } // New
]);
```

### Phase 5: Cleanup (Day 6)
- Remove V5 dependencies
- Delete compatibility layers
- Update build configs
- Final testing

## 📋 Migration Checklist

### Pre-Migration
- [ ] Audit current V5 usage
- [ ] Identify custom patterns
- [ ] Plan component order
- [ ] Setup parallel builds
- [ ] Create rollback plan

### During Migration
- [ ] Run migrator on each component
- [ ] Test each migration
- [ ] Update imports gradually
- [ ] Keep both versions working
- [ ] Document any issues

### Post-Migration  
- [ ] Remove V5 packages
- [ ] Clean up adapters
- [ ] Update documentation
- [ ] Performance testing
- [ ] Bundle size check

## ⚡ Quick Wins

### 1. New Features Use V2
All new components use @brutal2 immediately

### 2. Critical Path First
Migrate performance-critical components first

### 3. Team Training
Quick training on V2 patterns:
```typescript
// 30 minute session covers:
- component() instead of class
- html`` instead of compile()  
- Direct state assignment
- Composition patterns
```

## 🆘 Common Issues & Solutions

### Issue: Complex Class Hierarchies
```typescript
// V5: Deep inheritance
class Base extends Component { }
class FormBase extends Base { }
class Input extends FormBase { }

// V2: Composition
const Input = component({
  behaviors: [
    withValidation(),
    withFormIntegration(),
    withAccessibility()
  ]
});
```

### Issue: Middleware Patterns
```typescript
// V5: Redux-like middleware
store.use(logger);
store.use(devtools);

// V2: Simple subscriptions
if (dev) store.subscribe(console.log);
store.subscribe(syncToDevtools);
```

### Issue: Complex Templates
```typescript
// Use template partials
const TodoItem = (todo) => html`<li>${todo.text}</li>`;
const TodoList = (todos) => html`
  <ul>${todos.map(TodoItem)}</ul>
`;
```

## 🎯 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Bundle Size | -50% | 35KB → 17KB |
| Performance | +20% | Lighthouse score |
| Code Lines | -60% | 4000 → 1600 |
| API Surface | -70% | 100 → 30 methods |
| Migration Time | 6 days | Track daily |

## 💡 Final Tips

1. **Start small**: One component at a time
2. **Test heavily**: Each migration step
3. **Keep shipping**: Don't stop feature work
4. **Communicate**: Team knows the plan
5. **Celebrate**: Each successful migration

---

**Migration is a journey, not a sprint. Take it component by component, and soon you'll have a cleaner, faster, smaller codebase.**