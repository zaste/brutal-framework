# Decision: Template Cache Strategy

**Status**: Pending  
**Date**: 2024-07-12

## Context

Template caching significantly improves performance by avoiding re-parsing of templates. We need to decide how aggressive the caching should be.

## Options

### Option A: Cache everything by default
- **Memory Impact**: Higher (stores all templates)
- **Performance**: Fastest after initial parse
- **Pros**: 
  - Maximum performance
  - Simple mental model
- **Cons**: 
  - Memory usage grows with template count
  - No automatic cleanup

### Option B: LRU cache with size limit
- **Memory Impact**: Bounded (configurable limit)
- **Performance**: Good for frequently used templates
- **Pros**: 
  - Balanced approach
  - Predictable memory usage
  - Auto-evicts unused templates
- **Cons**: 
  - Slightly more complex
  - Cache misses possible

### Option C: Minimal caching
- **Memory Impact**: Lowest
- **Performance**: Slower (more re-parsing)
- **Pros**: 
  - Minimal memory footprint
  - Simple implementation
- **Cons**: 
  - Performance penalty
  - CPU usage for re-parsing

## Recommendation

**Option B** - LRU cache with configurable size limit

Default to 100 templates, but allow configuration. This balances performance with memory efficiency.

## Decision

**Pending your input**

## Consequences

Once decided:
- Implement caching strategy in `@brutal/templates`
- Add configuration options
- Document memory/performance tradeoffs