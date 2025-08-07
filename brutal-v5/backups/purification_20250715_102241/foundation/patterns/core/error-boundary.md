# Error Boundary Pattern

## Problem
Component errors can crash entire applications. JavaScript's error propagation makes it difficult to isolate failures to specific components.

## Solution
Component-level error boundaries that catch and contain errors, preventing them from propagating and crashing the application.

### Error Boundary Implementation
```typescript
// error-boundary.ts
export class ErrorBoundary extends BaseComponent {
  private fallback?: () => HTMLElement;
  private errorHandler?: (error: Error) => void;
  
  constructor() {
    super();
    this.attachErrorHandling();
  }
  
  private attachErrorHandling() {
    // Catch all errors in this component tree
    this.addEventListener('error', (event) => {
      event.stopPropagation();
      this.handleError(event.error);
    }, true);
    
    // Catch unhandled promise rejections
    this.addEventListener('unhandledrejection', (event) => {
      event.stopPropagation();
      this.handleError(event.reason);
    }, true);
  }
  
  handleError(error: Error) {
    console.error('Component error:', error);
    
    // Call custom error handler if provided
    this.errorHandler?.(error);
    
    // Render fallback UI
    if (this.fallback) {
      this.innerHTML = '';
      this.appendChild(this.fallback());
    } else {
      this.renderDefaultError(error);
    }
    
    // Report to monitoring if configured
    if (__PROFILE__.features.errorReporting) {
      this.reportError(error);
    }
  }
  
  renderDefaultError(error: Error) {
    this.innerHTML = `
      <div class="error-boundary">
        <h2>Something went wrong</h2>
        ${__DEV__ ? `<pre>${error.stack}</pre>` : ''}
      </div>
    `;
  }
}
```

### Usage Pattern
```typescript
// Wrap risky components
class RiskyComponent extends ErrorBoundary {
  fallback = () => {
    const div = document.createElement('div');
    div.textContent = 'Failed to load component';
    return div;
  };
  
  errorHandler = (error: Error) => {
    // Custom error handling
    analytics.track('component_error', {
      component: this.tagName,
      error: error.message
    });
  };
}
```

### Error Isolation Levels
1. **Component Level**: Errors in component lifecycle
2. **Event Level**: Errors in event handlers
3. **Async Level**: Unhandled promise rejections
4. **Render Level**: Errors during template rendering

## Evolution
- V3: Global error handlers only
- V4: Basic try-catch in components
- V5: Full error boundary system

## Trade-offs
- ✅ Fault isolation
- ✅ Graceful degradation
- ✅ Better user experience
- ✅ Error tracking built-in
- ❌ Additional complexity
- ❌ Memory overhead for error handling

## Related
- [Component Lifecycle](./component-lifecycle.md)
- [Quality Gates](../quality/quality-gates.md)
- [Environment Profiles](../architecture/environment-profiles.md)