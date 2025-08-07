# @brutal/bundles

> BRUTAL V5 Bundle Configurations

## Purpose

This package manages the creation and validation of BRUTAL bundles with strict size limits.

## Bundles

### brutal-lite.js (15KB)
- **Use case**: Landing pages, static sites
- **Includes**: foundation + shared + templates + components (partial)
- **Init time**: <50ms

### brutal-core.js (35KB)
- **Use case**: Single Page Applications (SPAs)
- **Includes**: All 11 core packages
- **Init time**: <300ms

### brutal-enhanced.js (55KB)
- **Use case**: Complex applications
- **Includes**: Core + enhanced packages
- **Init time**: <500ms
- **Status**: Pending enhanced packages

### brutal-ui.js (85KB)
- **Use case**: Full component library
- **Includes**: Enhanced + UI components
- **Init time**: <700ms
- **Status**: Pending UI packages

### brutal-full.js (155KB)
- **Use case**: Enterprise applications
- **Includes**: Everything included
- **Init time**: <1000ms
- **Status**: Pending all packages

## Usage

```bash
# Build all available bundles
pnpm build

# Build specific bundle
pnpm build:lite
pnpm build:core

# Check bundle sizes
pnpm size

# Run performance benchmarks
pnpm benchmark
```

## Size Budgets

Sizes are measured after gzip compression:

| Bundle | Max Size | Current | Status |
|--------|----------|---------|---------|
| lite | 15KB | - | ⏳ |
| core | 35KB | - | ⏳ |
| enhanced | 55KB | - | 🚫 |
| ui | 85KB | - | 🚫 |
| full | 155KB | - | 🚫 |

## Configuration

Each bundle has its own configuration in `src/configs/`. Configurations include:
- Entry points
- Tree shaking options
- Minification settings
- Size and performance budgets