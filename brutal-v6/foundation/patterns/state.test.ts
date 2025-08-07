/**
 * State Management Pattern Test
 * Reactive state without libraries
 */

describe('State Management Pattern', () => {
  /**
   * Basic reactive state using Proxy
   * This is the core pattern
   */
  it('demonstrates reactive state', () => {
    // THE PATTERN - Reactive state with Proxy
    const createState = <T extends object>(initial: T, onChange?: (key: keyof T, value: any) => void) => {
      return new Proxy(initial, {
        set(target, key, value) {
          const oldValue = target[key as keyof T];
          if (oldValue !== value) {
            target[key as keyof T] = value;
            onChange?.(key as keyof T, value);
          }
          return true;
        },
        get(target, key) {
          return target[key as keyof T];
        }
      });
    };
    
    // Track changes
    const changes: Array<{key: string, value: any}> = [];
    
    const state = createState({
      count: 0,
      name: 'BRUTAL'
    }, (key, value) => {
      changes.push({ key: String(key), value });
    });
    
    // Test reactivity
    state.count = 1;
    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ key: 'count', value: 1 });
    
    state.name = 'BRUTAL V6';
    expect(changes).toHaveLength(2);
    expect(changes[1]).toEqual({ key: 'name', value: 'BRUTAL V6' });
    
    // Same value doesn't trigger change
    state.count = 1;
    expect(changes).toHaveLength(2);
  });
  
  /**
   * State with computed values
   * Derived state pattern
   */
  it('demonstrates computed state', () => {
    // Computed values pattern
    const createComputedState = <T extends object, C extends object>(
      initial: T,
      computeds: { [K in keyof C]: (state: T) => C[K] }
    ) => {
      const state = new Proxy(initial, {
        set(target, key, value) {
          target[key as keyof T] = value;
          return true;
        }
      });
      
      const computed = {} as C;
      
      // Create getters for computed properties
      for (const [key, compute] of Object.entries(computeds)) {
        Object.defineProperty(computed, key, {
          get: () => compute(state),
          enumerable: true
        });
      }
      
      return { state, computed };
    };
    
    // Example: Shopping cart
    const cart = createComputedState(
      {
        items: [
          { name: 'Widget', price: 10, quantity: 2 },
          { name: 'Gadget', price: 20, quantity: 1 }
        ],
        discount: 0.1
      },
      {
        subtotal: (state) => 
          state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        total: (state) => {
          const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          return subtotal * (1 - state.discount);
        },
        itemCount: (state) =>
          state.items.reduce((sum, item) => sum + item.quantity, 0)
      }
    );
    
    expect(cart.computed.subtotal).toBe(40);
    expect(cart.computed.total).toBe(36);
    expect(cart.computed.itemCount).toBe(3);
    
    // Update state
    cart.state.items[0].quantity = 3;
    expect(cart.computed.subtotal).toBe(50);
    expect(cart.computed.total).toBe(45);
  });
  
  /**
   * State with history (undo/redo)
   * Time-travel pattern
   */
  it('demonstrates state history', () => {
    // State with history pattern
    const createHistoryState = <T extends object>(initial: T) => {
      const history: T[] = [JSON.parse(JSON.stringify(initial))];
      let currentIndex = 0;
      
      const state = new Proxy(initial, {
        set(target, key, value) {
          target[key as keyof T] = value;
          // Save new state to history
          currentIndex++;
          history.length = currentIndex + 1; // Remove any redo history
          history[currentIndex] = JSON.parse(JSON.stringify(target));
          return true;
        }
      });
      
      return {
        state,
        undo() {
          if (currentIndex > 0) {
            currentIndex--;
            Object.assign(state, history[currentIndex]);
          }
        },
        redo() {
          if (currentIndex < history.length - 1) {
            currentIndex++;
            Object.assign(state, history[currentIndex]);
          }
        },
        canUndo: () => currentIndex > 0,
        canRedo: () => currentIndex < history.length - 1
      };
    };
    
    const { state, undo, redo, canUndo, canRedo } = createHistoryState({
      text: 'Hello',
      bold: false
    });
    
    // Make changes
    state.text = 'Hello World';
    state.bold = true;
    
    expect(state.text).toBe('Hello World');
    expect(state.bold).toBe(true);
    expect(canUndo()).toBe(true);
    expect(canRedo()).toBe(false);
    
    // Undo
    undo();
    expect(state.text).toBe('Hello World');
    expect(state.bold).toBe(false);
    
    undo();
    expect(state.text).toBe('Hello');
    expect(state.bold).toBe(false);
    expect(canRedo()).toBe(true);
    
    // Redo
    redo();
    expect(state.text).toBe('Hello World');
    expect(state.bold).toBe(false);
  });
  
  /**
   * Component state pattern
   * How BRUTAL components manage state
   */
  it('demonstrates component state integration', () => {
    // Component with reactive state
    const withState = <T extends object>(initial: T) => (element: HTMLElement) => {
      const subscribers = new Set<() => void>();
      
      const state = new Proxy(initial, {
        set(target, key, value) {
          if (target[key as keyof T] !== value) {
            target[key as keyof T] = value;
            // Notify all subscribers
            subscribers.forEach(fn => fn());
          }
          return true;
        }
      });
      
      // Add state and update method to element
      (element as any).state = state;
      (element as any).subscribe = (fn: () => void) => {
        subscribers.add(fn);
        return () => subscribers.delete(fn); // Unsubscribe
      };
      (element as any).update = () => {
        // In real implementation, would re-render
        element.dispatchEvent(new CustomEvent('statechange', { 
          detail: state 
        }));
      };
      
      // Auto-update on state change
      subscribers.add(() => (element as any).update());
      
      return element;
    };
    
    // Create component
    const element = document.createElement('div');
    const enhanced = withState({ count: 0 })(element);
    
    // Listen for updates
    let updateCount = 0;
    enhanced.addEventListener('statechange', () => updateCount++);
    
    // Change state triggers update
    (enhanced as any).state.count = 1;
    expect(updateCount).toBe(1);
    expect((enhanced as any).state.count).toBe(1);
    
    // Subscribe to changes
    let customUpdateCount = 0;
    const unsubscribe = (enhanced as any).subscribe(() => customUpdateCount++);
    
    (enhanced as any).state.count = 2;
    expect(updateCount).toBe(2);
    expect(customUpdateCount).toBe(1);
    
    // Unsubscribe
    unsubscribe();
    (enhanced as any).state.count = 3;
    expect(customUpdateCount).toBe(1); // No longer updated
  });
});