# 📁 Feature-Based Structure

> **Core Principle**: Organize code by feature, not by file type, to improve discoverability, maintainability, and team collaboration.

## Why This Matters

### The Problem with Type-Based Organization
```
❌ WRONG: Organized by file type
src/
├── components/
│   ├── AsyncComponent.ts
│   ├── ObserverComponent.ts
│   └── Portal.ts
├── types/
│   ├── async.types.ts
│   ├── observer.types.ts
│   └── portal.types.ts
└── tests/
    ├── async.test.ts
    ├── observer.test.ts
    └── portal.test.ts
```

### The Power of Feature-Based Organization
```
✅ CORRECT: Organized by feature
src/
├── async/
│   ├── async.ts
│   ├── async.types.ts
│   ├── async.test.ts
│   └── index.ts
├── observer/
│   ├── observer.ts
│   ├── observer.types.ts
│   ├── observer.test.ts
│   └── index.ts
└── portal/
    ├── portal.ts
    ├── portal.types.ts
    ├── portal.test.ts
    └── index.ts
```

## Benefits

### 1. **Discoverability**
- All related files in one place
- Easy to find tests, types, and implementation
- New developers understand structure immediately

### 2. **Maintainability**
- Changes to a feature touch files in one directory
- Easy to delete/move entire features
- Clear ownership boundaries

### 3. **Scalability**
- Add new features without touching other directories
- No giant directories with 100+ files
- Natural code splitting boundaries

### 4. **Team Collaboration**
- Clear feature ownership
- Reduced merge conflicts
- Parallel development enabled

## Implementation Guidelines

### Package Structure Template
```
packages/@brutal/[package-name]/
├── src/
│   ├── [feature-1]/
│   │   ├── [feature-1].ts          # Implementation
│   │   ├── [feature-1].types.ts    # TypeScript types
│   │   ├── [feature-1].test.ts     # Unit tests
│   │   ├── [feature-1].bench.ts    # Performance benchmarks
│   │   └── index.ts                # Public exports
│   ├── [feature-2]/
│   │   └── ...
│   ├── shared/                     # Shared internal utilities
│   │   └── utils.ts
│   ├── index.ts                    # Package public API
│   └── types.ts                    # Package-wide types
├── docs/
│   ├── [feature-1].md             # Feature documentation
│   └── README.md                  # Package overview
├── examples/
│   └── [feature-1].html           # Feature examples
└── package.json
```

### Feature Directory Rules

1. **Self-Contained Features**
   ```typescript
   // async/index.ts - Public API only
   export { AsyncComponent } from './async';
   export type { AsyncOptions } from './async.types';
   ```

2. **Internal Implementation**
   ```typescript
   // async/async.ts - Implementation details
   import { AsyncOptions } from './async.types';
   import { debounce } from '../shared/utils';
   
   export class AsyncComponent {
     // Implementation
   }
   ```

3. **Co-located Tests**
   ```typescript
   // async/async.test.ts - Tests next to code
   import { AsyncComponent } from './async';
   
   describe('AsyncComponent', () => {
     // Tests
   });
   ```

## Anti-Patterns to Avoid

### ❌ Mixed Organization
```
// DON'T: Mix approaches
src/
├── components/
│   └── Button.ts
├── button/
│   └── button.test.ts
└── types/
    └── button.types.ts
```

### ❌ Deep Nesting
```
// DON'T: Over-organize
src/
└── features/
    └── ui/
        └── components/
            └── interactive/
                └── button/
                    └── primary/
                        └── PrimaryButton.ts
```

### ❌ Shared Test Directories
```
// DON'T: Separate tests from code
src/
├── components/
└── __tests__/    # Far from implementation
    └── components/
```

## Migration Strategy

### From Type-Based to Feature-Based

**Step 1: Identify Features**
```bash
# List all components
find src/components -name "*.ts" | grep -v test

# Group related files
# AsyncComponent.ts → async/
# AsyncComponent.types.ts → async/
# AsyncComponent.test.ts → async/
```

**Step 2: Create Feature Directories**
```bash
# For each feature
mkdir -p src/async
mv src/components/AsyncComponent.ts src/async/async.ts
mv src/types/async.types.ts src/async/async.types.ts
mv src/tests/async.test.ts src/async/async.test.ts
```

**Step 3: Update Imports**
```typescript
// Before
import { AsyncComponent } from '../components/AsyncComponent';
import { AsyncOptions } from '../types/async.types';

// After
import { AsyncComponent, AsyncOptions } from '../async';
```

## Real-World Examples

### Event System Feature
```
events/
├── emitter/
│   ├── emitter.ts
│   ├── emitter.types.ts
│   ├── emitter.test.ts
│   └── index.ts
├── bus/
│   ├── bus.ts
│   ├── bus.types.ts
│   ├── bus.test.ts
│   └── index.ts
├── shared/
│   └── event-utils.ts
└── index.ts
```

### State Management Feature
```
state/
├── store/
│   ├── store.ts
│   ├── store.types.ts
│   ├── store.test.ts
│   └── index.ts
├── computed/
│   ├── computed.ts
│   ├── computed.types.ts
│   ├── computed.test.ts
│   └── index.ts
├── middleware/
│   ├── middleware.ts
│   ├── middleware.types.ts
│   └── index.ts
└── index.ts
```

## Validation Checklist

- [ ] Each feature in its own directory
- [ ] Tests co-located with implementation
- [ ] Types co-located with implementation
- [ ] Clear public API in index.ts
- [ ] No type-based directories (components/, types/, tests/)
- [ ] Shared utilities in shared/ subdirectory
- [ ] Examples reference feature structure

## Tooling Support

### ESLint Rule
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        // Prevent deep imports
        '@brutal/*/src/*/*',
        // Force index imports
        '!@brutal/*/src/*/index'
      ]
    }]
  }
};
```

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testMatch: [
    '**/src/**/*.test.ts',  // Co-located tests
    '**/src/**/*.spec.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts'
  ]
};
```

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md#package-structure)
- [Package Structure Template](../PACKAGE-STRUCTURE-TEMPLATE.md)
- [Angular Style Guide](https://angular.io/guide/styleguide#file-structure-conventions)
- [Feature-Sliced Design](https://feature-sliced.design/)

---

*Feature-based structure is essential for maintaining clean architecture as we scale to 42 packages.*