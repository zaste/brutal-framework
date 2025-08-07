# API Naming Conventions Pattern

## Problem
Inconsistent naming across packages, files, and exports creates cognitive overhead and makes the codebase harder to navigate.

## Solution
Strict naming conventions enforced at every level: packages, files, exports, and methods.

### Package Naming
```
@brutal/[name]          # Core packages
@brutal/enhanced-[name] # Enhanced versions
@brutal/[domain]-[name] # Domain-specific
```

### File Naming Conventions
- **Source files**: `kebab-case.ts`
- **Test files**: `[name].test.ts`
- **Type files**: `[name].d.ts`
- **Config files**: `[tool].config.js`
- **Docs**: `UPPER-CASE.md`

### Export Naming
```typescript
// Components: PascalCase
export class Component { }
export class BrutalButton { }

// Functions: camelCase
export function createElement() { }
export function scheduleUpdate() { }

// Constants: UPPER_SNAKE_CASE
export const DEFAULT_OPTIONS = { };
export const MAX_RETRIES = 3;

// Types/Interfaces: PascalCase with I/T prefix
export interface IComponentOptions { }
export type TEventHandler = () => void;
```

### Method Naming
```typescript
// Lifecycle: on[Event]
onMount() { }
onUpdate() { }
onDestroy() { }

// Actions: verb[Noun]
createElement() { }
updateState() { }
handleEvent() { }

// Getters: get[Property]
getState() { }
getAttribute() { }

// Setters: set[Property]
setState() { }
setAttribute() { }

// Booleans: is/has/can[State]
isVisible() { }
hasChildren() { }
canUpdate() { }
```

## Evolution
- V3: Mixed conventions, no enforcement
- V4: Some standards, manual review
- V5: Strict conventions, automated enforcement

## Trade-offs
- ✅ Consistent API surface
- ✅ Better autocomplete
- ✅ Easier onboarding
- ❌ Migration effort from existing code
- ❌ Some conventions feel arbitrary

## Related
- [Package Exports](./package-exports.md)
- [Explicit Over Implicit](../../principles/explicit-over-implicit.md)