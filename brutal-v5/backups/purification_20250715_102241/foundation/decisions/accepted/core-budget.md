# Decision: 35KB Core Budget

**Status**: Accepted  
**Date**: 2024-07-10

## Context

Initial plan was 30KB for core, but after implementing V4 and analyzing real-world needs, we found this was too restrictive.

## Decision

Increase core bundle budget from 30KB to 35KB.

## Rationale

The additional 5KB allows for:
- Better error handling
- More complete polyfills
- Enhanced debugging in development
- SharedArrayBuffer support

## Breakdown

- @brutal/foundation: 6KB
- @brutal/shared: 4KB  
- @brutal/events: 5KB
- @brutal/templates: 7KB
- @brutal/components: 8KB
- @brutal/state: 6KB
- @brutal/routing: 6KB
- @brutal/cache: 5KB
- @brutal/scheduling: 3KB
- @brutal/a11y: 4KB
- @brutal/plugins: 4KB

Total: 58KB of packages → 35KB bundled (after tree-shaking and minification)

## Consequences

- Still extremely lightweight
- Competitive with Preact (3KB) + Router (4KB) + State
- Room for essential features
- No compromise on DX

## References

- V4 implementation showed 30KB was too tight
- Performance testing showed negligible difference between 30KB and 35KB
- User feedback prioritized features over 5KB savings