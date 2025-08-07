/**
 * DOM utilities for BRUTAL V5
 * Zero-dependency DOM manipulation helpers
 */

export interface DOMElement extends HTMLElement {
  _brutal?: Record<string, any>;
}

export interface QueryOptions {
  root?: Element | Document;
  all?: boolean;
}

/**
 * Type-safe querySelector wrapper
 */
export function $(selector: string, options?: QueryOptions): HTMLElement | null;
export function $(selector: string, options: QueryOptions & { all: true }): NodeListOf<HTMLElement>;
export function $(selector: string, options?: QueryOptions): HTMLElement | NodeListOf<HTMLElement> | null {
  const root = options?.root || document;
  
  if (options?.all) {
    return root.querySelectorAll<HTMLElement>(selector);
  }
  
  return root.querySelector<HTMLElement>(selector);
}

/**
 * Create element with attributes
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, any>,
  children?: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key === 'class' && Array.isArray(value)) {
        element.className = value.filter(Boolean).join(' ');
      } else if (key.startsWith('on') && typeof value === 'function') {
        const event = key.slice(2).toLowerCase();
        element.addEventListener(event, value);
      } else if (key === 'data' && typeof value === 'object') {
        for (const [dataKey, dataValue] of Object.entries(value)) {
          element.dataset[dataKey] = String(dataValue);
        }
      } else if (value !== false && value != null) {
        element.setAttribute(key, String(value));
      }
    }
  }
  
  if (children) {
    for (const child of children) {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    }
  }
  
  return element;
}

/**
 * Add event listener with automatic cleanup
 */
export function on<K extends keyof HTMLElementEventMap>(
  element: Element | Window | Document,
  event: K,
  handler: (this: Element, ev: HTMLElementEventMap[K]) => any,
  options?: AddEventListenerOptions
): () => void {
  element.addEventListener(event as string, handler as EventListener, options);
  return () => element.removeEventListener(event as string, handler as EventListener, options);
}

/**
 * Delegate event handling
 */
export function delegate<K extends keyof HTMLElementEventMap>(
  element: Element,
  event: K,
  selector: string,
  handler: (this: Element, ev: HTMLElementEventMap[K], target: Element) => any
): () => void {
  const listener = (e: Event) => {
    const target = (e.target as Element)?.closest(selector);
    if (target) {
      handler.call(target, e as HTMLElementEventMap[K], target);
    }
  };
  
  return on(element, event, listener as any);
}

/**
 * Toggle classes
 */
export function toggleClass(element: Element, className: string, force?: boolean): boolean {
  return element.classList.toggle(className, force);
}

/**
 * Add multiple classes
 */
export function addClass(element: Element, ...classNames: string[]): void {
  element.classList.add(...classNames.filter(Boolean));
}

/**
 * Remove multiple classes
 */
export function removeClass(element: Element, ...classNames: string[]): void {
  element.classList.remove(...classNames.filter(Boolean));
}

/**
 * Check if element matches selector
 */
export function matches(element: Element, selector: string): boolean {
  return element.matches(selector);
}

/**
 * Get/set attributes
 */
export function attr(element: Element, name: string): string | null;
export function attr(element: Element, name: string, value: string | null): void;
export function attr(element: Element, attrs: Record<string, string | null>): void;
export function attr(
  element: Element,
  nameOrAttrs: string | Record<string, string | null>,
  value?: string | null
): string | null | void {
  if (typeof nameOrAttrs === 'string') {
    if (arguments.length === 2) {
      return element.getAttribute(nameOrAttrs);
    }
    if (value === null) {
      element.removeAttribute(nameOrAttrs);
    } else {
      element.setAttribute(nameOrAttrs, value!);
    }
  } else {
    for (const [key, val] of Object.entries(nameOrAttrs)) {
      if (val === null) {
        element.removeAttribute(key);
      } else {
        element.setAttribute(key, val);
      }
    }
  }
}

/**
 * Get/set data attributes
 */
export function data(element: HTMLElement, key: string): string | undefined;
export function data(element: HTMLElement, key: string, value: any): void;
export function data(element: HTMLElement, attrs: Record<string, any>): void;
export function data(
  element: HTMLElement,
  keyOrAttrs: string | Record<string, any>,
  value?: any
): string | undefined | void {
  if (typeof keyOrAttrs === 'string') {
    if (arguments.length === 2) {
      return element.dataset[keyOrAttrs];
    }
    element.dataset[keyOrAttrs] = String(value);
  } else {
    for (const [key, val] of Object.entries(keyOrAttrs)) {
      element.dataset[key] = String(val);
    }
  }
}

/**
 * Empty element (remove all children)
 */
export function empty(element: Element): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Replace element content
 */
export function html(element: Element, content: string): void {
  element.innerHTML = content;
}

/**
 * Get/set text content
 */
export function text(element: Element): string;
export function text(element: Element, content: string): void;
export function text(element: Element, content?: string): string | void {
  if (arguments.length === 1) {
    return element.textContent || '';
  }
  element.textContent = content!;
}

/**
 * Show/hide element
 */
export function show(element: HTMLElement): void {
  element.style.display = '';
}

export function hide(element: HTMLElement): void {
  element.style.display = 'none';
}

/**
 * Get element dimensions
 */
export function dimensions(element: Element): {
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
} {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom
  };
}

/**
 * Check if element is visible in viewport
 */
export function isInViewport(element: Element, threshold = 0): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= -threshold &&
    rect.left >= -threshold &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + threshold
  );
}

/**
 * Wait for DOM ready
 */
export function ready(fn: () => void): void {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

/**
 * DOM manipulation utilities
 */
export const dom = {
  $,
  createElement,
  on,
  delegate,
  toggleClass,
  addClass,
  removeClass,
  matches,
  attr,
  data,
  empty,
  html,
  text,
  show,
  hide,
  dimensions,
  isInViewport,
  ready
};

export default dom;
