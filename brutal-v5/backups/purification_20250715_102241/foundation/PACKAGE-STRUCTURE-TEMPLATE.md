# 📦 BRUTAL V5 - Package Structure Template

## Purpose
Every package MUST follow this exact structure. No exceptions. Use `scripts/create-package.js` to generate.

## 📁 Required Structure

```
packages/[name]/
├── src/
│   ├── index.ts              # Main entry point
│   ├── index.test.ts         # Entry point tests
│   └── [feature]/            # Feature subdirectories
│       ├── [feature].ts
│       └── [feature].test.ts # Co-located tests
│
├── docs/
│   ├── README.md             # Package overview
│   ├── API.md                # Complete API reference
│   └── EXAMPLES.md           # Usage examples
│
├── package.json              # Package configuration
├── tsconfig.json             # TypeScript config (extends root)
├── jest.config.js            # Jest config (extends root)
├── .eslintrc.js              # ESLint config (extends root)
└── CHANGELOG.md              # Package changelog
```

## 📄 File Templates

### package.json
```json
{
  "name": "@brutal/[name]",
  "version": "0.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint src",
    "type-check": "tsc --noEmit",
    "size": "size-limit"
  },
  "dependencies": {
    // ONLY packages from DEPENDENCY-GRAPH.md
  },
  "devDependencies": {
    // Inherited from root
  },
  "size-limit": [
    {
      "path": "dist/index.js",
      "limit": "[SIZE]KB"
    }
  ]
}
```

### tsconfig.json
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts", "dist"]
}
```

### jest.config.js
```javascript
export default {
  ...require('../../jest.config.base'),
  displayName: '@brutal/[name]',
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};
```

### .eslintrc.js
```javascript
module.exports = {
  extends: '../../.eslintrc.base.js',
  parserOptions: {
    project: './tsconfig.json'
  }
};
```

### src/index.ts
```typescript
/**
 * @brutal/[name] - [Description]
 * 
 * @packageDocumentation
 */

// Public API exports
export { } from './[feature]';
export type { } from './types';

// Package version
export const VERSION = '__VERSION__';
```

### docs/README.md
```markdown
# @brutal/[name]

> [One-line description]

## Installation

\`\`\`bash
npm install @brutal/[name]
\`\`\`

## Quick Start

\`\`\`typescript
import { } from '@brutal/[name]';

// Example usage
\`\`\`

## Features

- Feature 1
- Feature 2
- Feature 3

## API Overview

See [API.md](./API.md) for complete reference.

## Examples

See [EXAMPLES.md](./EXAMPLES.md) for more examples.

## Size

- **Minified**: [X]KB
- **Gzipped**: [X]KB
- **Brotli**: [X]KB

## Dependencies

- List all dependencies

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

## License

MIT
```

### docs/API.md
```markdown
# @brutal/[name] API Reference

## Exports

### Classes

#### `ClassName`

\`\`\`typescript
class ClassName {
  constructor(options?: Options);
  method(): void;
}
\`\`\`

### Functions

#### `functionName()`

\`\`\`typescript
function functionName(param: Type): ReturnType;
\`\`\`

### Types

#### `TypeName`

\`\`\`typescript
interface TypeName {
  property: Type;
}
\`\`\`

### Constants

#### `CONSTANT_NAME`

\`\`\`typescript
const CONSTANT_NAME: Type = value;
\`\`\`
```

### docs/EXAMPLES.md
```markdown
# @brutal/[name] Examples

## Basic Usage

### Example 1: [Description]

\`\`\`typescript
import { } from '@brutal/[name]';

// Example code
\`\`\`

## Advanced Usage

### Example 2: [Description]

\`\`\`typescript
// Advanced example
\`\`\`

## Integration Examples

### With Other Packages

\`\`\`typescript
import { } from '@brutal/[name]';
import { } from '@brutal/[other]';

// Integration example
\`\`\`

## Common Patterns

### Pattern 1: [Description]

\`\`\`typescript
// Pattern example
\`\`\`
```

## 🧪 Test Structure

### Test File Template
```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { FeatureName } from './feature-name';

describe('FeatureName', () => {
  let instance: FeatureName;
  
  beforeEach(() => {
    instance = new FeatureName();
  });
  
  afterEach(() => {
    // Cleanup
  });
  
  describe('method()', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = instance.method(input);
      
      // Assert
      expect(result).toBe('expected');
    });
    
    it('should handle edge case', () => {
      // Test edge cases
    });
    
    it('should throw on invalid input', () => {
      // Test error cases
      expect(() => instance.method(null)).toThrow();
    });
  });
});
```

## ✅ Package Checklist

Before considering a package complete:

### Structure
- [ ] All required directories exist
- [ ] All required files exist
- [ ] No extra files or directories

### Configuration
- [ ] package.json correct and complete
- [ ] Dependencies match DEPENDENCY-GRAPH.md
- [ ] All configs extend root configs
- [ ] Size limit configured

### Code
- [ ] Entry point exports all public API
- [ ] All code has TypeScript types
- [ ] All code has co-located tests
- [ ] No circular dependencies

### Tests
- [ ] 95% coverage minimum
- [ ] All edge cases tested
- [ ] All error cases tested
- [ ] Tests pass in all environments

### Documentation
- [ ] README.md complete
- [ ] API.md documents all exports
- [ ] EXAMPLES.md has working examples
- [ ] Inline JSDoc comments

### Quality
- [ ] Passes all linting
- [ ] Passes type checking
- [ ] Within size budget
- [ ] Meets performance benchmarks

## 🚫 Common Violations

### ❌ Missing Required Files
Every file in the template is required. No exceptions.

### ❌ Wrong Dependencies
Only dependencies listed in DEPENDENCY-GRAPH.md are allowed.

### ❌ Tests in Separate Directory
Tests must be co-located with source files.

### ❌ Exceeding Size Budget
Use tree-shaking and optimization to stay within budget.

### ❌ Incomplete Documentation
All three docs files must be complete and accurate.

## 🔧 Automation

### Create Package Script
```bash
# Creates package with exact structure
npm run create:package [name]

# Example
npm run create:package state
```

### Validate Package Script
```bash
# Validates package structure
npm run validate:package [name]

# Validate all packages
npm run validate:packages
```

---

*This template is enforced by automation. Deviations are not possible.*