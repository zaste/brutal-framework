# BRUTAL V4 - Minimum Base Implementation Plan

## Executive Summary
To support all ~300 capabilities without future breaking changes, V4 needs a plugin-based architecture with comprehensive hooks, capability detection, and extension systems.

## Core Base Requirements

### 1. Hook System (Foundation for Everything)

```javascript
// core/hooks/HookSystem.js
export class HookSystem {
  constructor() {
    this.hooks = new Map();
    this.globalHooks = new Map();
  }

  // Register hook with priority
  register(name, handler, options = {}) {
    const { priority = 0, once = false, async = true } = options;
    
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }
    
    this.hooks.get(name).push({
      handler,
      priority,
      once,
      async,
      id: Symbol('hook')
    });
    
    // Sort by priority
    this.hooks.get(name).sort((a, b) => b.priority - a.priority);
  }

  // Call hooks
  async call(name, context, ...args) {
    const hooks = this.hooks.get(name) || [];
    const globalHooks = this.globalHooks.get(name) || [];
    const allHooks = [...globalHooks, ...hooks];
    
    let result = args[0];
    
    for (const hook of allHooks) {
      try {
        if (hook.async) {
          result = await hook.handler.call(context, result, ...args.slice(1));
        } else {
          result = hook.handler.call(context, result, ...args.slice(1));
        }
        
        if (hook.once) {
          this.remove(name, hook.id);
        }
      } catch (error) {
        console.error(`Hook error in ${name}:`, error);
        // Don't break the chain
      }
    }
    
    return result;
  }

  // Remove hook
  remove(name, id) {
    const hooks = this.hooks.get(name);
    if (hooks) {
      const index = hooks.findIndex(h => h.id === id);
      if (index > -1) {
        hooks.splice(index, 1);
      }
    }
  }
}

// Global hook system
export const globalHooks = new HookSystem();
```

### 2. Plugin Architecture

```javascript
// core/plugins/PluginSystem.js
export class PluginSystem {
  constructor() {
    this.plugins = new Map();
    this.loadOrder = [];
  }

  // Register plugin
  register(plugin) {
    if (!plugin.name || !plugin.install) {
      throw new Error('Plugin must have name and install method');
    }
    
    // Check dependencies
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Plugin ${plugin.name} requires ${dep}`);
        }
      }
    }
    
    this.plugins.set(plugin.name, plugin);
    this.loadOrder.push(plugin.name);
  }

  // Install all plugins
  async installAll(core, options = {}) {
    for (const name of this.loadOrder) {
      const plugin = this.plugins.get(name);
      const pluginOptions = options[name] || {};
      
      try {
        await plugin.install(core, pluginOptions);
        console.log(`[BRUTAL] Plugin installed: ${name}`);
      } catch (error) {
        console.error(`[BRUTAL] Plugin install failed: ${name}`, error);
        throw error;
      }
    }
  }

  // Get plugin
  get(name) {
    return this.plugins.get(name);
  }

  // Check if plugin installed
  has(name) {
    return this.plugins.has(name);
  }
}

// Global plugin system
export const pluginSystem = new PluginSystem();

// Example plugin structure
export class BrutalPlugin {
  constructor(name, dependencies = []) {
    this.name = name;
    this.dependencies = dependencies;
  }

  async install(core, options) {
    // Override in subclass
    throw new Error('Plugin must implement install method');
  }
}
```

### 3. Capability Detection System

```javascript
// core/capabilities/CapabilitySystem.js
export class CapabilitySystem {
  constructor() {
    this.capabilities = new Map();
    this.detectors = new Map();
    this.polyfills = new Map();
  }

  // Register capability detector
  registerDetector(name, detector) {
    this.detectors.set(name, detector);
    // Run detection immediately
    this.detect(name);
  }

  // Register polyfill
  registerPolyfill(name, polyfill) {
    this.polyfills.set(name, polyfill);
  }

  // Detect capability
  detect(name) {
    const detector = this.detectors.get(name);
    if (detector) {
      try {
        const result = detector();
        this.capabilities.set(name, result);
        return result;
      } catch (error) {
        this.capabilities.set(name, false);
        return false;
      }
    }
    return false;
  }

  // Check capability
  has(name) {
    if (!this.capabilities.has(name)) {
      this.detect(name);
    }
    return this.capabilities.get(name) || false;
  }

  // Require capabilities
  require(names, options = {}) {
    const missing = [];
    
    for (const name of names) {
      if (!this.has(name)) {
        missing.push(name);
        
        // Try to polyfill
        if (options.polyfill !== false) {
          const polyfill = this.polyfills.get(name);
          if (polyfill) {
            try {
              polyfill();
              // Re-detect after polyfill
              if (this.detect(name)) {
                missing.pop();
              }
            } catch (error) {
              console.error(`Polyfill failed for ${name}:`, error);
            }
          }
        }
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Missing required capabilities: ${missing.join(', ')}`);
    }
  }

  // Get all capabilities
  getAll() {
    return Object.fromEntries(this.capabilities);
  }
}

// Global capability system
export const capabilities = new CapabilitySystem();

// Register core capabilities
capabilities.registerDetector('customElements', () => 'customElements' in window);
capabilities.registerDetector('shadowDOM', () => 'attachShadow' in Element.prototype);
capabilities.registerDetector('proxy', () => typeof Proxy !== 'undefined');
capabilities.registerDetector('modules', () => 'noModule' in HTMLScriptElement.prototype);
capabilities.registerDetector('workers', () => typeof Worker !== 'undefined');
capabilities.registerDetector('serviceWorker', () => 'serviceWorker' in navigator);
capabilities.registerDetector('webgl', () => {
  const canvas = document.createElement('canvas');
  return !!canvas.getContext('webgl2') || !!canvas.getContext('webgl');
});
capabilities.registerDetector('webgpu', () => 'gpu' in navigator);
capabilities.registerDetector('sharedArrayBuffer', () => typeof SharedArrayBuffer !== 'undefined');
```

### 4. Extension System for Components

```javascript
// core/extensions/ExtensionSystem.js
export class ExtensionSystem {
  constructor() {
    this.extensions = new Map();
    this.mixins = new Map();
  }

  // Define extension
  define(name, extension) {
    if (typeof extension === 'function') {
      // Function extension
      this.extensions.set(name, extension);
    } else if (typeof extension === 'object') {
      // Object mixin
      this.mixins.set(name, extension);
    } else {
      throw new Error('Extension must be function or object');
    }
  }

  // Apply extensions to component class
  apply(ComponentClass, extensionNames) {
    for (const name of extensionNames) {
      // Function extensions
      const extension = this.extensions.get(name);
      if (extension) {
        extension(ComponentClass);
      }
      
      // Object mixins
      const mixin = this.mixins.get(name);
      if (mixin) {
        Object.assign(ComponentClass.prototype, mixin);
      }
    }
    
    return ComponentClass;
  }

  // Create extended component
  extend(BaseClass, extensions) {
    class ExtendedComponent extends BaseClass {
      constructor() {
        super();
        
        // Apply instance extensions
        for (const ext of extensions) {
          if (typeof ext.init === 'function') {
            ext.init.call(this);
          }
        }
      }
    }
    
    // Apply class extensions
    this.apply(ExtendedComponent, extensions.map(e => e.name || e));
    
    return ExtendedComponent;
  }
}

// Global extension system
export const extensions = new ExtensionSystem();

// Example extensions
extensions.define('draggable', (ComponentClass) => {
  ComponentClass.prototype.enableDragging = function() {
    // Add drag functionality
  };
});

extensions.define('animated', {
  animate(keyframes, options) {
    return this.shadowRoot.host.animate(keyframes, options);
  },
  
  fadeIn(duration = 300) {
    return this.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], { duration });
  }
});
```

### 5. Enhanced Component Base

```javascript
// core/foundation/EnhancedComponent.js
import { BrutalComponent } from './Component.js';
import { HookSystem } from '../hooks/HookSystem.js';
import { capabilities } from '../capabilities/CapabilitySystem.js';
import { extensions } from '../extensions/ExtensionSystem.js';

export class EnhancedBrutalComponent extends BrutalComponent {
  constructor() {
    super();
    
    // Component-level hooks
    this._hooks = new HookSystem();
    
    // Required capabilities
    this._requiredCapabilities = new Set();
    
    // Applied extensions
    this._appliedExtensions = new Set();
    
    // Plugin contexts
    this._pluginContexts = new Map();
    
    // Call beforeCreate hook
    this.callHook('beforeCreate');
  }

  // Lifecycle hooks
  async connectedCallback() {
    try {
      // Check required capabilities
      if (this._requiredCapabilities.size > 0) {
        capabilities.require(Array.from(this._requiredCapabilities));
      }
      
      await this.callHook('beforeMount');
      
      super.connectedCallback();
      
      await this.callHook('mounted');
      
    } catch (error) {
      this._handleError('mount', error);
    }
  }

  async disconnectedCallback() {
    try {
      await this.callHook('beforeDestroy');
      
      super.disconnectedCallback();
      
      await this.callHook('destroyed');
      
    } catch (error) {
      this._handleError('destroy', error);
    }
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    try {
      await this.callHook('beforeAttributeChange', name, oldValue, newValue);
      
      super.attributeChangedCallback(name, oldValue, newValue);
      
      await this.callHook('attributeChanged', name, oldValue, newValue);
      
    } catch (error) {
      this._handleError('attribute', error);
    }
  }

  // Hook management
  hook(name, handler, options) {
    return this._hooks.register(name, handler, options);
  }

  async callHook(name, ...args) {
    // Call component hooks
    const result = await this._hooks.call(name, this, ...args);
    
    // Call global hooks
    await globalHooks.call(`component:${name}`, this, result, ...args);
    
    return result;
  }

  // Capability management
  require(...capabilityNames) {
    capabilityNames.forEach(name => this._requiredCapabilities.add(name));
    return this;
  }

  hasCapability(name) {
    return capabilities.has(name);
  }

  // Extension management
  use(...extensionNames) {
    extensionNames.forEach(name => {
      if (!this._appliedExtensions.has(name)) {
        extensions.apply(this.constructor, [name]);
        this._appliedExtensions.add(name);
      }
    });
    return this;
  }

  // Plugin context management
  getPluginContext(pluginName) {
    if (!this._pluginContexts.has(pluginName)) {
      this._pluginContexts.set(pluginName, {});
    }
    return this._pluginContexts.get(pluginName);
  }

  // Enhanced render with hooks
  async render() {
    try {
      await this.callHook('beforeRender');
      
      const template = await this.callHook('renderTemplate', this.template);
      const styles = await this.callHook('renderStyles', this.styles);
      
      // Apply template and styles
      if (template) {
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(template.content.cloneNode(true));
      }
      
      if (styles && this.shadowRoot.adoptedStyleSheets) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(styles);
        this.shadowRoot.adoptedStyleSheets = [sheet];
      }
      
      await this.callHook('rendered');
      
    } catch (error) {
      this._handleError('render', error);
    }
  }

  // Enhanced error handling with hooks
  async _handleError(phase, error) {
    const handled = await this.callHook('error', phase, error);
    
    if (!handled) {
      super._handleError(phase, error);
    }
  }
}
```

### 6. Core System Integration

```javascript
// core/index.js - Enhanced version
import { HookSystem, globalHooks } from './hooks/HookSystem.js';
import { PluginSystem, pluginSystem } from './plugins/PluginSystem.js';
import { CapabilitySystem, capabilities } from './capabilities/CapabilitySystem.js';
import { ExtensionSystem, extensions } from './extensions/ExtensionSystem.js';
import { EnhancedBrutalComponent } from './foundation/EnhancedComponent.js';

// Re-export enhanced component as default
export { EnhancedBrutalComponent as BrutalComponent };

// Export systems
export {
  globalHooks,
  pluginSystem,
  capabilities,
  extensions
};

// Enhanced initialization
export async function initBrutal(options = {}) {
  const startTime = performance.now();
  
  try {
    // Run pre-init hooks
    await globalHooks.call('beforeInit', null, options);
    
    // Check core capabilities
    capabilities.require(['customElements', 'shadowDOM', 'proxy', 'modules']);
    
    // Install plugins
    if (options.plugins) {
      for (const plugin of options.plugins) {
        pluginSystem.register(plugin);
      }
      await pluginSystem.installAll({ globalHooks, capabilities, extensions }, options.pluginOptions || {});
    }
    
    // Original init code...
    const result = originalInit(options);
    
    // Run post-init hooks
    await globalHooks.call('afterInit', null, result);
    
    return result;
    
  } catch (error) {
    await globalHooks.call('initError', null, error);
    throw error;
  }
}
```

## Plugin Examples

### Security Plugin
```javascript
// plugins/security/index.js
export class SecurityPlugin extends BrutalPlugin {
  constructor() {
    super('security', []);
  }

  async install(core, options) {
    const { globalHooks, capabilities } = core;
    
    // Add CSP management
    globalHooks.register('component:beforeRender', async (template) => {
      // Add nonces to scripts
      return this.addCSPNonces(template);
    });
    
    // Add CSRF protection
    globalHooks.register('beforeFetch', async (request) => {
      // Add CSRF token
      return this.addCSRFToken(request);
    });
    
    // Add XSS protection
    globalHooks.register('component:renderTemplate', async (template) => {
      // Sanitize template
      return this.sanitizeTemplate(template);
    });
  }
}
```

### i18n Plugin
```javascript
// plugins/i18n/index.js
export class I18nPlugin extends BrutalPlugin {
  constructor() {
    super('i18n', []);
  }

  async install(core, options) {
    const { globalHooks, extensions } = core;
    
    // Add translation hooks
    globalHooks.register('component:renderTemplate', async (template, component) => {
      return this.translateTemplate(template, component.locale);
    });
    
    // Add i18n extension
    extensions.define('i18n', {
      t(key, params) {
        return this.getPluginContext('i18n').translate(key, params);
      },
      
      setLocale(locale) {
        this.getPluginContext('i18n').locale = locale;
        this.scheduleRender();
      }
    });
  }
}
```

## Minimum Viable Product Checklist

### Core Systems (Week 1)
- [ ] Hook system with priority and async support
- [ ] Plugin architecture with dependency resolution
- [ ] Capability detection with polyfill support
- [ ] Extension system for component mixins
- [ ] Enhanced component base with all hooks

### Essential Plugins (Week 2)
- [ ] Security plugin (CSP, CSRF, XSS)
- [ ] i18n plugin (translations, RTL)
- [ ] A11y plugin (ARIA, focus management)
- [ ] PWA plugin (service worker, offline)
- [ ] Forms plugin (validation, complex inputs)

### Developer Experience (Week 3)
- [ ] DevTools integration
- [ ] Error boundaries with recovery
- [ ] Performance profiling hooks
- [ ] Hot module replacement support
- [ ] TypeScript definitions

### Testing & Documentation (Week 4)
- [ ] Unit tests for all systems
- [ ] Integration tests for plugins
- [ ] Performance benchmarks
- [ ] API documentation
- [ ] Migration guide from V3

## Benefits of This Architecture

1. **Extensibility**: Any feature can be added as a plugin
2. **Performance**: Features only loaded when needed
3. **Compatibility**: Polyfills for missing capabilities
4. **Maintainability**: Clear separation of concerns
5. **Future-proof**: No breaking changes needed for new features

## Conclusion

This minimum base provides:
- Hook points for any operation
- Plugin system for features
- Capability detection/polyfills
- Extension system for behaviors
- Enhanced lifecycle management

With this foundation, V4 can support all 300+ capabilities from V3 without any future breaking changes.