/**
 * BRUTAL-CORE Bundle Configuration
 * Target: 35KB - For SPAs
 * Includes: All 11 core packages
 */

export const brutalCoreConfig = {
  name: 'brutal-core',
  maxSize: 35 * 1024, // 35KB
  maxInitTime: 300, // 300ms
  
  // Entry points - all core packages
  entry: {
    '@brutal/foundation': '../@brutal/foundation/src/index.ts',
    '@brutal/shared': '../@brutal/shared/src/index.ts',
    '@brutal/events': '../@brutal/events/src/index.ts',
    '@brutal/templates': '../@brutal/templates/src/index.ts',
    '@brutal/cache': '../@brutal/cache/src/index.ts',
    '@brutal/components': '../@brutal/components/src/index.ts',
    '@brutal/state': '../@brutal/state/src/index.ts',
    '@brutal/routing': '../@brutal/routing/src/index.ts',
    '@brutal/scheduling': '../@brutal/scheduling/src/index.ts',
    '@brutal/a11y': '../@brutal/a11y/src/index.ts',
    '@brutal/plugins': '../@brutal/plugins/src/index.ts'
  },
  
  // External dependencies (none for BRUTAL)
  external: [],
  
  // Output configuration
  output: {
    file: 'dist/brutal-core.js',
    format: 'es',
    compact: true,
    generatedCode: {
      constBindings: true,
      objectShorthand: true
    }
  },
  
  // Optimizations
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false
  },
  
  // Minification settings
  minify: {
    compress: {
      passes: 3,
      pure_getters: true,
      unsafe_arrows: true,
      unsafe_methods: true,
      unsafe_proto: true,
      toplevel: true
    },
    mangle: {
      properties: {
        regex: /^_/
      }
    },
    format: {
      comments: false
    }
  }
};