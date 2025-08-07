# @brutal/routing

Ultra-lightweight client-side routing library for BRUTAL V5.

## Features

- 🎯 **Tiny Bundle**: Only 1.9KB (minified + gzipped)
- 🚀 **Fast Route Matching**: Regex-based with parameter extraction
- 🛡️ **Navigation Guards**: Before/after hooks with async support
- 📍 **History Modes**: HTML5 History API and hash mode
- 🎨 **Dynamic Parameters**: `/user/:id`, `/post/:id/edit`
- 🔍 **Query Parsing**: Full query string support
- 🔄 **Lazy Loading**: Dynamic imports (optional add-on)
- 🚫 **Zero Dependencies**: Completely standalone

## Installation

```bash
npm install @brutal/routing
```

## Usage

### Basic Router Setup

```javascript
import { createRouter } from '@brutal/routing';

const router = createRouter({
  r: [  // routes
    { p: '/', c: 'Home' },
    { p: '/about', c: 'About' },
    { p: '/user/:id', c: 'User' },
    { p: '/posts/*', c: 'Posts' }
  ]
});

// Navigate
await router.p('/about');  // push
await router.r('/home');   // replace

// Current route
const current = router.c();
console.log(current.p);    // '/about'
console.log(current.q);    // { key: 'value' }
console.log(current.h);    // '#section'
```

### Route Parameters

```javascript
const router = createRouter({
  r: [
    { p: '/user/:id', c: 'UserProfile' },
    { p: '/post/:id/edit', c: 'EditPost' },
    { p: '/files/*', c: 'FileExplorer' }
  ]
});

// Navigate to /user/123
await router.p('/user/123');

// Access params in your component
const current = router.c();
// Extract params manually from path and route pattern
```

### Query Parameters

```javascript
// Navigate with query
await router.p('/search?q=brutal&category=routing');

const current = router.c();
console.log(current.q);  // { q: 'brutal', category: 'routing' }

// Array values
await router.p('/filter?tags=js&tags=ts');
console.log(current.q);  // { tags: ['js', 'ts'] }
```

### Navigation Guards

```javascript
// Global before guard
router.bg((to, from, next) => {
  if (to.p === '/protected' && !isAuthenticated) {
    next('/login');  // redirect
  } else {
    next();  // continue
  }
});

// Route-specific guard
const router = createRouter({
  r: [
    { 
      p: '/admin',
      c: 'AdminPanel',
      g: [(to, from, next) => {
        checkAdminAccess() ? next() : next(false);
      }]
    }
  ]
});

// After navigation hook
router.ag((to, from) => {
  console.log(`Navigated from ${from.p} to ${to.p}`);
  updatePageTitle(to);
});
```

### History Modes

```javascript
// HTML5 History mode (default)
const router = createRouter({
  r: routes,
  m: 'h'  // 'h' for history
});

// Hash mode
const hashRouter = createRouter({
  r: routes,
  m: 'x'  // 'x' for hash (#)
});
```

### Navigation Methods

```javascript
// Push new entry
await router.p('/path');

// Replace current entry
await router.r('/path');

// Go back/forward
router.b();     // back
router.f();     // forward
router.g(-2);   // go back 2
```

## API Reference

### createRouter(options)

Creates a new router instance.

#### Options

- `r` (Route[]): Array of route configurations
- `m` ('h' | 'x'): History mode - 'h' for HTML5, 'x' for hash (default: 'h')

#### Route Configuration

```typescript
interface Route {
  p: string;      // path pattern
  c?: any;        // component
  n?: string;     // name
  g?: Guard[];    // guards
  m?: any;        // meta data
}
```

### Router Instance

- `c()` - Get current route location
- `p(path)` - Push navigation (returns Promise)
- `r(path)` - Replace navigation (returns Promise)
- `g(n)` - Go n steps in history
- `b()` - Go back
- `f()` - Go forward
- `bg(guard)` - Add global before guard (returns unsubscribe function)
- `ag(hook)` - Add after navigation hook (returns unsubscribe function)

### Route Location

```typescript
interface Location {
  p: string;              // path
  q: Query;               // query params
  h: string;              // hash
  r?: Route;              // matched route
}
```

## Advanced Usage

### Named Routes

```javascript
const router = createRouter({
  r: [
    { p: '/', c: 'Home', n: 'home' },
    { p: '/user/:id', c: 'User', n: 'user' },
    { p: '/settings', c: 'Settings', n: 'settings' }
  ]
});

// Access by name
const current = router.c();
if (current.r?.n === 'user') {
  // On user route
}
```

### Async Guards

```javascript
router.bg(async (to, from, next) => {
  try {
    await checkPermissions(to.p);
    next();
  } catch (error) {
    next('/error');
  }
});
```

### Integration with Components

```javascript
// Simple component system
const pages = {
  Home: () => '<h1>Home</h1>',
  About: () => '<h1>About</h1>',
  User: (params) => `<h1>User ${params.id}</h1>`
};

const router = createRouter({
  r: [
    { p: '/', c: pages.Home },
    { p: '/about', c: pages.About },
    { p: '/user/:id', c: pages.User }
  ]
});

// Render on navigation
router.ag((to, from) => {
  const content = to.r?.c?.() || '<h1>404</h1>';
  document.getElementById('app').innerHTML = content;
});
```

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- No IE11 support

## Bundle Size

| Export | Size (min+gzip) |
|--------|-----------------|
| Full bundle | 1.9KB |
| Core only | ~1.5KB |

## TypeScript

Full TypeScript support with type inference:

```typescript
import { createRouter } from '@brutal/routing';
import type { Route, RouteLocation } from '@brutal/routing';

interface AppRoute extends Route {
  c: () => HTMLElement;
  m?: { requiresAuth: boolean };
}

const routes: AppRoute[] = [
  { p: '/', c: HomePage, m: { requiresAuth: false } },
  { p: '/dashboard', c: Dashboard, m: { requiresAuth: true } }
];

const router = createRouter({ r: routes });
```

## Performance

- Regex compilation cached on first match
- No virtual DOM overhead
- Direct History API usage
- Minimal abstraction layers

## Comparison

| Library | Size | Features | Dependencies |
|---------|------|----------|--------------|
| @brutal/routing | 1.9KB | Core + Guards | 0 |
| vue-router | 24KB | Full featured | 1 |
| react-router | 12KB | Core only | 2 |
| page.js | 3.9KB | Basic | 0 |

## License

MIT