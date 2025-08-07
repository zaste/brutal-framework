# BRUTAL V5 - Principles Clarification Guide

> **Purpose**: Prevent misinterpretation of principles that lead to impractical decisions

## Core Principles - Clarified Interpretation

### 1. Zero Dependencies → Zero RUNTIME Dependencies ✅

**Original**: "Zero dependencies"

**Clarified**: 
- ✅ Zero dependencies in production code
- ✅ Zero dependencies in user bundles  
- ✅ Use development tools pragmatically
- ❌ NOT zero devDependencies

**Test**: Will this code ship to users? If NO, use best tool available.

### 2. Tooling First → BUILD Unique Tooling First ✅

**Original**: "Build tooling before features"

**Clarified**:
- ✅ Build BRUTAL-specific tooling first
- ✅ Configure existing tools for our needs
- ✅ Measure and validate using any tool
- ❌ NOT rebuild every tool from scratch

**Test**: Does this tool need BRUTAL-specific knowledge? If NO, use existing.

### 3. Test Co-location → Implementation Flexible ✅

**Original**: "Tests next to source"

**Clarified**:
- ✅ Tests live in *.test.ts files next to source
- ✅ Use any test runner that supports this
- ✅ Build process strips tests from production
- ❌ NOT requires custom test runner

**Test**: Are tests co-located? If YES, runner choice is flexible.

## The Pragmatism Check

Before any decision, ask:

1. **Does this help users build better apps?**
2. **Is this the best use of our time?**
3. **Are we solving a real problem?**
4. **Is the juice worth the squeeze?**

## Red Flags 🚩

You might be over-interpreting principles if:

- You're building a tool that already exists perfectly
- You're spending more time on tooling than features
- You're creating problems to stay "pure"
- The solution is more complex than the problem
- You're coding instead of thinking

## Green Flags ✅

You're correctly interpreting principles when:

- Users get zero-dependency packages
- Development stays productive
- Tools solve BRUTAL-specific problems
- Pragmatic choices speed development
- Focus stays on framework value

## Example Decisions

### ❌ WRONG: "We need our own test runner for zero deps"
- Misinterprets: Zero dependencies
- Wastes: Months of development
- Result: Inferior test runner

### ✅ RIGHT: "Use Jest for development, ship zero deps"
- Respects: Zero runtime dependencies
- Saves: Months of development  
- Result: Better framework

### ❌ WRONG: "Build our own TypeScript"
- Misinterprets: Tooling first
- Wastes: Years of development
- Result: Never ship

### ✅ RIGHT: "Build BRUTAL-specific bundle tracker"
- Respects: Tooling for our needs
- Saves: Catches size regressions
- Result: Maintains 6KB goal

## The Ultimate Test

> **If you're building something that exists perfectly elsewhere, and it won't make BRUTAL better for users, you're probably over-interpreting a principle.**

## Living Document

This clarification exists because:
1. We spent time on test-extractor unnecessarily
2. We almost rebuilt solved problems
3. We caught ourselves and corrected

Add new clarifications as needed to prevent future tangents.

## Remember

**Principles serve the goal. The goal doesn't serve principles.**

The goal: Help developers build better web apps with zero runtime dependencies.

Everything else is negotiable.