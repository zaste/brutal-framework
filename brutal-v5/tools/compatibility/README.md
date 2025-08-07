# BRUTAL V5 Compatibility Tools

Version compatibility system that prevents version mismatch chaos across the 42-package ecosystem.

## Overview

This tooling ensures that incompatible package versions are caught at install time and runtime, preventing cryptic errors in production.

## Components

### 1. Version Manifest (`version-manifest.ts`)
Core types and compatibility validation system.

### 2. Matrix Generator (`matrix-generator.ts`)
Automatically generates compatibility matrix from monorepo packages.

```bash
# Generate compatibility matrix
pnpm compatibility:generate

# Output:
# - compatibility-matrix.json
# - compatibility-matrix.html (visual report)
```

### 3. Install Validator (`install-validator.ts`)
Runs during npm/pnpm install to check version compatibility.

```bash
# Run manually
brutal-validate-compatibility

# Install hook (adds to package.json)
brutal-validate-compatibility --install-hook
```

### 4. Runtime Guard (`runtime-guard.ts`)
Embedded in each package for runtime validation.

```typescript
// In each package's index.ts
import { createVersionGuard } from '@brutal/compatibility-tools';

const validateVersions = createVersionGuard(
  '@brutal/components',
  '1.0.0',
  {
    '@brutal/foundation': '^1.0.0',
    '@brutal/templates': '^1.0.0',
    '@brutal/events': '^1.0.0'
  }
);

// Run validation
validateVersions();
```

## Usage

### 1. Generate Matrix (Weekly)
```bash
cd tools/compatibility
pnpm generate-matrix
```

### 2. Add to CI Pipeline
```yaml
- name: Generate Compatibility Matrix
  run: pnpm compatibility:generate
  
- name: Validate Compatibility
  run: pnpm compatibility:validate
```

### 3. Embed in Packages
```typescript
// packages/@brutal/[package]/src/index.ts
export { validateVersions } from './version-guard';

// Auto-validate on import
if (process.env.NODE_ENV !== 'production') {
  validateVersions();
}
```

### 4. Handle Errors
```typescript
RuntimeVersionGuard.validate({
  packageName: '@brutal/components',
  packageVersion: '1.0.0',
  dependencies: { /* ... */ },
  mode: 'strict', // throw on error
  onError: (error) => {
    // Custom error handling
    telemetry.logVersionError(error);
  }
});
```

## Compatibility Matrix Format

```json
{
  "version": "1.0.0",
  "generated": "2024-01-15T10:00:00Z",
  "packages": {
    "@brutal/components": {
      "currentVersion": "1.0.0",
      "supportedVersions": ["1.0.0", "0.9.0"],
      "dependencies": {
        "@brutal/foundation": {
          "min": "1.0.0",
          "max": "2.0.0",
          "tested": ["1.0.0", "1.1.0"]
        }
      }
    }
  },
  "compatibility": {
    "@brutal/components": {
      "1.0.0": {
        "compatible": {
          "@brutal/state": {
            "min": "1.0.0",
            "max": "1.2.0",
            "tested": ["1.0.0", "1.1.0"]
          }
        }
      }
    }
  }
}
```

## Error Examples

### Install Time
```
❌ Compatibility Issues:

   @brutal/enhanced-components:
   - @brutal/enhanced-components@1.0.0 requires @brutal/components@^1.0.0, but 2.0.0 is installed
   - Expected: 1.0.0 - 2.0.0
   - Actual: 2.0.0

💡 Suggestions:
   - Install @brutal/components@1.2.0
     Reason: Satisfies all dependencies

📋 To fix, run:
   pnpm add @brutal/components@1.2.0
```

### Runtime
```
[BRUTAL Version Guard] ❌ @brutal/events@2.0.0 is incompatible with required ^1.0.0
  Expected: ^1.0.0
  Actual: 2.0.0
```

## Integration with Packages

### Package.json Addition
```json
{
  "scripts": {
    "preinstall": "brutal-validate-compatibility",
    "postinstall": "brutal-validate-compatibility"
  }
}
```

### Build-time Integration
```typescript
// rollup.config.js
import { validateVersions } from '@brutal/compatibility-tools/plugin';

export default {
  plugins: [
    validateVersions({
      manifest: './compatibility-matrix.json',
      strict: true
    })
  ]
};
```

## Next Steps

- [ ] Add semver proper parsing
- [ ] Integrate with npm registry API
- [ ] Add telemetry for version conflicts
- [ ] Create VS Code extension
- [ ] Add git hooks for version bumps