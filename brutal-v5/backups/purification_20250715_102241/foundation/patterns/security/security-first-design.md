# Pattern: Security-First Design

## Problem
Web frameworks often treat security as an afterthought:
- Vulnerabilities discovered post-release
- Unsafe defaults for convenience
- Security features opt-in rather than opt-out
- Dependency vulnerabilities inherited

## Solution
Build security into every layer of the framework from the beginning, with safe defaults and zero-tolerance for vulnerabilities.

## Implementation

### Zero Runtime Dependencies
```json
{
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "eslint-plugin-security": "^1.7.0"
  }
}

// Result: No supply chain attacks possible
```

### Secure by Default

#### Automatic Sanitization
```javascript
// All user content sanitized automatically
export function html(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const value = values[i - 1];
    
    // Auto-escape unless explicitly marked safe
    const sanitized = value?.__brutal_raw 
      ? value.value 
      : escapeHtml(value);
      
    return result + sanitized + str;
  });
}

// Explicit unsafe marking required
const userContent = "<script>alert('xss')</script>";
html`<div>${userContent}</div>`; // Escaped
html`<div>${raw(trustedContent)}</div>`; // Not escaped
```

#### CSP Compatible
```javascript
// No inline scripts or eval
export class Component {
  constructor() {
    // ❌ Never use eval
    // eval(code);
    
    // ❌ Never use Function constructor
    // new Function(code);
    
    // ✅ Use safe alternatives
    this.eventHandlers = new Map();
  }
}

// Framework generates CSP headers
generateCSP() {
  return {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"], // For CSS-in-JS
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"]
  };
}
```

### Input Validation

#### Type-Safe Validation
```typescript
interface ValidationRule<T> {
  validate(value: unknown): value is T;
  sanitize?(value: T): T;
}

// Built-in validators
const validators = {
  email: {
    validate: (v): v is string => 
      typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    sanitize: (v) => v.toLowerCase().trim()
  },
  
  url: {
    validate: (v): v is string => {
      try {
        new URL(v);
        return true;
      } catch {
        return false;
      }
    },
    sanitize: (v) => new URL(v).toString()
  },
  
  integer: {
    validate: (v): v is number =>
      typeof v === 'number' && Number.isInteger(v),
    sanitize: (v) => Math.floor(v)
  }
};
```

#### Form Security
```javascript
export class SecureForm extends Component {
  constructor() {
    super();
    // CSRF token automatically included
    this.csrfToken = generateCSRFToken();
  }
  
  render() {
    return html`
      <form @submit=${this.handleSubmit}>
        <input type="hidden" name="_csrf" value=${this.csrfToken}>
        ${this.children}
      </form>
    `;
  }
  
  handleSubmit(e) {
    e.preventDefault();
    
    // Validate CSRF
    if (!validateCSRFToken(this.csrfToken)) {
      throw new SecurityError('Invalid CSRF token');
    }
    
    // Validate all inputs
    const data = this.validateInputs(new FormData(e.target));
    this.onSubmit(data);
  }
}
```

### Security Headers

#### Automatic Header Injection
```javascript
// Middleware automatically adds security headers
export function securityHeaders(config = {}) {
  const defaults = {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
  
  return { ...defaults, ...config };
}
```

### Build-Time Security

#### Static Analysis
```javascript
// ESLint security plugin configuration
module.exports = {
  plugins: ['security'],
  rules: {
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-object-injection': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-unsafe-regex': 'error'
  }
};
```

#### Dependency Scanning
```yaml
# CI/CD security checks
- name: Security Audit
  run: |
    # Check for known vulnerabilities
    npm audit --production
    
    # SAST scanning
    semgrep --config=auto
    
    # License compliance
    license-checker --production --onlyAllow 'MIT;Apache-2.0;BSD'
```

### Security Monitoring

#### Runtime Protection
```javascript
// Detect and prevent common attacks
export class SecurityMonitor {
  constructor() {
    this.attemptCounts = new Map();
    this.blockedIPs = new Set();
  }
  
  checkRateLimit(identifier, limit = 100, window = 60000) {
    const key = `${identifier}:${Math.floor(Date.now() / window)}`;
    const count = (this.attemptCounts.get(key) || 0) + 1;
    
    this.attemptCounts.set(key, count);
    
    if (count > limit) {
      this.blockIdentifier(identifier);
      throw new SecurityError('Rate limit exceeded');
    }
  }
  
  detectSQLInjection(input) {
    const patterns = [
      /(\b(union|select|insert|update|delete|drop)\b)/i,
      /(--|\/\*|\*\/|xp_|sp_)/,
      /(\bor\b\s*\d+\s*=\s*\d+)/i
    ];
    
    if (patterns.some(p => p.test(input))) {
      this.logSecurityEvent('sql_injection_attempt', { input });
      throw new SecurityError('Invalid input detected');
    }
  }
}
```

### Vulnerability Response

#### Automated Patching
```javascript
// Security advisory system
export class SecurityAdvisory {
  static async checkForUpdates() {
    const response = await fetch('https://brutal.dev/api/security/advisories');
    const advisories = await response.json();
    
    for (const advisory of advisories) {
      if (this.isAffected(advisory)) {
        this.notify(advisory);
        
        if (advisory.severity === 'critical') {
          this.applyPatch(advisory.patch);
        }
      }
    }
  }
}
```

## Evolution

### V3 Security
- Basic XSS protection
- Manual sanitization
- Some unsafe defaults

### V4 Security
- Better defaults
- CSP support
- Still had dependencies

### V5 Security
- Zero dependencies
- Security-first design
- Automated enforcement
- Safe by default

## Trade-offs

✅ **Benefits**:
- No dependency vulnerabilities
- Secure by default
- Automated protection
- Clear security model

⚠️ **Considerations**:
- Stricter development
- Some convenience lost
- Performance overhead
- Learning curve

## Security Checklist

### For Framework
- [ ] Zero runtime dependencies
- [ ] All outputs sanitized
- [ ] CSP compatible
- [ ] Security headers set
- [ ] Input validation required
- [ ] CSRF protection built-in
- [ ] Rate limiting available

### For Applications
- [ ] Enable all security features
- [ ] Review CSP policy
- [ ] Implement rate limiting
- [ ] Monitor security events
- [ ] Regular updates
- [ ] Security training

## References
- OWASP Top 10
- Security.md policy
- ESLint security plugin
- V5 security decisions

---

*Security is not optional. Build it in, don't bolt it on.*