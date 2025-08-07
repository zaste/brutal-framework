# 📋 BRUTAL V5 - Feedback Integration Plan

## Accepted Improvements ✅

### 1. Test-Extractor Plugin
**Location**: `@brutal/build-tools/plugins/test-extractor/`
- Zero runtime overhead
- Tests co-located with source
- Stripped in production builds

### 2. Security Linting
**Location**: `@brutal/eslint-plugin-security/`
- Prevent innerHTML, eval, document.write
- Integrated in base ESLint config
- Fails CI on violations

### 3. Cross-Browser Testing
**Update**: `.github/workflows/packages/foundation.yml`
- Playwright matrix: Chrome, Firefox, Safari, Edge
- Smoke tests for core functionality
- Blocks merge on failure

### 4. i18n Code Splitting
**Location**: `@brutal/i18n/plugins/locale-splitter/`
- Each locale in separate chunk
- Dynamic import on demand
- Rollup/Vite plugin

### 5. Asset Fingerprinting
**Location**: `@brutal/cache/src/fingerprint.ts`
- Content-based hashing
- Service Worker auto-update
- Cache invalidation strategy

### 6. Performance Budgets
**Update**: `.github/workflows/performance.yml`
```yaml
budgets:
  - package: '@brutal/core'
    maxSize: '10KB'
    maxTTI: '300ms'
    maxFCP: '100ms'
```

### 7. Migration Codemods
**Location**: `scripts/codemods/`
- v3-to-v5.js (jscodeshift)
- Automated import updates
- API transformations

### 8. Plugin CLI Commands
**Update**: `@brutal/cli/src/commands/`
```bash
brutal plugin list
brutal plugin install <name>
brutal plugin remove <name>
```

## Questions for Decision 🤔

### 1. SSR Support Location
**Options**:
a) Include in `@brutal/foundation/ssr.ts` (adds ~2KB)
b) Create separate `@brutal/ssr` package

**Recommendation**: Option B - Keep core focused

### 2. Telemetry Implementation
**Options**:
a) Include in `@brutal/foundation/telemetry.ts`
b) Create `@brutal/analytics` package
c) Community plugin only

**Recommendation**: Option B - Optional package

## Implementation Priority

### Phase 1 (Critical)
1. Test-Extractor Plugin
2. Security Linting
3. Performance Budgets
4. Cross-Browser Testing

### Phase 2 (Important)
5. Asset Fingerprinting
6. Migration Codemods
7. Plugin CLI

### Phase 3 (Nice to Have)
8. i18n Code Splitting
9. SSR Support
10. Telemetry

## Architecture Updates

### New Packages
```
packages/
├── @brutal/eslint-plugin-security/    # Security rules
├── @brutal/build-tools/
│   └── plugins/
│       └── test-extractor/           # Strip tests
└── @brutal/ssr/                      # SSR support (optional)

tools/
└── @brutal/cli/
    └── src/commands/
        └── plugin.ts                 # Plugin management
```

### Updated Workflows
```
.github/workflows/
├── packages/
│   └── foundation.yml               # + Cross-browser tests
└── performance.yml                  # + Budget enforcement
```

### New Scripts
```
scripts/
├── codemods/
│   ├── v3-to-v5.js
│   └── test-migrations.js
└── validate-budgets.js
```

## Next Steps

1. **Immediate**: Update architecture docs with accepted changes
2. **Phase 0.5**: Implement critical security/testing improvements
3. **Phase 1**: Continue with core packages as planned
4. **Continuous**: Apply learnings to all packages

---

*These improvements make BRUTAL V5 more robust without compromising our core principles.*