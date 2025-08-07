# @brutal/components

Ultra-lightweight Web Components library with reactive state management for BRUTAL V5.

## Features

- 🎯 **< 8KB minified** - Incredibly small footprint
- ⚡ **Web Components based** - Native browser APIs
- 🔄 **Reactive state management** - Automatic re-rendering
- 🎨 **Shadow DOM support** - Encapsulated styles
- 📦 **Zero dependencies** (except @brutal packages)
- 🛠️ **TypeScript support** - Full type safety

## Installation

```bash
npm install @brutal/components
```

## Usage

### Basic Component

```javascript
import { Component, component } from '@brutal/components';

@component('my-counter', {
  template: `
    <button>Count: {{count}}</button>
  `,
  styles: `
    button {
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  `
})
export class Counter extends Component {
  constructor() {
    super();
    this.attachShadow();
  }
  
  mounted() {
    this.set({ count: 0 });
    
    this.$('button').addEventListener('click', () => {
      this.set({ count: this.s.count + 1 });
    });
  }
}
```

### Using Props

```javascript
@component('user-card', {
  props: {
    name: { type: 'string', default: 'Anonymous' },
    age: { type: 'number', default: 0 },
    active: { type: 'boolean', default: false }
  },
  template: `
    <div class="card {{#if active}}active{{/if}}">
      <h3>{{name}}</h3>
      <p>Age: {{age}}</p>
    </div>
  `
})
export class UserCard extends Component {
  constructor() {
    super();
    this.attachShadow();
  }
}

// Usage in HTML
<user-card name="John" age="30" active></user-card>
```

### State Management

```javascript
class TodoList extends Component {
  mounted() {
    // Initialize state
    this.set({
      todos: [],
      filter: 'all'
    });
  }
  
  addTodo(text) {
    // Update state immutably
    this.set(prev => ({
      todos: [...prev.todos, { id: Date.now(), text, done: false }]
    }));
  }
  
  toggleTodo(id) {
    this.set(prev => ({
      todos: prev.todos.map(todo =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    }));
  }
}
```

### Lifecycle Hooks

```javascript
class MyComponent extends Component {
  // Called before first render
  beforeMount() {
    console.log('Component will mount');
  }
  
  // Called after first render
  mounted() {
    console.log('Component mounted');
    // Setup event listeners, timers, etc.
  }
  
  // Called before each update
  beforeUpdate() {
    console.log('Component will update');
  }
  
  // Called after each update
  updated() {
    console.log('Component updated');
  }
}
```

### Event Handling

```javascript
class EventExample extends Component {
  mounted() {
    // Component events
    this.on('custom-event', (data) => {
      console.log('Received:', data);
    });
    
    // Emit events
    this.emit('custom-event', { message: 'Hello' });
    
    // DOM events
    this.$('button')?.addEventListener('click', () => {
      this.emit('button-clicked');
    });
  }
}
```

## Built-in Components

### Button

```javascript
import { Button } from '@brutal/components';

// Usage
<b-btn variant="primary" size="lg">Click me</b-btn>
<b-btn variant="secondary" disabled>Disabled</b-btn>
<b-btn variant="danger" loading>Loading...</b-btn>
```

Props:
- `variant`: 'primary' | 'secondary' | 'danger' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean
- `loading`: boolean
- `type`: 'button' | 'submit' | 'reset'

### Input

```javascript
import { Input } from '@brutal/components';

// Usage
<b-input
  type="email"
  placeholder="Enter email"
  value="user@example.com"
  error="Invalid email"
></b-input>
```

Props:
- `type`: Input type (text, email, password, etc.)
- `value`: Current value
- `placeholder`: Placeholder text
- `disabled`: boolean
- `readonly`: boolean
- `required`: boolean
- `pattern`: Validation pattern
- `error`: Error message

Events:
- `input`: Fired on input
- `change`: Fired on change
- `blur`: Fired on blur
- `focus`: Fired on focus

### Modal

```javascript
import { Modal } from '@brutal/components';

// Usage
<b-modal open title="Confirm Action">
  <p>Are you sure you want to proceed?</p>
  <div slot="footer">
    <button>Cancel</button>
    <button>Confirm</button>
  </div>
</b-modal>
```

Props:
- `open`: boolean - Whether modal is visible
- `title`: string - Modal title
- `size`: 'sm' | 'md' | 'lg'

Events:
- `close`: Fired when modal is closed
- `open`: Fired when modal opens

## DOM Utilities

```javascript
class MyComponent extends Component {
  mounted() {
    // Query single element
    const button = this.$('button');
    
    // Query all elements
    const items = this.$$('.item');
    
    // Class manipulation
    this.addClass('active');
    this.removeClass('loading');
    this.toggleClass('visible');
    const hasClass = this.hasClass('active');
    
    // Style manipulation
    this.setStyle({
      color: 'red',
      fontSize: '16px'
    });
  }
}
```

## Template Syntax

Templates use @brutal/templates syntax:

```html
<!-- Interpolation -->
<div>{{message}}</div>

<!-- Conditionals -->
{{#if isVisible}}
  <p>Visible content</p>
{{#else}}
  <p>Hidden content</p>
{{/if}}

<!-- Loops -->
{{#for item in items}}
  <li>{{item.name}}</li>
{{/for}}

<!-- Each with index -->
{{#each item, index in items}}
  <li>{{index}}: {{item}}</li>
{{/each}}
```

## Advanced Usage

### Custom Elements

```javascript
// Define without decorator
customElements.define('my-element', class extends Component {
  template = '<h1>Hello {{name}}!</h1>';
  
  mounted() {
    this.set({ name: 'World' });
  }
});
```

### Composition

```javascript
// Compose components
class AppLayout extends Component {
  template = `
    <header>
      <nav-bar></nav-bar>
    </header>
    <main>
      <slot></slot>
    </main>
    <footer>
      <app-footer></app-footer>
    </footer>
  `;
}
```

## Performance Tips

1. **Use Shadow DOM** for style encapsulation
2. **Batch state updates** when possible
3. **Use event delegation** for dynamic lists
4. **Lazy load** components when needed
5. **Minimize template complexity**

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

Requires native Web Components support.

## Size Budget

- **Minified**: < 8KB
- **Gzipped**: < 3KB
- **With all components**: < 8KB total

## API Reference

### Component Class

#### Properties
- `state` (s): Component state object
- `props` (p): Component props object

#### Methods
- `set(updates)`: Update state
- `emit(event, data)`: Emit custom event
- `on(event, handler)`: Listen to events
- `$(selector)`: Query single element
- `$$(selector)`: Query all elements
- `render()` (u): Force re-render

#### Lifecycle Hooks
- `beforeMount()` (bm)
- `mounted()` (mo)
- `beforeUpdate()` (bu)
- `updated()` (up)

### Decorator
- `@component(tag, options)`: Define a component

## Contributing

See the main BRUTAL V5 contributing guide.

## License

MIT