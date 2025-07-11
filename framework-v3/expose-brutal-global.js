/**
 * Fix: Expose BRUTAL globally for debugging and testing
 */

// Add to index.js after framework initialization
import { stateRegistry } from './01-core/State.js';
import { registry } from './01-core/Registry.js';

// Expose BRUTAL framework globally
window.__BRUTAL__ = {
    version: '3.0.0',
    initialized: true,
    debug: true,
    
    // Core modules
    components: registry,
    state: stateRegistry,
    
    // Utilities
    utils: {
        createState: (name, initial) => stateRegistry.get(name) || stateRegistry.set(name, initial),
        getComponent: (name) => registry.get(name),
        listComponents: () => registry.getNames()
    },
    
    // Performance metrics
    performance: {
        getMetrics: () => ({
            components: registry.getMetrics(),
            states: Array.from(stateRegistry.values()).map(s => s.getMetrics())
        })
    },
    
    // Testing helpers
    test: {
        clearAll: () => {
            registry.clear();
            stateRegistry.clear();
        }
    }
};

