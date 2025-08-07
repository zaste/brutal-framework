/**
 * Event Handling Pattern Test
 * Efficient event management without libraries
 */

describe('Event Handling Pattern', () => {
  /**
   * Event delegation pattern
   * Handle events efficiently at parent level
   */
  it('demonstrates event delegation', () => {
    // THE PATTERN - Event delegation
    const delegate = (
      parent: HTMLElement,
      eventType: string,
      selector: string,
      handler: (event: Event, target: Element) => void
    ) => {
      const listener = (event: Event) => {
        const target = event.target as Element;
        const delegateTarget = target.closest(selector);
        
        if (delegateTarget && parent.contains(delegateTarget)) {
          handler(event, delegateTarget);
        }
      };
      
      parent.addEventListener(eventType, listener);
      
      // Return cleanup function
      return () => parent.removeEventListener(eventType, listener);
    };
    
    // Example: Handle clicks on all buttons in a container
    const container = document.createElement('div');
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    const nested = document.createElement('span');
    
    button1.className = 'action-btn';
    button2.className = 'action-btn';
    button1.appendChild(nested); // Nested element
    
    container.appendChild(button1);
    container.appendChild(button2);
    
    let clickedElement: Element | null = null;
    
    // Delegate click handling
    const cleanup = delegate(container, 'click', '.action-btn', (event, target) => {
      clickedElement = target;
    });
    
    // Click on button
    button1.click();
    expect(clickedElement).toBe(button1);
    
    // Click on nested element still triggers handler with button as target
    nested.click();
    expect(clickedElement).toBe(button1);
    
    // Click on other button
    button2.click();
    expect(clickedElement).toBe(button2);
    
    // Cleanup
    cleanup();
    clickedElement = null;
    button1.click();
    expect(clickedElement).toBeNull(); // No longer handled
  });
  
  /**
   * Event emitter pattern
   * Custom events without libraries
   */
  it('demonstrates custom event emitter', () => {
    // Minimal event emitter
    const createEmitter = () => {
      const events = new Map<string, Set<Function>>();
      
      return {
        on(event: string, handler: Function) {
          if (!events.has(event)) {
            events.set(event, new Set());
          }
          events.get(event)!.add(handler);
          
          // Return unsubscribe function
          return () => events.get(event)?.delete(handler);
        },
        
        off(event: string, handler?: Function) {
          if (handler) {
            events.get(event)?.delete(handler);
          } else {
            events.delete(event);
          }
        },
        
        emit(event: string, ...args: any[]) {
          events.get(event)?.forEach(handler => handler(...args));
        },
        
        once(event: string, handler: Function) {
          const wrapped = (...args: any[]) => {
            handler(...args);
            this.off(event, wrapped);
          };
          return this.on(event, wrapped);
        }
      };
    };
    
    const emitter = createEmitter();
    const results: any[] = [];
    
    // Subscribe to events
    const unsub1 = emitter.on('data', (value: any) => results.push(`1: ${value}`));
    const unsub2 = emitter.on('data', (value: any) => results.push(`2: ${value}`));
    
    emitter.emit('data', 'hello');
    expect(results).toEqual(['1: hello', '2: hello']);
    
    // Unsubscribe one
    unsub1();
    results.length = 0;
    
    emitter.emit('data', 'world');
    expect(results).toEqual(['2: world']);
    
    // Once listener
    emitter.once('special', (value: any) => results.push(`once: ${value}`));
    
    emitter.emit('special', 'first');
    emitter.emit('special', 'second');
    
    expect(results).toEqual(['2: world', 'once: first']);
  });
  
  /**
   * Debounce and throttle patterns
   * Control event frequency
   */
  it('demonstrates debounce and throttle', () => {
    jest.useFakeTimers();
    
    // Debounce pattern - delays execution until quiet period
    const debounce = (fn: Function, delay: number) => {
      let timeout: NodeJS.Timeout;
      
      return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
      };
    };
    
    // Throttle pattern - limits execution frequency
    const throttle = (fn: Function, limit: number) => {
      let inThrottle = false;
      
      return (...args: any[]) => {
        if (!inThrottle) {
          fn(...args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    };
    
    // Test debounce
    let debounceCount = 0;
    const debounced = debounce(() => debounceCount++, 100);
    
    debounced();
    debounced();
    debounced(); // Only this one executes
    
    expect(debounceCount).toBe(0);
    jest.advanceTimersByTime(100);
    expect(debounceCount).toBe(1);
    
    // Test throttle
    let throttleCount = 0;
    const throttled = throttle(() => throttleCount++, 100);
    
    throttled(); // Executes immediately
    throttled(); // Ignored
    throttled(); // Ignored
    
    expect(throttleCount).toBe(1);
    
    jest.advanceTimersByTime(100);
    throttled(); // Executes after cooldown
    expect(throttleCount).toBe(2);
    
    jest.useRealTimers();
  });
  
  /**
   * Event bus pattern for component communication
   * Global events without coupling
   */
  it('demonstrates event bus', () => {
    // Global event bus
    const eventBus = (() => {
      const target = new EventTarget();
      
      return {
        emit(type: string, detail?: any) {
          target.dispatchEvent(new CustomEvent(type, { detail }));
        },
        
        on(type: string, handler: (event: CustomEvent) => void) {
          target.addEventListener(type, handler as EventListener);
          return () => target.removeEventListener(type, handler as EventListener);
        },
        
        once(type: string, handler: (event: CustomEvent) => void) {
          const wrapped = (event: Event) => {
            handler(event as CustomEvent);
            target.removeEventListener(type, wrapped);
          };
          target.addEventListener(type, wrapped);
          return () => target.removeEventListener(type, wrapped);
        }
      };
    })();
    
    // Component A emits
    const componentA = {
      doSomething() {
        eventBus.emit('user:login', { username: 'brutal' });
      }
    };
    
    // Component B listens
    const componentB = {
      notifications: [] as string[],
      
      init() {
        return eventBus.on('user:login', (event) => {
          this.notifications.push(`Welcome ${event.detail.username}!`);
        });
      }
    };
    
    // Setup listener
    const cleanup = componentB.init();
    
    // Emit event
    componentA.doSomething();
    
    expect(componentB.notifications).toEqual(['Welcome brutal!']);
    
    // Cleanup
    cleanup();
    componentA.doSomething();
    expect(componentB.notifications).toHaveLength(1); // No new notifications
  });
  
  /**
   * DOM event enhancement pattern
   * Add convenience methods to elements
   */
  it('demonstrates DOM event enhancement', () => {
    // Event enhancement behavior
    const withEvents = (element: HTMLElement) => {
      const listeners = new Map<string, Set<Function>>();
      
      // Enhanced on method with chaining
      (element as any).on = function(
        events: string,
        handler: Function
      ) {
        events.split(' ').forEach(event => {
          if (!listeners.has(event)) {
            listeners.set(event, new Set());
            
            // Add single DOM listener per event type
            element.addEventListener(event, (e: Event) => {
              listeners.get(event)?.forEach(fn => fn(e));
            });
          }
          
          listeners.get(event)!.add(handler);
        });
        
        return this; // Enable chaining
      };
      
      // Enhanced off method
      (element as any).off = function(
        events?: string,
        handler?: Function
      ) {
        if (!events) {
          // Remove all listeners
          listeners.clear();
        } else {
          events.split(' ').forEach(event => {
            if (handler) {
              listeners.get(event)?.delete(handler);
            } else {
              listeners.delete(event);
            }
          });
        }
        
        return this;
      };
      
      // Trigger custom events
      (element as any).trigger = function(
        event: string,
        detail?: any
      ) {
        element.dispatchEvent(new CustomEvent(event, { detail }));
        return this;
      };
      
      return element;
    };
    
    // Create enhanced element
    const button = withEvents(document.createElement('button'));
    const clicks: Event[] = [];
    const hovers: Event[] = [];
    
    // Chain event handlers
    (button as any)
      .on('click', (e: Event) => clicks.push(e))
      .on('mouseenter mouseleave', (e: Event) => hovers.push(e))
      .on('click', (e: Event) => clicks.push(e)); // Multiple handlers
    
    // Trigger events
    button.click();
    expect(clicks).toHaveLength(2); // Both handlers called
    
    button.dispatchEvent(new MouseEvent('mouseenter'));
    expect(hovers).toHaveLength(1);
    
    // Remove specific handler
    const handler = (e: Event) => {};
    (button as any).on('test', handler).off('test', handler);
    
    // Trigger custom event
    let customData: any;
    (button as any).on('custom', (e: CustomEvent) => customData = e.detail);
    (button as any).trigger('custom', { value: 42 });
    
    expect(customData).toEqual({ value: 42 });
  });
});