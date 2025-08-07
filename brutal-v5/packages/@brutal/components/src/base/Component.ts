/**
 * Enhanced base component with full lifecycle and state management
 */

import { EventEmitter } from '@brutal/events';
import { compile } from '@brutal/templates';

export type PropType = 'string' | 'number' | 'boolean' | 'object' | 'array';
export type PropDefinition = {
  type: PropType;
  default?: any;
  required?: boolean;
  validator?: (value: any) => boolean;
};

export type Props = Record<string, PropDefinition>;
export type State = Record<string, any>;

// Lifecycle hooks
export type LifecycleHook = () => void | Promise<void>;

export interface ComponentOptions {
  props?: Props;
  template?: string;
  styles?: string;
}

// Ultra-compact component base class
export class Component extends HTMLElement {
  static observedAttributes: string[] = [];
  
  private _props: Record<string, any> = {};
  private _state: State = {};
  private _mounted = false;
  private _updating = false;
  private _emitter = new EventEmitter();
  private _renderFn?: (ctx: any) => string;
  private _watchers = new Map<string, Set<() => void>>();
  
  // Lifecycle hooks
  protected beforeMount?: LifecycleHook;
  protected mounted?: LifecycleHook;
  protected beforeUpdate?: LifecycleHook;
  protected updated?: LifecycleHook;
  protected beforeUnmount?: LifecycleHook;
  protected unmounted?: LifecycleHook;
  
  // Component definition
  protected props?: Props;
  protected template?: string;
  protected styles?: string;
  
  constructor(options?: ComponentOptions) {
    super();
    if (options) {
      this.props = options.props;
      this.template = options.template;
      this.styles = options.styles;
    }
    this._initProps();
  }
  
  // Web Components lifecycle
  connectedCallback() {
    if (!this._mounted) {
      this._mount();
    }
  }
  
  disconnectedCallback() {
    this._unmount();
  }
  
  attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null) {
    if (oldVal !== newVal) {
      this._updateProp(name, newVal);
    }
  }
  
  // Props management
  private _initProps() {
    if (!this.props) return;
    
    for (const [key, def] of Object.entries(this.props)) {
      // Set default values
      this._props[key] = def.default;
      
      // Create getter/setter
      Object.defineProperty(this, key, {
        get: () => this._props[key],
        set: (val) => this._setProp(key, val)
      });
    }
    
    // Set observed attributes
    (this.constructor as typeof Component).observedAttributes = Object.keys(this.props);
  }
  
  private _setProp(key: string, value: any) {
    const def = this.props?.[key];
    if (!def) return;
    
    // Validate
    if (def.validator && !def.validator(value)) {
      console.warn(`Invalid prop value for "${key}":`, value);
      return;
    }
    
    // Type coercion
    const coerced = this._coerceProp(value, def.type);
    
    if (this._props[key] !== coerced) {
      this._props[key] = coerced;
      this._notifyChange(`props.${key}`);
      if (this._mounted) {
        this._update();
      }
    }
  }
  
  private _updateProp(name: string, value: string | null) {
    const def = this.props?.[name];
    if (!def) return;
    
    if (value === null && def.required) {
      console.warn(`Required prop "${name}" removed`);
      return;
    }
    
    this._setProp(name, value);
  }
  
  private _coerceProp(value: any, type: PropType): any {
    if (value === null || value === undefined) return value;
    
    switch (type) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true' || value === '' || value === true;
      case 'object':
      case 'array':
        try {
          return typeof value === 'string' ? JSON.parse(value) : value;
        } catch {
          return type === 'array' ? [] : {};
        }
      default:
        return value;
    }
  }
  
  // State management
  get state(): State {
    return this._state;
  }
  
  set state(newState: State) {
    this._state = newState;
    this._notifyChange('state');
    if (this._mounted) {
      this._update();
    }
  }
  
  setState(updates: Partial<State> | ((prevState: State) => Partial<State>)) {
    const newValues = typeof updates === 'function' ? updates(this._state) : updates;
    
    let hasChanges = false;
    for (const [key, value] of Object.entries(newValues)) {
      if (this._state[key] !== value) {
        this._state[key] = value;
        this._notifyChange(`state.${key}`);
        hasChanges = true;
      }
    }
    
    if (hasChanges && this._mounted) {
      this._update();
    }
  }
  
  // Watchers
  watch(path: string, callback: () => void) {
    if (!this._watchers.has(path)) {
      this._watchers.set(path, new Set());
    }
    this._watchers.get(path)!.add(callback);
    
    return () => {
      this._watchers.get(path)?.delete(callback);
    };
  }
  
  private _notifyChange(path: string) {
    // Notify exact path watchers
    this._watchers.get(path)?.forEach(cb => cb());
    
    // Notify parent path watchers
    const parts = path.split('.');
    for (let i = parts.length - 1; i > 0; i--) {
      const parentPath = parts.slice(0, i).join('.');
      this._watchers.get(parentPath)?.forEach(cb => cb());
    }
  }
  
  // Lifecycle management
  private async _mount() {
    await this.beforeMount?.();
    
    // Initial render
    this._render();
    
    this._mounted = true;
    await this.mounted?.();
  }
  
  private async _unmount() {
    await this.beforeUnmount?.();
    
    this._mounted = false;
    this._emitter.removeAllListeners();
    this._watchers.clear();
    
    await this.unmounted?.();
  }
  
  private async _update() {
    if (this._updating) return;
    this._updating = true;
    
    await this.beforeUpdate?.();
    this._render();
    await this.updated?.();
    
    this._updating = false;
  }
  
  // Rendering
  private _render() {
    if (!this.template) return;
    
    // Compile template if needed
    if (!this._renderFn) {
      this._renderFn = compile(this.template);
    }
    
    // Create render context
    const ctx = {
      ...this._props,
      ...this._state,
      $el: this,
      $emit: this.emit.bind(this)
    };
    
    // Render to shadow DOM or light DOM
    const target = this.shadowRoot || this;
    target.innerHTML = this._renderFn(ctx);
    
    // Apply styles if using shadow DOM
    if (this.shadowRoot && this.styles) {
      const style = document.createElement('style');
      style.textContent = this.styles;
      this.shadowRoot.insertBefore(style, this.shadowRoot.firstChild);
    }
  }
  
  // Public render method
  render() {
    if (this._mounted) {
      this._update();
    }
  }
  
  // Event handling
  emit(event: string, detail?: any) {
    // Emit on component
    this._emitter.emit(event, detail);
    
    // Dispatch DOM event
    this.dispatchEvent(new CustomEvent(event, {
      detail,
      bubbles: true,
      composed: true
    }));
  }
  
  on(event: string, handler: (detail?: any) => void) {
    this._emitter.on(event, handler);
    return () => this._emitter.off(event, handler);
  }
  
  once(event: string, handler: (detail?: any) => void) {
    this._emitter.once(event, handler);
  }
  
  off(event: string, handler?: (detail?: any) => void) {
    this._emitter.off(event, handler);
  }
  
  // DOM utilities
  $(selector: string): Element | null {
    return (this.shadowRoot || this).querySelector(selector);
  }
  
  $$(selector: string): Element[] {
    return Array.from((this.shadowRoot || this).querySelectorAll(selector));
  }
  
  addClass(className: string, target?: Element) {
    (target || this).classList.add(className);
  }
  
  removeClass(className: string, target?: Element) {
    (target || this).classList.remove(className);
  }
  
  toggleClass(className: string, target?: Element) {
    (target || this).classList.toggle(className);
  }
  
  hasClass(className: string, target?: Element): boolean {
    return (target || this).classList.contains(className);
  }
  
  setStyle(styles: Partial<CSSStyleDeclaration>, target?: HTMLElement) {
    Object.assign((target || this).style, styles);
  }
  
  // Shadow DOM
  attachShadow(init?: ShadowRootInit): ShadowRoot {
    const shadow = super.attachShadow(init || { mode: 'open' });
    return shadow;
  }
}

// Component decorator for class-based syntax
export function component(tag: string, options?: ComponentOptions) {
  return function(target: typeof Component) {
    // Merge options
    if (options) {
      if (options.props) target.prototype.props = options.props;
      if (options.template) target.prototype.template = options.template;
      if (options.styles) target.prototype.styles = options.styles;
    }
    
    // Register component
    customElements.define(tag, target);
    return target;
  };
}

// Functional component helper
export function defineComponent(
  tag: string,
  setup: (props: any) => {
    template: string;
    styles?: string;
    props?: Props;
    state?: State;
    methods?: Record<string, Function>;
    lifecycle?: Partial<{
      beforeMount: LifecycleHook;
      mounted: LifecycleHook;
      beforeUpdate: LifecycleHook;
      updated: LifecycleHook;
      beforeUnmount: LifecycleHook;
      unmounted: LifecycleHook;
    }>;
  }
) {
  class FunctionalComponent extends Component {
    constructor() {
      super();
      
      const config = setup(this._props);
      
      // Set template and styles
      this.template = config.template;
      this.styles = config.styles;
      this.props = config.props;
      
      // Set initial state
      if (config.state) {
        this._state = config.state;
      }
      
      // Bind methods
      if (config.methods) {
        for (const [name, method] of Object.entries(config.methods)) {
          (this as any)[name] = method.bind(this);
        }
      }
      
      // Set lifecycle hooks
      if (config.lifecycle) {
        Object.assign(this, config.lifecycle);
      }
    }
  }
  
  customElements.define(tag, FunctionalComponent);
  return FunctionalComponent;
}