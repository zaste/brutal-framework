# Dependency Security Pattern

## Problem
Supply chain attacks through compromised dependencies are increasingly common. Traditional approaches with hundreds of dependencies create massive attack surfaces.

## Solution
Zero runtime dependencies policy with automated security scanning and strict build-time dependency management.

### Zero Dependencies Principle
```json
// Every @brutal/* package
{
  "dependencies": {},  // Always empty
  "devDependencies": {
    // Only build tools, strictly vetted
    "typescript": "^5.0.0",
    "tsup": "^7.0.0"
  }
}
```

### Automated Security Scanning
```yaml
# CI/CD pipeline
security-check:
  - npm audit --production  # Should find nothing
  - snyk test              # Deep vulnerability scan
  - lockfile-lint          # Verify lock integrity
  - license-checker        # Ensure compatible licenses
```

### Build-Time Dependency Management
```javascript
// Strict dependency validation
export function validateDependencies(pkg) {
  // Fail if runtime dependencies exist
  if (Object.keys(pkg.dependencies || {}).length > 0) {
    throw new Error(`Package ${pkg.name} has runtime dependencies`);
  }
  
  // Whitelist dev dependencies
  const allowed = ['typescript', 'tsup', 'jest', 'eslint'];
  const invalid = Object.keys(pkg.devDependencies || {})
    .filter(dep => !allowed.includes(dep));
    
  if (invalid.length > 0) {
    throw new Error(`Unauthorized dev dependencies: ${invalid}`);
  }
}
```

### Supply Chain Protection
1. **No runtime deps** = No supply chain attacks
2. **Vendored polyfills** = Controlled, audited code
3. **Lockfile validation** = Prevent tampering
4. **Regular audits** = Catch new vulnerabilities

## Evolution
- V3: 50+ dependencies, security issues
- V4: Reduced dependencies, still vulnerable
- V5: Zero dependencies, maximum security

## Trade-offs
- ✅ Immunity to supply chain attacks
- ✅ Predictable security posture
- ✅ No dependency updates needed
- ❌ Must implement everything
- ❌ No ecosystem benefits

## Related
- [Zero Dependencies](../../principles/zero-dependencies.md)
- [Security-First Design](./security-first-design.md)
- [Quality Gates](../quality/quality-gates.md)