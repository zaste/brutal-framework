# Decision: Security-First Development

**Status**: Accepted  
**Date**: 2024-07-11

## Context

Web security vulnerabilities are often introduced through:
- Using innerHTML without sanitization
- eval() or Function() constructors
- Unvalidated user input
- XSS through template injection

## Decision

Enforce security through automated tooling, making insecure code impossible to merge.

## Implementation

### 1. ESLint Security Plugin
```javascript
// @brutal/eslint-plugin-security
export const rules = {
  'no-inner-html': 'error',
  'no-eval': 'error',
  'no-function-constructor': 'error',
  'no-document-write': 'error',
  'require-sanitization': 'error'
};
```

### 2. Safe APIs by Default
```javascript
// Instead of innerHTML
element.textContent = userInput;  // Safe

// Template sanitization built-in
html`<div>${userInput}</div>`;  // Auto-escaped
```

### 3. CI/CD Enforcement
- Security linting required
- SAST scanning on PRs
- Dependency audit automated

## Consequences

✅ **Benefits**:
- XSS prevention by default
- Supply chain security (zero deps)
- Automated enforcement
- Developer education through linting

⚠️ **Considerations**:
- Some legitimate uses blocked
- Need escape hatches (with review)
- Initial setup complexity

## Security Principles

1. **Secure by default** - Safe APIs are easier
2. **Fail loudly** - Security errors block merge
3. **Defense in depth** - Multiple layers
4. **Zero trust** - Validate everything

## References

- OWASP Top 10 considerations
- React's dangerouslySetInnerHTML pattern
- Community security audit feedback