/**
 * DOM event handlers and delegation
 */

import type { DOMEventOptions, EventHandler } from '../types/index.js';
import { debounce, throttle } from '@brutal/shared';

export interface DelegationHandler {
  selector: string;
  handler: EventListener;
  options?: AddEventListenerOptions;
}

export class DOMEventManager {
  private handlers = new Map<string, Map<Element, DelegationHandler[]>>();
  private listeners = new Map<Element, Map<string, EventListener>>();
  
  /**
   * Add delegated event listener
   */
  delegate(
    element: Element,
    event: string,
    selector: string,
    handler: EventListener,
    options?: DOMEventOptions
  ): () => void {
    const wrappedHandler = this.wrapHandler(handler, options);
    const delegatedHandler = this.createDelegatedHandler(selector, wrappedHandler, options);
    
    // Store delegation info
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Map());
    }
    
    const eventHandlers = this.handlers.get(event)!;
    if (!eventHandlers.has(element)) {
      eventHandlers.set(element, []);
      
      // Add root listener
      this.addRootListener(element, event, options);
    }
    
    eventHandlers.get(element)!.push({
      selector,
      handler: wrappedHandler,
      options
    });
    
    // Return cleanup function
    return () => {
      const handlers = eventHandlers.get(element);
      if (handlers) {
        const index = handlers.findIndex(h => h.handler === wrappedHandler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
        
        // Remove root listener if no more handlers
        if (handlers.length === 0) {
          this.removeRootListener(element, event);
          eventHandlers.delete(element);
        }
      }
    };
  }
  
  /**
   * Add direct event listener
   */
  on(
    element: Element,
    event: string,
    handler: EventListener,
    options?: DOMEventOptions
  ): () => void {
    const wrappedHandler = this.wrapHandler(handler, options);
    
    // Add listener
    element.addEventListener(event, wrappedHandler, options);
    
    // Store for cleanup
    if (!this.listeners.has(element)) {
      this.listeners.set(element, new Map());
    }
    this.listeners.get(element)!.set(event, wrappedHandler);
    
    // Return cleanup function
    return () => {
      element.removeEventListener(event, wrappedHandler, options);
      const elementListeners = this.listeners.get(element);
      if (elementListeners) {
        elementListeners.delete(event);
        if (elementListeners.size === 0) {
          this.listeners.delete(element);
        }
      }
    };
  }
  
  /**
   * Remove all listeners for an element
   */
  removeAll(element: Element): void {
    // Remove direct listeners
    const elementListeners = this.listeners.get(element);
    if (elementListeners) {
      elementListeners.forEach((handler, event) => {
        element.removeEventListener(event, handler);
      });
      this.listeners.delete(element);
    }
    
    // Remove delegated listeners
    this.handlers.forEach((eventHandlers, event) => {
      if (eventHandlers.has(element)) {
        this.removeRootListener(element, event);
        eventHandlers.delete(element);
      }
    });
  }
  
  /**
   * Clear all listeners
   */
  clear(): void {
    // Remove all direct listeners
    this.listeners.forEach((elementListeners, element) => {
      elementListeners.forEach((handler, event) => {
        element.removeEventListener(event, handler);
      });
    });
    this.listeners.clear();
    
    // Remove all delegated listeners
    this.handlers.forEach((eventHandlers, event) => {
      eventHandlers.forEach((_, element) => {
        this.removeRootListener(element, event);
      });
    });
    this.handlers.clear();
  }
  
  private wrapHandler(
    handler: EventListener,
    options?: DOMEventOptions
  ): EventListener {
    let wrappedHandler = handler;
    
    // Apply throttle/debounce
    if (options?.throttle) {
      wrappedHandler = throttle(wrappedHandler as any, options.throttle) as any;
    } else if (options?.debounce) {
      wrappedHandler = debounce(wrappedHandler as any, options.debounce) as any;
    }
    
    // Apply preventDefault/stopPropagation
    if (options?.preventDefault || options?.stopPropagation) {
      const originalHandler = wrappedHandler;
      wrappedHandler = (event: Event) => {
        if (options.preventDefault) event.preventDefault();
        if (options.stopPropagation) event.stopPropagation();
        originalHandler(event);
      };
    }
    
    return wrappedHandler;
  }
  
  private createDelegatedHandler(
    selector: string,
    handler: EventListener,
    options?: DOMEventOptions
  ): EventListener {
    return (event: Event) => {
      const target = event.target as Element;
      const delegateTarget = target.closest(selector);
      
      if (delegateTarget) {
        // Create a new event with delegateTarget
        const delegatedEvent = Object.create(event, {
          delegateTarget: {
            value: delegateTarget,
            writable: false
          },
          currentTarget: {
            value: delegateTarget,
            writable: false
          }
        });
        
        handler.call(delegateTarget, delegatedEvent);
      }
    };
  }
  
  private addRootListener(
    element: Element,
    event: string,
    options?: AddEventListenerOptions
  ): void {
    const rootHandler = (e: Event) => {
      const handlers = this.handlers.get(event)?.get(element);
      if (!handlers) return;
      
      for (const { selector, handler } of handlers) {
        const target = e.target as Element;
        const delegateTarget = target.closest(selector);
        
        if (delegateTarget && element.contains(delegateTarget)) {
          // Create delegated event
          const delegatedEvent = Object.create(e, {
            delegateTarget: {
              value: delegateTarget,
              writable: false
            },
            currentTarget: {
              value: delegateTarget,
              writable: false
            }
          });
          
          handler.call(delegateTarget, delegatedEvent);
        }
      }
    };
    
    element.addEventListener(event, rootHandler, options);
    
    // Store root handler for cleanup
    if (!this.listeners.has(element)) {
      this.listeners.set(element, new Map());
    }
    this.listeners.get(element)!.set(`__delegate_${event}`, rootHandler);
  }
  
  private removeRootListener(element: Element, event: string): void {
    const elementListeners = this.listeners.get(element);
    const rootHandler = elementListeners?.get(`__delegate_${event}`);
    
    if (rootHandler) {
      element.removeEventListener(event, rootHandler);
      elementListeners!.delete(`__delegate_${event}`);
      
      if (elementListeners!.size === 0) {
        this.listeners.delete(element);
      }
    }
  }
}

// Global instance
export const domEvents = new DOMEventManager();

/**
 * Custom event utilities
 */
export function emit<T = any>(
  target: EventTarget,
  event: string,
  detail?: T,
  options?: CustomEventInit
): boolean {
  const customEvent = new CustomEvent(event, {
    bubbles: true,
    cancelable: true,
    composed: false,
    ...options,
    detail
  });
  
  return target.dispatchEvent(customEvent);
}

export function createEvent<T = any>(
  event: string,
  detail?: T,
  options?: CustomEventInit
): CustomEvent<T> {
  return new CustomEvent(event, {
    bubbles: true,
    cancelable: true,
    composed: false,
    ...options,
    detail
  });
}