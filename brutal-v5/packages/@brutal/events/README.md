# @brutal/events

> Type-safe event system for BRUTAL V5 framework

[![Version](https://img.shields.io/npm/v/@brutal/events.svg)](https://www.npmjs.com/package/@brutal/events)
[![Size](https://img.shields.io/badge/gzip-3.5KB-green.svg)](https://bundlephobia.com/package/@brutal/events)
[![License](https://img.shields.io/npm/l/@brutal/events.svg)](https://github.com/brutal/v5/blob/main/LICENSE)

## Overview

@brutal/events provides a comprehensive event handling system with:

- 🎯 **Type-safe events** - Full TypeScript support with generics
- 🌟 **Wildcard support** - Listen to all events with `*`
- ⚡ **Event delegation** - Efficient DOM event handling
- 🚌 **Event bus** - Cross-component communication
- 🔄 **Async handlers** - Support for async event handlers
- 📝 **Event history** - Track and replay events
- 🎛️ **Channels** - Isolated event scopes

## Installation

```bash
npm install @brutal/events
```

## Quick Start

```typescript
import { EventEmitter, EventBus, domEvents } from '@brutal/events';

// Type-safe events
interface AppEvents {
  'user:login': { id: string; name: string };
  'data:update': { changes: any[] };
  'app:error': Error;
}

// Create typed emitter
const emitter = new EventEmitter<AppEvents>();

// Listen to events
emitter.on('user:login', (data) => {
  console.log(`User ${data.name} logged in`);
});

// Emit events
emitter.emit('user:login', { id: '123', name: 'John' });

// DOM events with delegation
domEvents.delegate(document.body, 'click', '.button', (e) => {
  console.log('Button clicked!');
});
```

## Core Features

### EventEmitter

The foundation of the event system with full TypeScript support:

```typescript
import { EventEmitter } from '@brutal/events';

interface MyEvents {
  connect: { url: string };
  data: Buffer;
  error: Error;
}

const emitter = new EventEmitter<MyEvents>({
  maxListeners: 100,
  wildcard: true,
  async: false,
  verboseErrors: true
});

// Add listeners
const off = emitter.on('connect', ({ url }) => {
  console.log(`Connected to ${url}`);
});

// Once listeners
emitter.once('error', (err) => {
  console.error('First error:', err);
});

// Wildcard listeners
emitter.on('*', (data, event) => {
  console.log(`Event ${event} fired with:`, data);
});

// Remove listeners
off(); // or emitter.off('connect', handler);

// Emit events
emitter.emit('connect', { url: 'ws://localhost' });

// Async emit
await emitter.emitAsync('data', Buffer.from('hello'));

// Wait for events
const data = await emitter.waitFor('data', 5000);

// Get listener info
console.log(emitter.listenerCount('connect')); // 1
console.log(emitter.eventNames()); // ['connect', 'error', '*']
```

### EventBus

Global event bus for cross-component communication:

```typescript
import { EventBus, globalBus } from '@brutal/events';

// Create custom bus
const bus = new EventBus({
  history: true,
  maxHistory: 100
});

// Use channels for isolation
const userChannel = bus.channel('user');
const dataChannel = bus.channel('data');

// Send messages with metadata
bus.send('message', { text: 'Hello' }, {
  source: 'component-a',
  target: 'component-b'
});

// Track history
const history = bus.getHistory();
history.forEach(({ event, data, timestamp }) => {
  console.log(`[${timestamp}] ${event}:`, data);
});

// Replay events
bus.replay('user:*'); // Replay all user events

// Bridge buses
const otherBus = new EventBus();
bus.bridge(otherBus, ['data:*']); // Forward data events
```

### DOM Event Handling

Efficient DOM event management with delegation:

```typescript
import { domEvents, emit, createEvent } from '@brutal/events';

// Event delegation
const cleanup = domEvents.delegate(
  document.body,
  'click',
  '[data-action]',
  (e) => {
    const action = e.target.dataset.action;
    console.log('Action:', action);
  },
  { 
    capture: false,
    passive: true,
    throttle: 100
  }
);

// Direct event binding
domEvents.on(button, 'click', handler, {
  once: true,
  debounce: 300
});

// Create and dispatch custom events
const event = createEvent('app:ready', {
  version: '1.0.0',
  modules: ['core', 'ui']
});
emit(document, event);

// Emit on elements
emit(element, 'custom:event', { data: 'value' });

// Clean up when done
cleanup();
```

## API Reference

### EventEmitter

```typescript
class EventEmitter<T extends EventMap = EventMap> {
  constructor(options?: EmitterOptions);
  
  // Core methods
  on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): () => void;
  once<K extends keyof T>(event: K, handler: EventHandler<T[K]>): () => void;
  off<K extends keyof T>(event: K, handler?: EventHandler<T[K]>): void;
  emit<K extends keyof T>(event: K, data: T[K]): void;
  emitAsync<K extends keyof T>(event: K, data: T[K]): Promise<void>;
  
  // Utility methods
  listenerCount(event?: keyof T): number;
  eventNames(): (keyof T)[];
  clear(event?: keyof T): void;
  waitFor<K extends keyof T>(event: K, timeout?: number): Promise<T[K]>;
}
```

### EventBus

```typescript
class EventBus<T extends EventMap = EventMap> extends EventEmitter<T> {
  constructor(options?: BusOptions);
  
  // Channel management
  channel<C extends EventMap = EventMap>(name: string): EventEmitter<C>;
  removeChannel(name: string): void;
  
  // Messaging
  send<K extends keyof T>(event: K, data: T[K], metadata?: object): void;
  
  // History
  getHistory(filter?: (entry: HistoryEntry<T>) => boolean): HistoryEntry<T>[];
  clearHistory(): void;
  replay(pattern?: string): void;
  
  // Bridging
  bridge(target: EventBus, events?: string[]): () => void;
}
```

### DOMEventManager

```typescript
class DOMEventManager {
  // Delegation
  delegate(
    element: Element,
    event: string,
    selector: string,
    handler: EventListener,
    options?: DOMEventOptions
  ): () => void;
  
  // Direct binding
  on(
    element: Element,
    event: string,
    handler: EventListener,
    options?: DOMEventOptions
  ): () => void;
}
```

## TypeScript Support

Define your event types for full type safety:

```typescript
// Define event map
interface GameEvents {
  'player:spawn': { id: string; position: [x: number, y: number] };
  'player:move': { id: string; direction: 'up' | 'down' | 'left' | 'right' };
  'game:over': { winner: string; score: number };
  'chat:message': { user: string; text: string; timestamp: number };
}

// Use with emitter
const game = new EventEmitter<GameEvents>();

// TypeScript enforces correct event data
game.emit('player:spawn', { id: '1', position: [0, 0] }); // ✅
game.emit('player:spawn', { id: '1' }); // ❌ Missing position

// Handlers are fully typed
game.on('game:over', (data) => {
  // data is typed as { winner: string; score: number }
  console.log(`Winner: ${data.winner} with ${data.score} points`);
});
```

## Performance

- **Minimal overhead**: Direct handler invocation
- **Event delegation**: Single handler for multiple elements
- **Debounce/throttle**: Built-in rate limiting
- **Memory efficient**: Automatic cleanup and limits
- **Tree-shaking**: Only import what you use

## Examples

### Component Communication

```typescript
// In component A
globalBus.emit('user:selected', { userId: '123' });

// In component B
globalBus.on('user:selected', ({ userId }) => {
  loadUserDetails(userId);
});
```

### Form Validation

```typescript
const form = document.querySelector('form');
const validator = new EventEmitter<{
  'field:valid': { field: string };
  'field:invalid': { field: string; errors: string[] };
  'form:submit': { data: FormData };
}>();

// Listen for validation events
validator.on('field:invalid', ({ field, errors }) => {
  showFieldErrors(field, errors);
});

// Validate on input
domEvents.delegate(form, 'input', 'input', (e) => {
  const field = e.target as HTMLInputElement;
  const errors = validateField(field);
  
  if (errors.length) {
    validator.emit('field:invalid', { field: field.name, errors });
  } else {
    validator.emit('field:valid', { field: field.name });
  }
});
```

### Real-time Updates

```typescript
const updates = new EventBus<{
  'data:update': { type: string; payload: any };
  'connection:state': { connected: boolean };
}>();

// Track connection state
updates.on('connection:state', ({ connected }) => {
  updateUI(connected ? 'online' : 'offline');
});

// Handle data updates
updates.on('data:update', ({ type, payload }) => {
  switch (type) {
    case 'user':
      updateUserData(payload);
      break;
    case 'message':
      addMessage(payload);
      break;
  }
});

// WebSocket integration
ws.onmessage = (e) => {
  const { type, data } = JSON.parse(e.data);
  updates.emit('data:update', { type, payload: data });
};
```

## Best Practices

1. **Type your events**: Always define event interfaces for type safety
2. **Use namespaced events**: Organize events with prefixes (e.g., `user:login`)
3. **Clean up listeners**: Store cleanup functions and call them when done
4. **Limit listener count**: Set reasonable maxListeners to prevent leaks
5. **Use delegation**: For dynamic elements, use event delegation
6. **Async carefully**: Only use async mode when needed for performance

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 14+, Chrome Android

## License

MIT © [BRUTAL Team](https://github.com/brutal)