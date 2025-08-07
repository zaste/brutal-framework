/**
 * Core types for BRUTAL framework
 */

// Enhanced element type
export interface BrutalElement extends HTMLElement {
  state?: any;
  props?: any;
  update?: () => void;
  on?: (event: string, handler: EventListener) => BrutalElement;
  off?: (event: string, handler: EventListener) => BrutalElement;
  mount?: () => BrutalElement;
  unmount?: () => BrutalElement;
}

// Behavior type
export type Behavior<T = HTMLElement> = (element: T) => T;

// State options
export interface StateOptions<T> {
  initial: T;
  onChange?: (newState: T, oldState: T) => void;
}

// Event map
export interface EventMap {
  [key: string]: EventListener;
}

// Lifecycle hooks
export interface Lifecycle {
  onMount?: () => void;
  onUnmount?: () => void;
  onUpdate?: () => void;
}