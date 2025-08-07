/**
 * @brutal2/core - Type definitions
 * Zero dependencies, maximum flexibility
 */

// Component types
export interface ComponentConfig {
  name?: string;              // Custom element name
  tag?: string;               // Base HTML tag
  behaviors?: Behavior[];     // Composition behaviors
  state?: State;              // Initial state
  render?: RenderFunction;    // Render function
  style?: Styles;             // Component styles
  
  // Lifecycle hooks
  onMount?: () => void;
  onUnmount?: () => void;
  onUpdate?: (changes: StateChanges) => void;
  onError?: (error: Error) => void;
  
  // Attributes
  observedAttributes?: string[];
  onAttributeChange?: (name: string, oldValue: string | null, newValue: string | null) => void;
}

// Behavior is a function that enhances an element
export type Behavior = (element: any) => any;

// State can be any object
export type State = Record<string, any>;

// State changes
export type StateChanges = Record<string, any>;

// Render function returns a template
export type RenderFunction = (this: Component) => Template;

// Template representation
export interface Template {
  strings: TemplateStringsArray;
  values: any[];
  key?: string;
}

// Styles can be string or object
export type Styles = string | Record<string, any>;

// Component instance
export interface Component extends HTMLElement {
  state: State;
  render?: RenderFunction;
  update: () => void;
  subscribe: (listener: StateListener) => () => void;
}

// State listener
export type StateListener = (changes: StateChanges) => void;

// Event handlers
export type EventHandlers = Record<string, EventHandler>;
export type EventHandler = (event: Event) => void;

// Lifecycle hooks
export interface LifecycleHooks {
  onMount?: () => void;
  onUnmount?: () => void;
  onUpdate?: (changes: StateChanges) => void;
  onError?: (error: Error) => void;
}