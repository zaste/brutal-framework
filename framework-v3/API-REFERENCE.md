# BRUTAL Framework V3 - API Reference

## Table of Contents
- [Core](#core)
- [Components](#components)
- [Performance](#performance)
- [Visual System](#visual-system)
- [Ecosystem](#ecosystem)
- [Utilities](#utilities)

---

## Core

### BrutalComponent

Base class for all BRUTAL components.

```javascript
import { BrutalComponent } from '@brutal/framework';

class MyComponent extends BrutalComponent {
    constructor() {
        super();
        this.state = {};
    }
    
    render() {
        return `<div>Component HTML</div>`;
    }
}
```

#### Methods

##### `render(): string`
Returns the HTML template for the component.

##### `setState(newState: object): void`
Updates component state and triggers re-render.

##### `connectedCallback(): void`
Called when component is added to DOM.

##### `disconnectedCallback(): void`
Called when component is removed from DOM.

##### `attributeChangedCallback(name: string, oldValue: string, newValue: string): void`
Called when observed attribute changes.

#### Properties

##### `state: object`
Component's reactive state object.

##### `shadowRoot: ShadowRoot`
Component's shadow DOM root.

---

### State Management

#### GlobalState

Centralized state management with publish-subscribe pattern.

```javascript
import { GlobalState } from '@brutal/framework';

const state = new GlobalState({
    user: null,
    theme: 'dark'
});

// Subscribe to changes
state.subscribe('user', (newValue, oldValue) => {
    console.log('User changed:', newValue);
});

// Update state
state.set('user', { name: 'John' });
```

#### Methods

##### `set(key: string, value: any): void`
Sets a state value.

##### `get(key: string): any`
Gets a state value.

##### `subscribe(key: string, callback: Function): Function`
Subscribes to state changes. Returns unsubscribe function.

##### `broadcast(key: string, value: any): void`
Manually broadcasts a state change.

---

### Router

Client-side routing system.

```javascript
import { Router } from '@brutal/framework';

const router = new Router();

router.addRoute('/', () => {
    // Home page logic
});

router.addRoute('/users/:id', (params) => {
    console.log('User ID:', params.id);
});

router.navigate('/users/123');
```

#### Methods

##### `addRoute(path: string, handler: Function): void`
Adds a route with handler.

##### `navigate(path: string): void`
Navigates to a route.

##### `back(): void`
Goes back in history.

##### `forward(): void`
Goes forward in history.

---

## Components

### Button

```html
<brutal-button variant="primary" size="medium" disabled loading>
    Click Me
</brutal-button>
```

#### Attributes
- `variant`: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
- `size`: 'small' | 'medium' | 'large'
- `disabled`: boolean
- `loading`: boolean
- `full-width`: boolean

### Input

```html
<brutal-input 
    type="email" 
    placeholder="Enter email"
    required
    validation="email">
</brutal-input>
```

#### Attributes
- `type`: HTML input types
- `placeholder`: string
- `required`: boolean
- `disabled`: boolean
- `validation`: 'email' | 'url' | 'phone' | 'custom'

### Card

```html
<brutal-card elevated interactive>
    <h3 slot="header">Card Title</h3>
    <p>Card content</p>
    <div slot="footer">Card footer</div>
</brutal-card>
```

#### Attributes
- `elevated`: boolean
- `interactive`: boolean
- `compact`: boolean

### Modal

```html
<brutal-modal title="Confirm Action" open closable>
    <p>Are you sure?</p>
    <button slot="footer">Confirm</button>
</brutal-modal>
```

#### Attributes
- `title`: string
- `open`: boolean
- `closable`: boolean
- `backdrop`: boolean

### Table

```html
<brutal-table 
    columns='[{"key":"name","label":"Name"},{"key":"age","label":"Age"}]'
    data='[{"name":"John","age":30}]'
    sortable
    filterable>
</brutal-table>
```

#### Attributes
- `columns`: JSON array of column definitions
- `data`: JSON array of row data
- `sortable`: boolean
- `filterable`: boolean
- `paginated`: boolean

---

## Performance

### WorkerPool

Manages Web Workers for parallel computing.

```javascript
import { WorkerPool } from '@brutal/framework';

const pool = new WorkerPool({
    workers: 4,
    workerScript: '/worker.js'
});

const result = await pool.execute('heavyTask', { data: largeArray });
```

#### Methods

##### `execute(task: string, data: any): Promise<any>`
Executes task on available worker.

##### `broadcast(message: any): void`
Sends message to all workers.

##### `terminate(): void`
Terminates all workers.

### SharedMemory

Manages SharedArrayBuffer for true parallelism.

```javascript
import { SharedMemory } from '@brutal/framework';

const memory = new SharedMemory(1024 * 1024); // 1MB

// Write data
memory.setFloat32(0, 3.14159);

// Read data
const value = memory.getFloat32(0);
```

---

## Visual System

### ParticleSystem

GPU-accelerated particle system.

```html
<brutal-particle-system 
    particles="1000000"
    colors='["#3b82f6", "#10b981"]'
    speed="1.0">
</brutal-particle-system>
```

#### Attributes
- `particles`: number
- `colors`: JSON array of hex colors
- `speed`: number (0.1 - 10)
- `size`: number (particle size)

### DebugLayer

Visual debugging overlay.

```javascript
import { initDebugger } from '@brutal/framework';

initDebugger({
    showFPS: true,
    showMemory: true,
    show3DTree: true
});
```

---

## Ecosystem

### CacheManager

Multi-level caching system.

```javascript
import { getCacheManager } from '@brutal/framework';

const cache = getCacheManager();

// Set value with TTL
await cache.set('key', value, { ttl: 3600000 });

// Get value
const value = await cache.get('key');

// Get stats
const stats = await cache.getStats();
```

### ComponentGenerator

AI-powered component generation.

```javascript
import { componentGenerator } from '@brutal/framework';

const result = componentGenerator.generate(
    'Create a blue submit button'
);

if (result.success) {
    console.log(result.component); // <brutal-button variant="primary">Submit</brutal-button>
}
```

### PageBuilder

Visual page composition.

```javascript
import { PageBuilder } from '@brutal/framework';

const builder = new PageBuilder({
    components: 'all',
    theme: 'dark'
});

customElements.define('brutal-page-builder', PageBuilder);
```

### ThemeEngine

Dynamic theme management.

```javascript
import { themeEngine } from '@brutal/framework';

// Apply pre-built theme
themeEngine.applyTheme('dark');

// Create custom theme
themeEngine.updateColor('primary', '#ff0080');
themeEngine.updateTypography('fontFamily', 'Inter');

// Export theme
themeEngine.exportTheme();
```

---

## Utilities

### BrutalFramework

Main framework class.

```javascript
import { BrutalFramework } from '@brutal/framework';

// Initialize
await BrutalFramework.init({
    cache: true,
    debug: false,
    theme: 'default',
    gpu: true
});

// Get stats
const stats = BrutalFramework.getStats();

// Create app
const app = BrutalFramework.createApp({
    cache: true
});

app.component('my-component', MyComponent);
app.mount('#app');
```

### Utility Functions

```javascript
import { BrutalFramework } from '@brutal/framework';

const { utils } = BrutalFramework;

// Debounce
const debouncedFn = utils.debounce(fn, 300);

// Throttle
const throttledFn = utils.throttle(fn, 100);

// Deep clone
const clone = utils.deepClone(object);

// Generate ID
const id = utils.generateId('component');

// Format bytes
const formatted = utils.formatBytes(1024); // "1 KB"
```

---

## Events

### Framework Events

```javascript
// Framework ready
window.addEventListener('brutalReady', (e) => {
    console.log('Framework version:', e.detail.version);
});

// Theme changed
document.addEventListener('themeChanged', (e) => {
    console.log('New theme:', e.detail.theme);
});

// Component mounted
element.addEventListener('componentMounted', (e) => {
    console.log('Component ready:', e.detail);
});
```

---

## Best Practices

### Performance

1. **Use Virtual Scrolling** for large lists
```javascript
<brutal-list virtual-scroll items="10000">
```

2. **Enable GPU Acceleration** for visual components
```javascript
<brutal-particle-system gpu="true">
```

3. **Leverage Workers** for heavy computations
```javascript
const pool = new WorkerPool({ workers: navigator.hardwareConcurrency });
```

### Memory Management

1. **Cleanup on Disconnect**
```javascript
disconnectedCallback() {
    this.unsubscribe();
    this.worker?.terminate();
}
```

2. **Use WeakMap** for component references
```javascript
const componentData = new WeakMap();
```

### Bundle Size

1. **Import Only What You Need**
```javascript
// Good
import { Button } from '@brutal/framework/components';

// Avoid
import * as Brutal from '@brutal/framework';
```

---

## Migration Guide

### From React

```javascript
// React
function Button({ onClick, children }) {
    return <button onClick={onClick}>{children}</button>;
}

// BRUTAL
class BrutalButton extends BrutalComponent {
    render() {
        return `<button onclick="this.handleClick()">
            <slot></slot>
        </button>`;
    }
}
```

### From Vue

```javascript
// Vue
<template>
  <button @click="increment">{{ count }}</button>
</template>

// BRUTAL
class Counter extends BrutalComponent {
    render() {
        return `<button onclick="this.increment()">
            ${this.state.count}
        </button>`;
    }
}
```

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+

### Required Features
- Custom Elements v1
- Shadow DOM v1
- ES Modules
- Web Workers
- WebGL 2.0 (optional)
- WebGPU (optional)
- SharedArrayBuffer (optional)

---

## License

MIT © BRUTAL Team