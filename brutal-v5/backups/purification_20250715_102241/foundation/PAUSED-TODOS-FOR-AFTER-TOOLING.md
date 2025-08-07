# 📋 PAUSED: TODOs for After Tooling Sprint

*Date: 2025-07-14*
*Status: ON HOLD until tooling foundation complete*

## Context
These TODOs were paused to focus on the critical 4-week tooling sprint. They should be resumed ONLY after all tooling infrastructure is in place.

## Original Feature/Refactoring TODOs

### High Priority (Resume First)
1. **Fix internal imports in enhanced packages (remove @brutal/events imports)**
   - Enhanced packages importing from shared/events directly
   - Breaks one-dependency rule
   - Needs to import only from base package

2. **Create composition utility functions in @brutal/shared**
   - Higher-order component utilities
   - Mixin helpers
   - Type-safe composition patterns

3. **Convert BrutalComponent from abstract class to composition pattern**
   - Current: abstract class with inheritance
   - Target: composition functions
   - Critical for 42-package scale

4. **Refactor AsyncComponent to use composition instead of inheritance**
   - Remove extends BrutalComponent
   - Use withAsync enhancer

5. **Refactor ObserverComponent to use composition pattern**
   - Remove extends BrutalComponent
   - Use withObserver enhancer

6. **Refactor Portal to use composition pattern**
   - Remove extends BrutalComponent
   - Use withPortal enhancer

7. **Run all tests to ensure nothing breaks during refactoring**
   - Continuous validation
   - After each refactoring step

8. **Update TypeScript types for composition pattern**
   - Generic constraints
   - Composition type helpers
   - Migration types

### Medium Priority (Resume Second)
9. **Update enhanced-routing to use composition pattern**
   - Remove inheritance from all routing components
   - Create routing enhancers

10. **Update enhanced-state to use composition pattern**
    - Remove inheritance from state components
    - Create state enhancers

11. **Implement proper feature directory structure in all packages**
    - src/[feature]/[feature].ts pattern
    - Co-locate tests and types
    - Remove flat structure

12. **Remove example-feature boilerplate from all packages**
    - Delete unused template code
    - Replace with real implementations

13. **Implement cache package features (invalidation, memory, persistent)**
    - Multiple TODOs in code
    - Core functionality missing

14. **Implement template compiler and engine**
    - Currently stubbed
    - Needed for performance

### Low Priority (Resume Last)
15. **Unify bundle size limits across all package.json files**
    - Some say 10KB, others 20KB
    - Need consistent targets

16. **Consolidate architecture documentation into single source of truth**
    - Multiple conflicting docs
    - Create master architecture doc

17. **Validate circular dependencies with automated tooling**
    - After all refactoring complete
    - Ensure no cycles

18. **Document the new composition-based plugin architecture**
    - After plugin system designed
    - With security model

19. **Create migration guide from inheritance to composition**
    - For users upgrading
    - With codemods

20. **Implement remaining 28 packages (after core fixes)**
    - Only after foundation solid
    - With all tooling in place

## Resume Criteria

Before resuming ANY of these TODOs, ensure:

### ✅ Week 1 Tooling Complete
- [ ] Version compatibility system operational
- [ ] Compatibility matrix generator working
- [ ] Install-time validator active
- [ ] Runtime version guard implemented

### ✅ Week 2 Tooling Complete
- [ ] Performance benchmark suite running
- [ ] Regression detection system active
- [ ] Bundle size tracker operational
- [ ] Memory leak detector working

### ✅ Week 3 Tooling Complete
- [ ] Breaking change analyzer built
- [ ] Migration tool generator ready
- [ ] API surface tracker active
- [ ] Cross-package impact analyzer working

### ✅ Week 4 Tooling Complete
- [ ] Security sandbox architecture designed
- [ ] Permission declaration system built
- [ ] Plugin certification pipeline ready
- [ ] Documentation validator operational

## Important Notes

1. **DO NOT** resume these TODOs early - tooling must be complete
2. **DO NOT** add new feature TODOs until tooling done
3. **DO** focus 100% on tooling sprint
4. **DO** validate each tooling component works before moving on

## Resumption Order

When tooling is complete, resume in this order:
1. Composition refactoring (with performance tracking)
2. Import fixes (with compatibility checking)
3. Structure improvements (with validation)
4. Feature implementation (with all guards)
5. New packages (with full tooling)

---

*This document preserves our original plan to be executed AFTER establishing the tooling foundation.*