# Pattern: Template Compilation with Caching

## Problem
Template literal processing faces challenges:
- Repeated parsing of same templates
- Inefficient string concatenation
- XSS vulnerabilities from user input
- Performance overhead with complex templates

## Solution
Implement template compilation with aggressive caching, type-aware interpolation, and automatic sanitization.

## V4 Implementation

### Core Template Function
```javascript
export function html(strings, ...values) {
  const startTime = performance.now();
  
  // Create cache key from static strings
  const cacheKey = strings.join('{{}}');
  
  // Check cache first
  const cached = getTemplateCache(cacheKey);
  if (cached) {
    return interpolateTemplate(
      cached.template.cloneNode(true), 
      values, 
      cached.placeholders
    );
  }
  
  // Process template
  let htmlString = '';
  const placeholders = [];
  
  for (let i = 0; i < strings.length; i++) {
    htmlString += strings[i];
    
    if (i < values.length) {
      const placeholder = createPlaceholder(i, values[i]);
      placeholders.push(placeholder);
      htmlString += placeholder.marker;
    }
  }
  
  // Create and cache template
  const template = document.createElement('template');
  template.innerHTML = htmlString;
  
  setTemplateCache(cacheKey, {
    template: template.cloneNode(true),
    placeholders: placeholders,
    created: Date.now(),
    hits: 0
  });
  
  return interpolateTemplate(template, values, placeholders);
}
```

### Type-Aware Interpolation
```javascript
export function createPlaceholder(index, value) {
  const marker = `__BRUTAL_PLACEHOLDER_${index}__`;
  
  // Detect value type for optimized handling
  let type = 'text';
  
  if (value && typeof value === 'object') {
    if (value instanceof HTMLElement) {
      type = 'element';
    } else if (value instanceof DocumentFragment) {
      type = 'fragment';
    } else if (typeof value.then === 'function') {
      type = 'promise';
    } else if (Array.isArray(value)) {
      type = 'array';
    } else if (value.__brutal_raw) {
      type = 'raw'; // Unsafe HTML
    }
  } else if (typeof value === 'function') {
    type = 'function';
  } else if (typeof value === 'boolean') {
    type = 'boolean';
  }
  
  return { index, marker, type, value };
}

function processValue(value, type) {
  switch (type) {
    case 'text':
      // Auto-escape for safety
      return escapeHtml(String(value));
      
    case 'element':
    case 'fragment':
      // Return outerHTML for elements
      return value.outerHTML || '';
      
    case 'array':
      // Process each item
      return value.map(v => processValue(v, detectType(v))).join('');
      
    case 'boolean':
      // For attributes
      return value ? 'true' : '';
      
    case 'function':
      // Event handlers
      return `brutal-event-${registerEventHandler(value)}`;
      
    case 'promise':
      // Async rendering
      return `<brutal-async id="${registerPromise(value)}"></brutal-async>`;
      
    case 'raw':
      // Dangerous - only for trusted content
      return value.value;
      
    default:
      return escapeHtml(String(value));
  }
}
```

### Template Cache Management
```javascript
const templateCache = new Map();
const MAX_CACHE_SIZE = 500;

export function getTemplateCache(key) {
  const cached = templateCache.get(key);
  if (cached) {
    cached.hits++;
    cached.lastUsed = Date.now();
    return cached;
  }
  return null;
}

export function setTemplateCache(key, data) {
  // LRU eviction if needed
  if (templateCache.size >= MAX_CACHE_SIZE) {
    const oldest = [...templateCache.entries()]
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed)[0];
    templateCache.delete(oldest[0]);
  }
  
  templateCache.set(key, {
    ...data,
    lastUsed: Date.now()
  });
}
```

## Key Patterns

### 1. Static String Caching
```javascript
// Templates with same structure share compiled version
const template1 = html`<div>${name}</div>`; // Cached
const template2 = html`<div>${other}</div>`; // Cache hit!
```

### 2. Type-Specific Processing
```javascript
// Different types handled differently
html`
  ${text}                    <!-- Escaped -->
  ${element}                 <!-- Inserted as DOM -->
  ${array}                   <!-- Each item processed -->
  ${onClick}                 <!-- Event handler -->
  ${promise}                 <!-- Async placeholder -->
  ${raw('<b>trusted</b>')}   <!-- Unescaped (dangerous!) -->
`;
```

### 3. Placeholder Markers
```javascript
// Use markers for efficient replacement
'<div>__BRUTAL_PLACEHOLDER_0__</div>'
// Later replaced with actual values
```

### 4. Security by Default
```javascript
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// All text values auto-escaped unless marked raw
```

## Performance Optimizations

### 1. Template Cloning
```javascript
// Clone cached template instead of re-parsing
const fresh = cached.template.cloneNode(true);
```

### 2. Lazy Evaluation
```javascript
// Values only processed when needed
if (placeholder.type === 'function' && isEventAttribute) {
  // Register handler only for events
}
```

### 3. Batch Processing
```javascript
// Process all placeholders in one pass
const fragment = document.createDocumentFragment();
placeholders.forEach(p => processPlaceholder(p, fragment));
```

## Usage Example

```javascript
class MyComponent extends BrutalComponent {
  render() {
    const items = ['A', 'B', 'C'];
    const showDetails = true;
    
    return html`
      <div class="container">
        <h1>${this.title}</h1>
        
        ${showDetails && html`
          <details>
            <summary>Items (${items.length})</summary>
            <ul>
              ${items.map(item => html`
                <li onclick=${() => this.select(item)}>${item}</li>
              `)}
            </ul>
          </details>
        `}
        
        <footer>
          ${this.renderFooter()}
        </footer>
      </div>
    `;
  }
}
```

## Evolution

### V3 Issues
- String concatenation based
- No caching
- Manual escaping required

### V4 Improvements
- Template element based
- Aggressive caching
- Type-aware processing
- Auto-escaping

### V5 Enhancements
- Compiled templates (no parsing)
- Streaming support
- Better async handling
- Directive system

## Trade-offs

✅ **Benefits**:
- Fast after first render
- Memory efficient (shared templates)
- Secure by default
- Familiar syntax

⚠️ **Considerations**:
- Initial parse cost
- Cache memory usage
- Complexity for edge cases

## References
- V4: `/brutal-v4/core/templates/html.js`
- V4: `/brutal-v4/core/templates/interpolation.js`
- V4: `/brutal-v4/core/templates/cache.js`

---

*Cache once, render everywhere.*