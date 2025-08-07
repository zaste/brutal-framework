# Security Policy

> ✅ **Distilled**: 2024-07-12
> - Security-first design → [pattern](./foundation/patterns/security/security-first-design.md)
> - Zero dependencies → [principle](./foundation/principles/zero-dependencies.md)
> - Vulnerability response → [pattern](./foundation/patterns/security/vulnerability-response.md)

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 5.x.x   | :white_check_mark: |
| < 5.0   | :x:                |

## Reporting a Vulnerability

### Where to Report
- **Email**: security@brutal.dev
- **PGP Key**: [Coming soon]
- **Bug Bounty**: [Coming soon]

### What to Include
1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

### Response Timeline
- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Patch Release**: Within 30 days (critical: 7 days)

### Process
1. Report received and acknowledged
2. Issue verified and assessed
3. Fix developed and tested
4. Security advisory drafted
5. Patch released
6. Public disclosure (after patch)

## Security Measures

### Code Security
- No `eval()` or `Function()` constructor
- Automatic HTML/CSS sanitization
- CSP-compatible by default
- Input validation on all user data

### Dependency Security
- Zero runtime dependencies (none to audit!)
- Dev dependencies audited weekly
- Automated security scanning in CI

### Build Security
- Signed releases
- SLSA Level 3 compliance (planned)
- Reproducible builds

## Disclosure Policy

We follow responsible disclosure:
1. Private notification to affected users
2. 30-day embargo period
3. Public advisory with CVE
4. Full disclosure after patches available

## Security Features

BRUTAL V5 includes built-in security features:
- Content Security Policy helpers
- XSS protection
- CSRF token generation
- Sanitization utilities
- Secure defaults

## Contact

- Security Team: security@brutal.dev
- Project Lead: [Coming soon]
- Security Lead: [Coming soon]

---

*Security is not optional. Report responsibly, we'll fix responsibly.*