# Version Coupling Strategy

## Status
**Pending** - Critical for 42-package ecosystem

## Context
With 42 packages, version mismatches will cause cryptic runtime errors. We need a strategy to ensure compatible versions are used together.

## Problem
- Users installing incompatible package versions
- No clear compatibility matrix
- Runtime errors from version mismatches
- No tooling to prevent issues

## Options

### Option 1: Strict Version Lock
All packages must use exact same version.
```json
{
  "dependencies": {
    "@brutal/state": "1.2.3",
    "@brutal/components": "1.2.3"
  }
}
```

**Pros:**
- Simple to understand
- No compatibility issues
- Easy to test

**Cons:**
- Forces updates of all packages
- Larger downloads for small fixes
- Less flexibility

### Option 2: Compatible Version Ranges
Use peer dependencies with ranges.
```json
{
  "peerDependencies": {
    "@brutal/foundation": "^1.0.0"
  }
}
```

**Pros:**
- More flexibility
- Smaller updates
- Follows npm conventions

**Cons:**
- Complex compatibility matrix
- Potential runtime issues
- Harder to test

### Option 3: Version Manifest System
Central compatibility manifest.
```json
{
  "compatibility": {
    "1.0.0": {
      "@brutal/components": "1.0.0 - 1.2.0",
      "@brutal/state": "1.0.0 - 1.1.0"
    }
  }
}
```

**Pros:**
- Clear compatibility rules
- Can be validated
- Supports gradual migration

**Cons:**
- Additional complexity
- Needs tooling
- Must be maintained

## Recommendation
Implement **Option 3** with automated tooling:

1. **Version Manifest**
   ```typescript
   export interface VersionManifest {
     version: string;
     compatible: Record<string, string>;
     breaking: string[];
     migration: string;
   }
   ```

2. **Install-time Validation**
   ```bash
   npx @brutal/check-compatibility
   ```

3. **Runtime Validation**
   ```typescript
   import { validateVersions } from '@brutal/foundation';
   validateVersions(); // Throws if incompatible
   ```

4. **CI Integration**
   - Test version combinations
   - Update manifest automatically
   - Prevent incompatible publishes

## Impact
- Prevents runtime version errors
- Enables confident updates
- Supports ecosystem growth
- Requires initial tooling investment

## Questions
1. Should we enforce at install time or runtime?
2. How many version combinations do we test?
3. Do we support multiple major versions?
4. How do we handle community packages?

## Next Steps
- [ ] Build compatibility checking tool
- [ ] Define version policy
- [ ] Create compatibility matrix
- [ ] Add to CI pipeline