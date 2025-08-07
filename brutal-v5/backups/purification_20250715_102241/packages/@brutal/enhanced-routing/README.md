# @brutal/enhanced-routing

Enhanced routing for BRUTAL framework with guards, transitions, nested routes, and advanced navigation features.

## Installation

```bash
npm install @brutal/enhanced-routing
```

## Features

### 🛡️ Route Guards
- Before enter/leave guards
- Async guard support
- Redirect handling
- Error management

### 🎭 Route Transitions
- Multiple transition modes (in-out, out-in, simultaneous)
- Customizable animations
- Performance optimized
- Cleanup handling

### 🌳 Nested Routing
- Hierarchical route structure
- Parent/child relationships
- Automatic path resolution
- Route inheritance

### 🚀 Advanced Features
- Lazy route loading
- Navigation controller
- Route metadata
- Query parameter handling
- History management

## Usage

```javascript
import { createEnhancedRouter } from '@brutal/enhanced-routing';

// Create router with guards and transitions
const router = createEnhancedRouter({
  defaultTransition: {
    duration: 300,
    mode: 'out-in'
  }
});

// Add guarded route
router.addRoute({
  path: '/admin',
  component: AdminPanel,
  guards: [
    async (context) => {
      const isAuthenticated = await checkAuth();
      return {
        allowed: isAuthenticated,
        redirect: isAuthenticated ? null : '/login'
      };
    }
  ],
  transition: {
    enterClass: 'slide-in',
    leaveClass: 'slide-out'
  }
});

// Nested routes
router.addRoute({
  path: '/products',
  component: ProductLayout,
  children: [
    { path: 'list', component: ProductList },
    { path: ':id', component: ProductDetail },
    { path: ':id/edit', component: ProductEdit }
  ]
});

// Lazy loading
router.addRoute({
  path: '/reports',
  component: lazyRoute(
    () => import('./Reports.js'),
    { 
      loading: LoadingSpinner,
      timeout: 10000 
    }
  )
});

// Navigation
const nav = useNavigation(router);
await nav.push('/products/123', { 
  state: { from: 'list' },
  scroll: { top: 0 }
});

// Route metadata
setRouteMeta('/products', {
  title: 'Products - My App',
  requiresAuth: true,
  roles: ['admin', 'manager']
});
```

## API Reference

See [API.md](./docs/API.md) for detailed API documentation.

## Bundle Size

Current: 15.67KB (gzipped)
Target: 10KB (optimization in progress)

## Testing

```bash
npm test # Tests pending verification
```

## Status

- ✅ Fully implemented
- ⚠️ Tests need verification
- ⚠️ Bundle size optimization needed