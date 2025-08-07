/**
 * Shared types and interfaces for BRUTAL V5
 */

/**
 * Component lifecycle hooks
 */
export interface LifecycleHooks {
  onMount?: () => void | Promise<void>;
  onUnmount?: () => void | Promise<void>;
  onUpdate?: (prev: any, next: any) => void | Promise<void>;
  onError?: (error: Error) => void;
}

/**
 * Component options
 */
export interface ComponentOptions {
  name?: string;
  props?: Record<string, any>;
  state?: Record<string, any>;
  methods?: Record<string, Function>;
  computed?: Record<string, () => any>;
  hooks?: LifecycleHooks;
}

/**
 * Event handler
 */
export type EventHandler<T = Event> = (event: T) => void | Promise<void>;

/**
 * Event listener options
 */
export interface EventOptions extends AddEventListenerOptions {
  selector?: string;
  throttle?: number;
  debounce?: number;
}

/**
 * Template data context
 */
export interface TemplateContext {
  props: Record<string, any>;
  state: Record<string, any>;
  methods: Record<string, Function>;
  computed: Record<string, any>;
  slots?: Record<string, any>;
}

/**
 * Route definition
 */
export interface RouteDefinition {
  path: string;
  component?: any;
  redirect?: string;
  guards?: RouteGuard[];
  meta?: Record<string, any>;
  children?: RouteDefinition[];
}

/**
 * Route guard
 */
export type RouteGuard = (to: Route, from: Route) => boolean | Promise<boolean>;

/**
 * Route object
 */
export interface Route {
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  hash: string;
  meta: Record<string, any>;
}

/**
 * State change listener
 */
export type StateListener<T = any> = (newValue: T, oldValue: T) => void;

/**
 * State options
 */
export interface StateOptions {
  persist?: boolean;
  storage?: 'local' | 'session' | 'memory';
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
}

/**
 * Plugin definition
 */
export interface Plugin {
  name: string;
  version?: string;
  install: (brutal: any, options?: any) => void | Promise<void>;
}

/**
 * Configuration options
 */
export interface BrutalConfig {
  debug?: boolean;
  strict?: boolean;
  plugins?: Plugin[];
  components?: Record<string, any>;
  directives?: Record<string, any>;
  filters?: Record<string, Function>;
}

/**
 * Virtual node
 */
export interface VNode {
  type: string | Function;
  props: Record<string, any>;
  children: VNode[];
  key?: string | number;
  ref?: any;
}

/**
 * Render function
 */
export type RenderFunction = (context: TemplateContext) => VNode;

/**
 * Async component
 */
export type AsyncComponent = () => Promise<any>;

/**
 * Component instance
 */
export interface ComponentInstance {
  $el: HTMLElement;
  $props: Record<string, any>;
  $state: Record<string, any>;
  $parent?: ComponentInstance;
  $children: ComponentInstance[];
  $refs: Record<string, HTMLElement | ComponentInstance>;
  $emit: (event: string, ...args: any[]) => void;
  $on: (event: string, handler: Function) => () => void;
  $off: (event: string, handler?: Function) => void;
  $nextTick: (fn: () => void) => Promise<void>;
  $forceUpdate: () => void;
  $destroy: () => void;
}

/**
 * Directive definition
 */
export interface DirectiveDefinition {
  bind?: (el: HTMLElement, binding: DirectiveBinding) => void;
  inserted?: (el: HTMLElement, binding: DirectiveBinding) => void;
  update?: (el: HTMLElement, binding: DirectiveBinding) => void;
  unbind?: (el: HTMLElement, binding: DirectiveBinding) => void;
}

/**
 * Directive binding
 */
export interface DirectiveBinding {
  value: any;
  oldValue?: any;
  arg?: string;
  modifiers: Record<string, boolean>;
}

/**
 * Transition hooks
 */
export interface TransitionHooks {
  onBeforeEnter?: (el: HTMLElement) => void;
  onEnter?: (el: HTMLElement, done: () => void) => void;
  onAfterEnter?: (el: HTMLElement) => void;
  onBeforeLeave?: (el: HTMLElement) => void;
  onLeave?: (el: HTMLElement, done: () => void) => void;
  onAfterLeave?: (el: HTMLElement) => void;
}

/**
 * Store definition
 */
export interface StoreDefinition<S = any, A = any> {
  state: S | (() => S);
  actions?: A;
  getters?: Record<string, (state: S) => any>;
  mutations?: Record<string, (state: S, payload?: any) => void>;
}

/**
 * Middleware function
 */
export type Middleware = (context: any, next: () => void | Promise<void>) => void | Promise<void>;

/**
 * Error handler
 */
export type ErrorHandler = (error: Error, instance?: ComponentInstance) => void;

/**
 * Type guards
 */
export const isString = (val: unknown): val is string => typeof val === 'string';
export const isNumber = (val: unknown): val is number => typeof val === 'number';
export const isBoolean = (val: unknown): val is boolean => typeof val === 'boolean';
export const isFunction = (val: unknown): val is Function => typeof val === 'function';
export const isObject = (val: unknown): val is Record<string, any> => 
  val !== null && typeof val === 'object' && !Array.isArray(val);
export const isArray = Array.isArray;
export const isPromise = (val: unknown): val is Promise<any> => 
  val instanceof Promise || (isObject(val) && isFunction((val as any).then));

/**
 * Type utilities
 */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
export type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};
