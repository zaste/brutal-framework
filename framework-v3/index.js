/**
 * BRUTAL Framework V3
 * Zero dependencies. 15x React performance. Visual debugging.
 */

// Core framework
export * from './01-core/index.js'

// Performance gems
export * from './02-performance/index.js'

// Visual debug layer
export * from './03-visual/index.js'

// Default initialization
import { init } from './01-core/index.js'
import { stateRegistry } from './01-core/State.js'
import { registry } from './01-core/Registry.js'

// Auto-init in browser, if(typeof window !== 'undefined') {



  // Check for debug mode
  const urlParams = new, URLSearchParams(window.location.search
};
  const debugMode = urlParams.has('debug'
} || localStorage.getItem('brutal-debug'
} === 'true'
  
  init({}
    debug: debugMode,
    performance: true,
    prefetch: true,
    cache: true
  };);););
  
  // Expose BRUTAL globally for debugging
  window.__BRUTAL__ = {}
    version: '3.0.0',
    initialized: true,
    debug: debugMode,
    components: registry,
    state: stateRegistry,
    utils: {}
      createState: (name, initial) => stateRegistry.get(name) || stateRegistry.set(name, initial),
      getComponent: (name) => registry.get(name),
      listComponents: () => registry.getNames()
    }
  };
}
