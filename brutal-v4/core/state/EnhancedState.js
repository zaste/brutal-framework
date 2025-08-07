/**
 * BRUTAL V4 - Enhanced State Management
 * BrutalState with EventBus integration and computed properties
 * Builds on existing State.js with new capabilities
 */

import { BrutalState } from './State.js';
import { globalEventBus } from '../events/EventBus.js';
import { PolyfillStrategy } from '../base/PolyfillStrategy.js';

// WeakMap for computed properties
const computedProperties = new WeakMap();
const stateHistory = new WeakMap();

export class EnhancedBrutalState extends BrutalState {
    constructor(initialState = {}, options = {}) {
        super(initialState);
        
        // Enhanced options
        this._options = {
            enableHistory: options.enableHistory || false,
            maxHistorySize: options.maxHistorySize || 50,
            enableComputed: options.enableComputed || true,
            persistKey: options.persistKey || null,
            ...options
        };
        
        // Initialize enhancements
        this._computed = new Map();
        this._watchers = new Map();
        
        if (this._options.enableHistory) {
            stateHistory.set(this, {
                past: [],
                future: [],
                maxSize: this._options.maxHistorySize
            });
        }
        
        if (this._options.persistKey) {
            this._loadPersistedState();
        }
        
        // Integration with EventBus
        this._setupEventBusIntegration();
    }

    /**
     * Define computed property
     */
    computed(name, computeFn, dependencies = []) {
        if (!this._options.enableComputed) {
            throw new Error('Computed properties not enabled');
        }

        this._computed.set(name, {
            compute: computeFn,
            dependencies,
            cached: null,
            dirty: true
        });

        // Create getter on state proxy
        Object.defineProperty(this._state, name, {
            get: () => this._getComputed(name),
            enumerable: true,
            configurable: true
        });

        // Mark dirty when dependencies change
        dependencies.forEach(dep => {
            this.watch(dep, () => {
                const computed = this._computed.get(name);
                if (computed) {
                    computed.dirty = true;
                    computed.cached = null;
                }
            });
        });
    }

    /**
     * Get computed value
     */
    _getComputed(name) {
        const computed = this._computed.get(name);
        if (!computed) return undefined;

        if (computed.dirty) {
            computed.cached = computed.compute(this._state);
            computed.dirty = false;
        }

        return computed.cached;
    }

    /**
     * Watch state changes
     */
    watch(path, handler, options = {}) {
        const { immediate = false, deep = false } = options;
        
        if (!this._watchers.has(path)) {
            this._watchers.set(path, new Set());
        }

        const watcher = {
            handler,
            deep,
            id: Symbol('watcher')
        };

        this._watchers.get(path).add(watcher);

        // Call immediately if requested
        if (immediate) {
            handler(this.get(path), undefined);
        }

        // Return unwatch function
        return () => {
            const watchers = this._watchers.get(path);
            if (watchers) {
                watchers.delete(watcher);
                if (watchers.size === 0) {
                    this._watchers.delete(path);
                }
            }
        };
    }

    /**
     * Enhanced set with history tracking
     */
    set(path, value) {
        if (this._options.enableHistory) {
            this._saveHistory();
        }

        const oldValue = this.get(path);
        super.set(path, value);

        // Trigger watchers
        this._triggerWatchers(path, value, oldValue);

        // Persist if enabled
        if (this._options.persistKey) {
            this._persistState();
        }

        // Emit to EventBus
        globalEventBus.emit('state:changed', {
            path,
            value,
            oldValue,
            state: this
        });
    }

    /**
     * Time travel - undo
     */
    undo() {
        if (!this._options.enableHistory) {
            throw new Error('History not enabled');
        }

        const history = stateHistory.get(this);
        if (!history || history.past.length === 0) return false;

        const current = this._createSnapshot();
        const previous = history.past.pop();

        history.future.unshift(current);
        if (history.future.length > history.maxSize) {
            history.future.pop();
        }

        this._restoreSnapshot(previous);
        return true;
    }

    /**
     * Time travel - redo
     */
    redo() {
        if (!this._options.enableHistory) {
            throw new Error('History not enabled');
        }

        const history = stateHistory.get(this);
        if (!history || history.future.length === 0) return false;

        const current = this._createSnapshot();
        const next = history.future.shift();

        history.past.push(current);
        if (history.past.length > history.maxSize) {
            history.past.shift();
        }

        this._restoreSnapshot(next);
        return true;
    }

    /**
     * Save current state to history
     */
    _saveHistory() {
        const history = stateHistory.get(this);
        if (!history) return;

        const snapshot = this._createSnapshot();
        history.past.push(snapshot);
        
        if (history.past.length > history.maxSize) {
            history.past.shift();
        }

        // Clear future on new change
        history.future = [];
    }

    /**
     * Create state snapshot
     */
    _createSnapshot() {
        return {
            state: JSON.parse(JSON.stringify(this._rawState)),
            timestamp: Date.now()
        };
    }

    /**
     * Restore state from snapshot
     */
    _restoreSnapshot(snapshot) {
        this._rawState = snapshot.state;
        this._state = this._createProxy(this._rawState);
        this._notifySubscribers();
    }

    /**
     * Trigger watchers for path
     */
    _triggerWatchers(path, newValue, oldValue) {
        // Direct watchers
        const watchers = this._watchers.get(path);
        if (watchers) {
            watchers.forEach(watcher => {
                try {
                    watcher.handler(newValue, oldValue);
                } catch (error) {
                    console.error('Watcher error:', error);
                }
            });
        }

        // Check parent paths for deep watchers
        const parts = path.split('.');
        for (let i = parts.length - 1; i > 0; i--) {
            const parentPath = parts.slice(0, i).join('.');
            const parentWatchers = this._watchers.get(parentPath);
            
            if (parentWatchers) {
                parentWatchers.forEach(watcher => {
                    if (watcher.deep) {
                        try {
                            watcher.handler(this.get(parentPath), undefined);
                        } catch (error) {
                            console.error('Deep watcher error:', error);
                        }
                    }
                });
            }
        }
    }

    /**
     * Setup EventBus integration
     */
    _setupEventBusIntegration() {
        // Listen for external state requests
        globalEventBus.on('state:request', ({ stateId, path }) => {
            if (stateId === this._options.persistKey) {
                globalEventBus.emit('state:response', {
                    stateId,
                    path,
                    value: this.get(path)
                });
            }
        });
    }

    /**
     * Persist state to storage
     */
    _persistState() {
        if (!this._options.persistKey) return;

        try {
            const data = {
                state: this._rawState,
                timestamp: Date.now(),
                version: '1.0'
            };

            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(
                    `brutal-state:${this._options.persistKey}`,
                    JSON.stringify(data)
                );
            }
        } catch (error) {
            console.warn('Failed to persist state:', error);
        }
    }

    /**
     * Load persisted state
     */
    _loadPersistedState() {
        if (!this._options.persistKey) return;

        try {
            if (typeof localStorage !== 'undefined') {
                const stored = localStorage.getItem(
                    `brutal-state:${this._options.persistKey}`
                );

                if (stored) {
                    const data = JSON.parse(stored);
                    this._rawState = { ...this._rawState, ...data.state };
                    this._state = this._createProxy(this._rawState);
                }
            }
        } catch (error) {
            console.warn('Failed to load persisted state:', error);
        }
    }

    /**
     * Get state statistics
     */
    getStats() {
        const stats = {
            updateCount: this._updateCount,
            lastUpdate: this._lastUpdate,
            computedCount: this._computed.size,
            watcherCount: Array.from(this._watchers.values())
                .reduce((sum, set) => sum + set.size, 0)
        };

        if (this._options.enableHistory) {
            const history = stateHistory.get(this);
            stats.historySize = history ? history.past.length : 0;
            stats.futureSize = history ? history.future.length : 0;
        }

        return stats;
    }

    /**
     * Clear all enhancements
     */
    cleanup() {
        super.cleanup();
        
        this._computed.clear();
        this._watchers.clear();
        
        if (this._options.enableHistory) {
            stateHistory.delete(this);
        }
    }
}

// Factory function with SharedArrayBuffer support check
export function createEnhancedState(initialState = {}, options = {}) {
    // Check for SharedArrayBuffer support if requested
    if (options.useSharedMemory && PolyfillStrategy.detect('sharedArrayBuffer')) {
        console.log('SharedArrayBuffer support detected for state');
        // Future: Implement shared memory state
    }

    return new EnhancedBrutalState(initialState, options);
}