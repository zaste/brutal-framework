# @brutal/routing Examples

## Basic Usage

### Simple Example

```typescript
import { ExampleFeature } from '@brutal/routing';

const feature = new ExampleFeature();
const result = await feature.execute('Hello World');

console.log(result); 
// { success: true, data: "Processed: Hello World" }
```

### With Options

```typescript
import { ExampleFeature } from '@brutal/routing';

const feature = new ExampleFeature({
  debug: true,
  maxRetries: 5
});

const result = await feature.execute('test');
// Console: [routing] Executing with: test
```

## Advanced Usage

### Error Handling

```typescript
import { ExampleFeature } from '@brutal/routing';

const feature = new ExampleFeature();

try {
  const result = await feature.execute('input');
  
  if (!result.success) {
    console.error('Operation failed:', result.error?.message);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### Batch Processing

```typescript
import { ExampleFeature } from '@brutal/routing';

const feature = new ExampleFeature();
const inputs = ['one', 'two', 'three'];

const results = await Promise.all(
  inputs.map(input => feature.execute(input))
);

const successful = results.filter(r => r.success);
console.log(`Processed ${successful.length} items successfully`);
```

## Integration Examples

### With Other BRUTAL Packages

```typescript
import { ExampleFeature } from '@brutal/routing';
import { EventEmitter } from '@brutal/events';

class ProcessingService extends EventEmitter {
  private feature = new ExampleFeature();

  async process(input: string): Promise<void> {
    this.emit('processing:start', { input });
    
    const result = await this.feature.execute(input);
    
    if (result.success) {
      this.emit('processing:success', result.data);
    } else {
      this.emit('processing:error', result.error);
    }
  }
}
```

### In a Web Component

```typescript
import { ExampleFeature } from '@brutal/routing';
import { BrutalComponent } from '@brutal/components';

class MyComponent extends BrutalComponent {
  private feature = new ExampleFeature();

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    
    const result = await this.feature.execute(this.getAttribute('data') || '');
    
    if (result.success) {
      this.render(result.data);
    }
  }
}
```

## Common Patterns

### Singleton Instance

```typescript
import { ExampleFeature } from '@brutal/routing';

let instance: ExampleFeature;

export function getFeature(): ExampleFeature {
  if (!instance) {
    instance = new ExampleFeature();
  }
  return instance;
}
```

### With Retry Logic

```typescript
import { ExampleFeature } from '@brutal/routing';

async function executeWithRetry(
  input: string,
  maxAttempts = 3
): Promise<ExampleResult> {
  const feature = new ExampleFeature();
  
  for (let i = 0; i < maxAttempts; i++) {
    const result = await feature.execute(input);
    
    if (result.success || i === maxAttempts - 1) {
      return result;
    }
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
  }
  
  return { success: false, error: new Error('Max retries exceeded') };
}
```

## Performance Tips

1. **Reuse instances** - Create once, use many times
2. **Batch operations** - Use Promise.all for parallel processing
3. **Handle errors** - Always check result.success
4. **Enable debug** - Only in development mode

## Troubleshooting

### Common Issues

**Issue**: "maxRetries must be non-negative"
```typescript
// ❌ Wrong
new ExampleFeature({ maxRetries: -1 });

// ✅ Correct
new ExampleFeature({ maxRetries: 3 });
```

**Issue**: Operations timing out
```typescript
// Add timeout handling
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

// Future API will support:
// feature.execute(input, { signal: controller.signal });
```
