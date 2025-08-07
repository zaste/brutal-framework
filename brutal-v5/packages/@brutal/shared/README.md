# @brutal/shared

Shared utilities and types for BRUTAL V5 framework. Zero runtime dependencies.

## Installation

```bash
npm install @brutal/shared
```

## Features

- **DOM Utilities**: Type-safe DOM manipulation helpers
- **Shared Types**: Common TypeScript interfaces and types
- **Browser/Node Detection**: Environment and feature detection
- **Utility Functions**: Debounce, throttle, deep clone, and more
- **Zero Dependencies**: No runtime dependencies
- **Tree-shakeable**: Import only what you need
- **< 4KB gzipped**: Entire package under 4KB

## API Reference

### DOM Utilities

```typescript
import { dom, $, createElement, on, delegate } from '@brutal/shared';

// Query elements
const el = $('.my-class');
const els = $('.item', { all: true, root: container });

// Create elements
const button = createElement('button', {
  class: ['btn', 'primary'],
  onclick: () => console.log('clicked'),
  data: { action: 'submit' }
}, ['Click me']);

// Event handling
const off = on(element, 'click', handler);
off(); // Remove listener

// Event delegation
delegate(container, 'click', '.btn', (e, target) => {
  console.log('Button clicked:', target);
});

// Class manipulation
dom.addClass(el, 'active', 'highlight');
dom.removeClass(el, 'disabled');
dom.toggleClass(el, 'open');

// Attributes
dom.attr(el, 'data-id', '123');
const id = dom.attr(el, 'data-id');

// Content
dom.html(el, '<p>New content</p>');
dom.text(el, 'Plain text');
dom.empty(el);

// Visibility
dom.show(el);
dom.hide(el);

// Dimensions
const dims = dom.dimensions(el);
// { width, height, top, left, right, bottom }

// Viewport check
if (dom.isInViewport(el)) {
  // Element is visible in viewport
}
```

### Shared Types

```typescript
import type {
  ComponentOptions,
  LifecycleHooks,
  RouteDefinition,
  VNode,
  Plugin
} from '@brutal/shared';

// Component definition
const component: ComponentOptions = {
  name: 'MyComponent',
  props: { title: String },
  state: { count: 0 },
  hooks: {
    onMount() {
      console.log('Mounted');
    }
  }
};

// Type guards
import { isString, isNumber, isObject, isPromise } from '@brutal/shared';

if (isString(value)) {
  // value is string
}
```

### Utility Functions

```typescript
import { utils } from '@brutal/shared';

// Environment detection
if (utils.isBrowser) {
  // Running in browser
}

// Unique IDs
const id = utils.uniqueId('item'); // item_1_abc123

// Function utilities
const debouncedSave = utils.debounce(save, 300);
const throttledScroll = utils.throttle(onScroll, 100);

// Object utilities
const cloned = utils.deepClone(obj);
const merged = utils.deepMerge(target, source1, source2);

// Path utilities
const value = utils.getPath(obj, 'user.address.city');
utils.setPath(obj, 'user.name', 'John');

// String utilities
utils.camelCase('foo-bar'); // fooBar
utils.kebabCase('fooBar'); // foo-bar
utils.capitalize('hello'); // Hello

// Array utilities
utils.last([1, 2, 3]); // 3
utils.chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
utils.shuffle([1, 2, 3, 4, 5]); // [3, 1, 5, 2, 4]

// Promise utilities
await utils.sleep(1000); // Wait 1 second
await utils.nextTick(); // Next microtask
await utils.timeout(promise, 5000); // Timeout after 5s

// URL utilities
const params = utils.parseQuery('?foo=bar&baz=qux');
// { foo: 'bar', baz: 'qux' }

const query = utils.stringifyQuery({ foo: 'bar', baz: 123 });
// 'foo=bar&baz=123'
```

### Constants

```typescript
import { 
  EVENTS,
  DOM_EVENTS,
  ATTRS,
  SYMBOLS,
  ERROR_CODES
} from '@brutal/shared';

// Framework events
window.addEventListener(EVENTS.COMPONENT_MOUNT, handler);

// Data attributes
element.setAttribute(ATTRS.COMPONENT, 'Button');

// Error handling
throw new Error(ERROR_CODES.COMPONENT_NOT_FOUND);
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 14+, Chrome Android

## License

MIT

## Contributing

See the main BRUTAL V5 repository for contribution guidelines.