/**
 * StateStore - Simple reactive state management
 * No dependencies, event-based reactivity
 */

export class StateStore {
  constructor(initialState = {}) {
    this._state = { ...initialState };
    this._listeners = new Set();
    this._history = [];
    this._maxHistory = 50;
  }
  
  // Get current state
  getState() {
    return { ...this._state };
  }
  
  // Set state and notify listeners
  setState(updates) {
    const oldState = { ...this._state };
    
    // Save to history
    this._history.push(oldState);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }
    
    // Update state
    Object.assign(this._state, updates);
    
    // Notify listeners
    this._notify(this._state, oldState);
  }
  
  // Subscribe to state changes
  subscribe(listener) {
    this._listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this._listeners.delete(listener);
    };
  }
  
  // Notify all listeners
  _notify(newState, oldState) {
    this._listeners.forEach(listener => {
      try {
        listener(newState, oldState);
      } catch (error) {
        console.error('State listener error:', error);
      }
    });
  }
  
  // Get specific value
  get(key) {
    return this._state[key];
  }
  
  // Set specific value
  set(key, value) {
    this.setState({ [key]: value });
  }
  
  // Reset to initial state
  reset(initialState = {}) {
    this._state = { ...initialState };
    this._history = [];
    this._notify(this._state, {});
  }
  
  // Undo last change
  undo() {
    if (this._history.length > 0) {
      const previousState = this._history.pop();
      const currentState = { ...this._state };
      this._state = previousState;
      this._notify(this._state, currentState);
      return true;
    }
    return false;
  }
  
  // Get history
  getHistory() {
    return [...this._history];
  }
  
  // Connect to component
  connect(component) {
    // Subscribe component to state changes
    const unsubscribe = this.subscribe((state) => {
      component.setState(state);
    });
    
    // Store unsubscribe on component
    const originalCleanup = component.cleanup;
    component.cleanup = function() {
      unsubscribe();
      if (originalCleanup) {
        originalCleanup.call(this);
      }
    };
    
    // Set initial state
    component.setState(this.getState());
    
    return unsubscribe;
  }
}

// Global store management
const stores = new Map();

export function createStore(name, initialState = {}) {
  if (stores.has(name)) {
    console.warn(`Store "${name}" already exists`);
    return stores.get(name);
  }
  
  const store = new StateStore(initialState);
  stores.set(name, store);
  return store;
}

export function getStore(name) {
  return stores.get(name);
}

export function deleteStore(name) {
  return stores.delete(name);
}