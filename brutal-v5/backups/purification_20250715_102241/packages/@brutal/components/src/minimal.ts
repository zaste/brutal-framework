/**
 * Ultra-minimal component system
 */

import { EventEmitter as E } from '@brutal/events';
import { compile as c } from '@brutal/templates';

// Types
type P = Record<string, any>; // Props
type S = Record<string, any>; // State

// Base component
export class C extends HTMLElement {
  static o: string[] = []; // observedAttributes
  
  p: P = {}; // props
  s: S = {}; // state
  m = false; // mounted
  e = new E(); // emitter
  r?: Function; // render function
  w = new Map(); // watchers
  
  // Template & styles
  t?: string; // template
  y?: string; // styles
  
  // Lifecycle
  bm?(): void; // beforeMount
  mo?(): void; // mounted
  bu?(): void; // beforeUpdate
  up?(): void; // updated
  
  connectedCallback() {
    if (!this.m) {
      this.bm?.();
      this._r();
      this.m = true;
      this.mo?.();
    }
  }
  
  disconnectedCallback() {
    this.m = false;
    // Simple cleanup for minimal size
    (this.e as any)._events = {};
    this.w.clear();
  }
  
  attributeChangedCallback(n: string, o: string | null, v: string | null) {
    if (o !== v && v !== null) {
      this.p[n] = v;
      if (this.m) this.u();
    }
  }
  
  // Update
  u() {
    this.bu?.();
    this._r();
    this.up?.();
  }
  
  // Render
  _r() {
    if (!this.t) return;
    if (!this.r) this.r = c(this.t);
    const h = this.shadowRoot || this;
    h.innerHTML = this.r({ ...this.p, ...this.s, $: this });
    if (this.shadowRoot && this.y) {
      const s = document.createElement('style');
      s.textContent = this.y;
      this.shadowRoot.insertBefore(s, this.shadowRoot.firstChild);
    }
  }
  
  // State
  set(u: Partial<S> | ((s: S) => Partial<S>)) {
    const n = typeof u === 'function' ? u(this.s) : u;
    let c = false;
    for (const k in n) {
      if (this.s[k] !== n[k]) {
        this.s[k] = n[k];
        c = true;
      }
    }
    if (c && this.m) this.u();
  }
  
  // Events
  on(e: string, h: Function) {
    this.e.on(e, h);
    return () => this.e.off(e, h);
  }
  
  emit(e: string, d?: any) {
    this.e.emit(e, d);
    this.dispatchEvent(new CustomEvent(e, { detail: d, bubbles: true }));
  }
  
  // DOM
  $(s: string) {
    return (this.shadowRoot || this).querySelector(s);
  }
  
  $$(s: string) {
    return Array.from((this.shadowRoot || this).querySelectorAll(s));
  }
}

// Component decorator
export function comp(tag: string, opts: any = {}) {
  return function(T: any) {
    if (opts.props) {
      T.o = Object.keys(opts.props);
      T.prototype._p = opts.props;
    }
    if (opts.template) T.prototype.t = opts.template;
    if (opts.styles) T.prototype.y = opts.styles;
    
    // Init props
    const orig = T.prototype.connectedCallback;
    T.prototype.connectedCallback = function() {
      if (this._p && !this._pi) {
        for (const k in this._p) {
          const d = this._p[k];
          this.p[k] = d.default;
          Object.defineProperty(this, k, {
            get: () => this.p[k],
            set: (v: any) => {
              this.p[k] = v;
              if (this.m) this.u();
            }
          });
        }
        this._pi = true;
      }
      orig.call(this);
    };
    
    customElements.define(tag, T);
    return T;
  };
}

// Button
@comp('b-btn', {
  props: {
    variant: { default: 'primary' },
    size: { default: 'md' },
    disabled: { type: 'boolean', default: false },
    loading: { type: 'boolean', default: false }
  },
  template: `<button class="b b-{{variant}} b-{{size}} {{#if loading}}ld{{/if}}" {{#if disabled}}disabled{{/if}}>{{#if loading}}<i></i>{{/if}}<slot></slot></button>`,
  styles: `.b{border:none;border-radius:4px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-weight:500;transition:all .2s}.b-sm{padding:.25rem .75rem;font-size:.875rem}.b-md{padding:.5rem 1rem;font-size:1rem}.b-lg{padding:.75rem 1.5rem;font-size:1.125rem}.b-primary{background:#007bff;color:#fff}.b-primary:hover:not(:disabled){background:#0056b3}.b-secondary{background:#6c757d;color:#fff}.b-secondary:hover:not(:disabled){background:#545b62}.b:disabled{opacity:.6;cursor:not-allowed}.ld{color:transparent;position:relative}.ld i{position:absolute;width:1em;height:1em;border:2px solid;border-right-color:transparent;border-radius:50%;animation:s .75s linear infinite}@keyframes s{to{transform:rotate(360deg)}}`
})
export class Btn extends C {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  mo() {
    this.$('button')?.addEventListener('click', (e: Event) => {
      if (this.disabled || this.loading) {
        e.preventDefault();
        return;
      }
      this.emit('click', e);
    });
  }
}

// Input
@comp('b-input', {
  props: {
    type: { default: 'text' },
    value: { default: '' },
    placeholder: { default: '' },
    disabled: { type: 'boolean', default: false },
    error: { default: '' }
  },
  template: `<div class="w {{#if error}}e{{/if}}"><input type="{{type}}" value="{{value}}" placeholder="{{placeholder}}" {{#if disabled}}disabled{{/if}}/>{{#if error}}<span class="em">{{error}}</span>{{/if}}</div>`,
  styles: `.w{position:relative}input{width:100%;padding:.5rem .75rem;border:1px solid #ced4da;border-radius:4px;font-size:1rem}input:focus{outline:none;border-color:#007bff;box-shadow:0 0 0 .2rem rgba(0,123,255,.25)}.e input{border-color:#dc3545}.em{display:block;margin-top:.25rem;font-size:.875rem;color:#dc3545}`
})
export class Inp extends C {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  mo() {
    const i = this.$('input') as HTMLInputElement;
    i?.addEventListener('input', (e) => {
      this.value = (e.target as HTMLInputElement).value;
      this.emit('input', this.value);
    });
  }
}

// Modal
@comp('b-modal', {
  props: {
    open: { type: 'boolean', default: false },
    title: { default: '' }
  },
  template: `{{#if open}}<div class="o"><div class="m"><div class="h">{{title}}<button class="x" data-close>&times;</button></div><div class="b"><slot></slot></div></div></div>{{/if}}`,
  styles: `:host{position:fixed;top:0;left:0;right:0;bottom:0;z-index:999}.o{position:absolute;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center}.m{background:#fff;border-radius:8px;width:500px;max-height:90vh;display:flex;flex-direction:column}.h{padding:1rem;border-bottom:1px solid #e9ecef;display:flex;justify-content:space-between}.x{background:none;border:none;font-size:1.5rem;cursor:pointer;color:#6c757d}.b{padding:1rem;overflow-y:auto}`
})
export class Mod extends C {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  mo() {
    this.shadowRoot?.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).hasAttribute('data-close')) {
        this.open = false;
        this.emit('close');
      }
    });
  }
}