/**
 * Composition Pattern Test
 * This test IS the documentation
 */

describe('Composition Pattern', () => {
  /**
   * The fundamental composition function
   * Copy this pattern exactly
   */
  it('demonstrates function composition', () => {
    // THE PATTERN - This is how we compose in BRUTAL
    const compose = (...fns: Function[]) => (x: any) => 
      fns.reduceRight((v, f) => f(v), x);
    
    // Example: Composing simple functions
    const add1 = (x: number) => x + 1;
    const double = (x: number) => x * 2;
    const square = (x: number) => x * x;
    
    // Compose executes right-to-left
    const addThenDouble = compose(double, add1);
    expect(addThenDouble(5)).toBe(12); // (5 + 1) * 2
    
    const doubleThenAdd = compose(add1, double);
    expect(doubleThenAdd(5)).toBe(11); // (5 * 2) + 1
    
    // Multiple compositions
    const complex = compose(square, double, add1);
    expect(complex(5)).toBe(144); // ((5 + 1) * 2)^2
  });
  
  /**
   * Composing behaviors for elements
   * This is how we enhance DOM elements
   */
  it('demonstrates element enhancement', () => {
    // Define behaviors as higher-order functions
    const withState = (initial: any) => (element: any) => {
      element.state = new Proxy(initial, {
        set(target, key, value) {
          target[key] = value;
          element.update?.();
          return true;
        }
      });
      return element;
    };
    
    const withEvents = (element: any) => {
      element.on = (event: string, handler: Function) => {
        element.addEventListener?.(event, handler);
        return element; // Enable chaining
      };
      element.off = (event: string, handler: Function) => {
        element.removeEventListener?.(event, handler);
        return element;
      };
      return element;
    };
    
    const withLifecycle = (element: any) => {
      element.mount = () => {
        element.onMount?.();
        return element;
      };
      element.unmount = () => {
        element.onUnmount?.();
        return element;
      };
      return element;
    };
    
    // Compose behaviors
    const compose = (...fns: Function[]) => (x: any) => 
      fns.reduceRight((v, f) => f(v), x);
    
    const enhance = compose(
      withLifecycle,
      withEvents,
      withState({ count: 0 })
    );
    
    // Mock element
    const element = { 
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
    
    // Apply enhancements
    const enhanced = enhance(element);
    
    // Verify all behaviors are applied
    expect(enhanced.state).toBeDefined();
    expect(enhanced.state.count).toBe(0);
    expect(enhanced.on).toBeDefined();
    expect(enhanced.off).toBeDefined();
    expect(enhanced.mount).toBeDefined();
    expect(enhanced.unmount).toBeDefined();
    
    // Test behavior interaction
    enhanced.on('click', () => {});
    expect(element.addEventListener).toHaveBeenCalled();
  });
  
  /**
   * Real-world component factory pattern
   * This is how BRUTAL components are built
   */
  it('demonstrates component factory', () => {
    // Component factory using composition
    const createComponent = (tag: string, behaviors: Function[]) => {
      const compose = (...fns: Function[]) => (x: any) => 
        fns.reduceRight((v, f) => f(v), x);
      
      const element = document.createElement(tag);
      return compose(...behaviors)(element);
    };
    
    // Reusable behaviors
    const clickable = (el: HTMLElement) => {
      el.onclick = () => el.classList.toggle('active');
      return el;
    };
    
    const hoverable = (el: HTMLElement) => {
      el.onmouseenter = () => el.classList.add('hover');
      el.onmouseleave = () => el.classList.remove('hover');
      return el;
    };
    
    const styled = (styles: Partial<CSSStyleDeclaration>) => (el: HTMLElement) => {
      Object.assign(el.style, styles);
      return el;
    };
    
    // Create a button with composed behaviors
    const button = createComponent('button', [
      clickable,
      hoverable,
      styled({ 
        padding: '10px',
        border: 'none',
        cursor: 'pointer'
      })
    ]);
    
    expect(button.tagName).toBe('BUTTON');
    expect(button.style.padding).toBe('10px');
    expect(button.onclick).toBeDefined();
    expect(button.onmouseenter).toBeDefined();
  });
  
  /**
   * Anti-pattern: Class inheritance
   * DO NOT DO THIS in BRUTAL
   */
  it('shows what NOT to do', () => {
    // ❌ WRONG - Class inheritance
    class BaseComponent {
      state = {};
      render() {}
    }
    
    class Button extends BaseComponent { // ❌ NO INHERITANCE
      click() {}
    }
    
    // ✅ CORRECT - Composition
    const withClickable = (element: any) => {
      element.click = () => {};
      return element;
    };
    
    const createButton = () => {
      const element = document.createElement('button');
      return withClickable(element);
    };
    
    // The composed version is simpler and more flexible
    const composed = createButton();
    expect(composed.click).toBeDefined();
  });
});