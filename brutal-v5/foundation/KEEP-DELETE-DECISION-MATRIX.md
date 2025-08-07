# ✅ Keep vs ❌ Delete Decision Matrix for @brutal

## Decision Criteria (V5 Principles)
1. **Functional over OOP** - Prefer functions and composition
2. **Minimal size** - Smallest implementation that works
3. **Zero dependencies** - No external deps
4. **No inheritance** - Avoid class extends patterns
5. **Complete features** - Must have all essential functionality

## 📦 Templates Package

### ✅ KEEP: `ultra-minimal.ts`
- **Size**: 358 lines
- **Pattern**: Pure functional
- **Features**: ✅ All (expressions, loops, conditionals, filters)
- **Why**: Smallest complete implementation, already in use

### ❌ DELETE:
```
minimal.ts            # 423 lines - redundant, larger
compiler/compiler.ts  # 680 lines - class-heavy, complex
core/*.ts            # 500+ lines - over-engineered
engine/engine.ts     # 150 lines - duplicate functionality
template/template.ts # Not needed
```

## 🧩 Components Package

### ✅ KEEP: `minimal.ts` (but needs refactoring)
- **Current**: Class-based but minimal (222 lines)
- **Features**: ✅ All (lifecycle, state, events, shadow DOM)
- **TODO**: Refactor to composition pattern later

### ❌ DELETE:
```
base/Component.ts       # 405 lines - too verbose
base/BrutalComponent.ts # 18 lines - too minimal
ui/*.ts                # If duplicated in minimal
```

### 🔧 REFACTOR NEEDED:
```typescript
// Current (inheritance):
export class C extends HTMLElement { }

// Should be (composition):
export const createComponent = (config) => { /* ... */ }
```

## 💾 State Package

### ✅ KEEP: `minimal.ts`
- **Size**: 148 lines
- **Pattern**: Functional + Proxy
- **API**: `s()` for store, `c()` computed, etc.
- **Features**: ✅ All (reactivity, computed, persist, devtools)

### ❌ DELETE:
```
store/store.ts      # Too basic
store/core.ts       # Redundant createStore
store/selectors.ts  # If not used by minimal
middleware/*.ts     # If duplicated in minimal
```

## 🧭 Routing Package

### ✅ KEEP: `minimal.ts`
- **Size**: 174 lines
- **Pattern**: Functional factory
- **API**: `r()` for router
- **Features**: ✅ All (guards, history, query, lazy)

### ❌ DELETE:
```
router.ts           # 433 lines - class-heavy
router/router.ts    # 220 lines - redundant
guards/index.ts     # If in minimal
history/index.ts    # If in minimal
```

## 🌐 HTTP Package

### ✅ KEEP: `minimal.ts`
- **Size**: Already optimal
- **Pattern**: Functional
- **Features**: ✅ Complete

## ✅ Validation Package

### ✅ KEEP: `minimal.ts`
- **Already aligned**: Functional validators

## 🎭 Animation Package

### ✅ KEEP: `minimal.ts`
- **Already aligned**: Promise-based API

## 🧪 Testing Package

### ✅ KEEP: `minimal.ts`
- **Already aligned**: Factory pattern

## 🏗️ Implementation Strategy

### Phase 1: Clean Up (Immediate)
```bash
# Delete redundant files
rm -rf packages/@brutal/templates/src/compiler
rm -rf packages/@brutal/templates/src/core
rm -rf packages/@brutal/templates/src/engine
rm packages/@brutal/templates/src/minimal.ts
rm packages/@brutal/components/src/base/Component.ts
rm packages/@brutal/components/src/base/BrutalComponent.ts
# ... etc
```

### Phase 2: Update Exports
```typescript
// templates/index.ts
export * from './ultra-minimal.js';

// components/index.ts (temporary)
export * from './minimal.js';

// state/index.ts
export * from './minimal.js';

// routing/index.ts
export * from './minimal.js';
```

### Phase 3: Refactor Components (Later)
Convert from class-based to composition-based without losing functionality.

## 📊 Expected Impact

### Before:
- Templates: ~2,000 lines across 6 implementations
- Components: ~650 lines across 3 base classes
- State: ~400 lines across 3 implementations
- Routing: ~800 lines across 3 implementations

### After:
- Templates: 358 lines (82% reduction)
- Components: 222 lines (66% reduction)
- State: 148 lines (63% reduction)
- Routing: 174 lines (78% reduction)

## ⚠️ No Functionality Loss

All minimal implementations include:
- ✅ Core features
- ✅ Essential APIs
- ✅ Performance optimizations
- ✅ Zero dependencies

What we lose:
- ❌ Verbose error messages (good for size)
- ❌ Extra convenience methods (YAGNI)
- ❌ Class inheritance (good, we want composition)
- ❌ TypeScript interfaces in runtime (good for size)

## 🎯 Final Recommendation

**Use minimal.ts (or ultra-minimal.ts) everywhere** because they:
1. Align with V5's functional philosophy
2. Have smallest size without feature loss
3. Use composition over inheritance
4. Are already proven to work

The only exception is components which needs refactoring from classes to functions, but that's a separate task.