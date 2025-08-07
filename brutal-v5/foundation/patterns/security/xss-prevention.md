# XSS Prevention Pattern

## Problem
Cross-site scripting (XSS) vulnerabilities are common in web applications when user input is rendered without proper sanitization.

## Solution
Multi-layered defense against XSS through safe-by-default APIs, automatic sanitization, and compile-time enforcement.

### Safe Template System
```javascript
// Auto-escaping in templates
export function html(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const value = values[i - 1];
    // Automatic HTML escaping
    const escaped = escapeHtml(value);
    return result + escaped + str;
  });
}

// Usage - automatically safe
html`<div>${userInput}</div>`; // Escaped
html`<div>$${trustedHtml}</div>`; // Double $ for trusted
```

### ESLint Security Rules
```javascript
// Prevent dangerous patterns
module.exports = {
  rules: {
    'no-inner-html': 'error',
    'no-document-write': 'error',
    'no-eval': 'error',
    'no-function-constructor': 'error',
    'require-sanitization': 'error'
  }
};
```

### Content Security Policy
```javascript
// Strict CSP headers
const CSP = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'strict-dynamic'"],
  'style-src': ["'self'", "'unsafe-inline'"], // For CSS-in-JS
  'img-src': ["'self'", 'data:', 'https:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"]
};
```

### Input Validation
```javascript
// Validate and sanitize all inputs
class InputSanitizer {
  static text(input) {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  
  static url(input) {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid URL protocol');
    }
    return url.toString();
  }
}
```

## Evolution
- V3: Manual escaping, some vulnerabilities
- V4: Better practices, incomplete coverage
- V5: Automatic prevention, enforced by tooling

## Trade-offs
- ✅ XSS impossible with normal APIs
- ✅ Developer-friendly safe defaults
- ✅ Compile-time enforcement
- ❌ Trusted HTML requires explicit marking
- ❌ Some legitimate uses need workarounds

## Related
- [Security-First Design](./security-first-design.md)
- [Template Compilation](../core/template-compilation.md)
- [Automated Quality Gates](../quality/automated-quality-gates.md)