# @brutal/templates Implementation Plan

## Current State Analysis

### What We Have
- Basic template engine with `${expression}` interpolation
- HTML escaping for security
- Tagged template literal support
- Simple property access (e.g., `user.name`)
- Size: 4.38KB (2.62KB under 7KB limit)

### What We Need
1. **Control Flow**
   - Conditional rendering (if/else)
   - Loops (for/each)
   - Switch statements

2. **Advanced Features**
   - Expression evaluation (math, comparisons, logic)
   - Filters/pipes for data transformation
   - Custom directives
   - Template composition (partials/includes)

3. **Performance**
   - Template caching
   - Compiled template optimization
   - Minimal runtime overhead

## Architecture Decision

Given the 7KB size constraint and BRUTAL's philosophy of simplicity, we'll implement a **lightweight template engine** rather than a full AST-based compiler. This approach:

1. Keeps the bundle small
2. Provides essential features
3. Maintains fast runtime performance
4. Avoids complexity of full parsers

## Implementation Steps

### Phase 1: Clean Up Structure (Step 1)
- Remove duplicate files (engine/index.ts vs engine.ts)
- Remove placeholder modules (ast, compiler stubs)
- Consolidate actual functionality
- Update imports and exports

### Phase 2: Expression Evaluator (Step 2)
Create a safe expression evaluator that supports:
- Property access: `user.name`, `items[0]`
- Math operations: `price * quantity`
- Comparisons: `age >= 18`
- Logical operations: `isActive && hasPermission`
- Function calls: `formatDate(date)`
- Safe execution (no eval, no arbitrary code)

### Phase 3: Control Flow (Steps 3-4)
Implement template syntax for:

**Conditionals:**
```html
{{#if condition}}
  <div>True branch</div>
{{#else}}
  <div>False branch</div>
{{/if}}
```

**Loops:**
```html
{{#each items as item}}
  <li>{{item.name}}</li>
{{/each}}

{{#for i in range(0, 10)}}
  <div>Item {{i}}</div>
{{/for}}
```

### Phase 4: Directives System (Step 5)
Simple directive system for common patterns:
```html
<div t-show="isVisible">...</div>
<input t-model="username">
<button t-on:click="handleClick">Click</button>
<div t-class="{ active: isActive }">...</div>
```

### Phase 5: Filters/Pipes (Step 6)
Value transformation pipeline:
```html
{{ price | currency }}
{{ date | format('YYYY-MM-DD') }}
{{ text | truncate(50) | capitalize }}
```

### Phase 6: Performance Optimization (Step 7)
- Template caching with WeakMap
- Pre-compiled templates
- Minimal re-rendering
- Efficient DOM updates

### Phase 7: Testing & Documentation (Steps 8-9)
- Comprehensive test suite
- Performance benchmarks
- API documentation
- Usage examples

## Technical Approach

### Template Syntax Parser
Instead of full AST, use a lightweight regex-based parser:
```typescript
const TEMPLATE_REGEX = {
  interpolation: /\{\{([^}]+)\}\}/g,
  if: /\{\{#if\s+(.+?)\}\}([\s\S]*?)(?:\{\{#else\}\}([\s\S]*?))?\{\{\/if\}\}/g,
  each: /\{\{#each\s+(.+?)\s+as\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
  directive: /t-(\w+)(?::(\w+))?="([^"]+)"/g
};
```

### Safe Expression Evaluator
```typescript
class ExpressionEvaluator {
  evaluate(expr: string, context: any): any {
    // Parse expression into tokens
    // Evaluate safely without eval()
    // Support operators, properties, functions
  }
}
```

### Template Compiler
```typescript
class TemplateCompiler {
  compile(template: string): CompiledTemplate {
    // Parse template into segments
    // Generate optimized render function
    // Return compiled template
  }
}
```

## Size Budget Allocation

Current: 4.38KB
Remaining: 2.62KB

Planned additions:
- Expression evaluator: ~0.8KB
- Control flow: ~0.6KB
- Directives: ~0.5KB
- Filters: ~0.3KB
- Caching: ~0.2KB
- Utilities: ~0.2KB
Total: ~2.6KB (within budget)

## Success Criteria

1. **Functionality**
   - All planned features working
   - Comprehensive test coverage
   - No runtime dependencies

2. **Performance**
   - < 5ms template compilation
   - < 1ms render for typical templates
   - Efficient memory usage

3. **Size**
   - Total package < 7KB gzipped
   - Tree-shakeable exports
   - Minimal runtime overhead

4. **Developer Experience**
   - Clear, intuitive API
   - Good error messages
   - TypeScript support
   - Extensive documentation

## Risk Mitigation

1. **Size Overrun**: Implement features incrementally, measure after each
2. **Performance**: Benchmark continuously, optimize hot paths
3. **Complexity**: Keep syntax simple, avoid feature creep
4. **Security**: Never use eval(), sanitize all inputs

## Next Steps

1. Start with Phase 1: Clean up structure
2. Implement expression evaluator
3. Add control flow features
4. Test continuously
5. Monitor bundle size