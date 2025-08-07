/**
 * Create reactive stores with zero boilerplate
 */
/**
 * Creates a reactive store from config object
 * Actions are functions, everything else is state
 */
export function createStore(config) {
    // Separate state from actions
    const state = {};
    const actions = {};
    for (const [key, value] of Object.entries(config)) {
        if (typeof value === 'function') {
            actions[key] = value;
        }
        else {
            state[key] = value;
        }
    }
    // Subscribers
    const subscribers = new Set();
    // Create reactive proxy
    const store = new Proxy(state, {
        get(target, prop) {
            // Special methods
            if (prop === 'subscribe') {
                return (fn) => {
                    subscribers.add(fn);
                    fn(target); // Call immediately
                    return () => subscribers.delete(fn);
                };
            }
            // Actions
            if (prop in actions) {
                return (...args) => {
                    const updates = actions[prop](target, ...args);
                    if (updates && typeof updates === 'object') {
                        Object.assign(target, updates);
                        subscribers.forEach(fn => fn(target));
                    }
                    return updates;
                };
            }
            // State
            return target[prop];
        },
        set(target, prop, value) {
            target[prop] = value;
            subscribers.forEach(fn => fn(target));
            return true;
        }
    });
    return store;
}
