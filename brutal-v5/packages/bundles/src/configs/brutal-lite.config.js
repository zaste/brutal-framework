/**
 * BRUTAL-LITE Bundle Configuration
 * Target: 15KB - For landing pages
 * Includes: foundation + shared + templates + components (partial)
 */

export const brutalLiteConfig = {
  name: 'brutal-lite',
  maxSize: 15 * 1024, // 15KB
  maxInitTime: 50, // 50ms
  
  // Entry points - only essential exports
  entry: {
    // Foundation essentials
    foundation: [
      '../@brutal/foundation/src/polyfills/index.ts',
      '../@brutal/foundation/src/config/index.ts'
    ],
    
    // Shared utilities - only critical ones
    shared: [
      '../@brutal/shared/src/errors/index.ts',
      '../@brutal/shared/src/dom/index.ts',
      '../@brutal/shared/src/sanitize/index.ts'
    ],
    
    // Templates - full package (lightweight)
    templates: '../@brutal/templates/src/index.ts',
    
    // Components - only base component
    components: [
      '../@brutal/components/src/base/brutal-component.ts',
      '../@brutal/components/src/registry/index.ts'
    ]
  },
  
  // External dependencies (none for BRUTAL)
  external: [],
  
  // Output configuration
  output: {
    file: 'dist/brutal-lite.js',
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