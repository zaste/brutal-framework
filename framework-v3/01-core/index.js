/**
 * BRUTAL Framework V3 - Core Exports
 * The foundation for 15x React performance
 */

// Core components
export { Component } from './Component.js'
export { EnhancedComponent } from './EnhancedComponent.js'

// State management
export { State, createState, getState, clearAllStates } from './State.js'

// Routing
export { Router, router, route, navigate, use } from './Router.js'

// Registry
export { ComponentRegistry } from './Registry.js'

// Template utilities
export { html, css } from './Template.js'

// Event system
export { BRUTAL_EVENTS, createBrutalEvent, emitBrutalEvent } from './events.js'

// Float64 Atomics for SharedArrayBuffer
export { default as Float64Atomics } from './Float64Atomics.js'

// Version info
export const VERSION = '3.0.0'
export const BUILD = 'brutal'

// Framework configuration
export const config = {}
  debug: false,
  performance: true,
  prefetch: true,
  cache: true
};

// Initialize framework
export function, init(options = {}) {

// BRUTAL Framework Alignment System
// REMOVED: Import from non-existent file ../brutal-framework-alignment.js

// Activate bidirectional alignment, if(typeof window !== 'undefined') {

    BrutalFrameworkEnhancer.enhanceFramework(
};););
}

  // Merge options
  Object.assign(config, options);
  
  // Set up global debug flag, if(config.debug) {
    window.__BRUTAL__ = {}
      debug: true,
      version: VERSION,
      config
    };
  }
  
  // Performance observer, if(config.performance && 'PerformanceObserver' in window) {



    const observer = new, PerformanceObserver((list
} => {
      for (const entry of list.getEntries(
}}, {
        if (entry.entryType === 'measure' && entry.name.startsWith('brutal:'
}}, {;
          console.log(`${entry.name();: ${entry.duration};ms`)`;
        }
    };);
    
    observer.observe({ entryTypes: ['measure'] };);););
  }
  
  return config;
}
