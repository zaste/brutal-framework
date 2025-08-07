export class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.categories = new Map();
    this.themes = new Map();
    this.loadedComponents = new Set();
  }
  
  register(name, component, options = {}) {
    if (this.components.has(name)) {
      console.warn(`Component "${name}" already registered`);
      return false;
    }
    
    const componentData = {
      name,
      component,
      category: options.category || 'general',
      description: options.description || '',
      variants: component.variants || {},
      dependencies: options.dependencies || [],
      lazy: options.lazy || false,
      loaded: false
    };
    
    this.components.set(name, componentData);
    
    if (!this.categories.has(componentData.category)) {
      this.categories.set(componentData.category, new Set());
    }
    this.categories.get(componentData.category).add(name);
    
    if (!componentData.lazy) {
      this.load(name);
    }
    
    return true;
  }
  
  load(name) {
    const componentData = this.components.get(name);
    if (!componentData) {
      console.error(`Component "${name}" not found`);
      return false;
    }
    
    if (componentData.loaded) {
      return true;
    }
    
    componentData.dependencies.forEach(dep => {
      if (!this.loadedComponents.has(dep)) {
        this.load(dep);
      }
    });
    
    const { component } = componentData;
    const tagName = this.formatTagName(name);
    
    if (!customElements.get(tagName)) {
      customElements.define(tagName, component);
    }
    
    componentData.loaded = true;
    this.loadedComponents.add(name);
    
    return true;
  }
  
  loadCategory(category) {
    const components = this.categories.get(category);
    if (!components) {
      console.warn(`Category "${category}" not found`);
      return false;
    }
    
    components.forEach(name => this.load(name));
    return true;
  }
  
  loadAll() {
    this.components.forEach((_, name) => this.load(name));
  }
  
  get(name) {
    const componentData = this.components.get(name);
    if (!componentData) {
      return null;
    }
    
    if (!componentData.loaded) {
      this.load(name);
    }
    
    return componentData.component;
  }
  
  getByCategory(category) {
    const componentNames = this.categories.get(category);
    if (!componentNames) {
      return [];
    }
    
    return Array.from(componentNames).map(name => ({
      name,
      ...this.components.get(name)
    }));
  }
  
  getAllCategories() {
    return Array.from(this.categories.keys());
  }
  
  getAllComponents() {
    return Array.from(this.components.entries()).map(([name, data]) => ({
      name,
      ...data
    }));
  }
  
  getVariants(componentName) {
    const componentData = this.components.get(componentName);
    if (!componentData) {
      return {};
    }
    
    return componentData.variants;
  }
  
  registerTheme(name, theme) {
    this.themes.set(name, theme);
  }
  
  getTheme(name) {
    return this.themes.get(name) || this.themes.get('default') || {};
  }
  
  formatTagName(name) {
    return `fw-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }
  
  createComponent(name, config = {}) {
    const ComponentClass = this.get(name);
    if (!ComponentClass) {
      console.error(`Component "${name}" not found`);
      return null;
    }
    
    const tagName = this.formatTagName(name);
    const element = document.createElement(tagName);
    
    if (config.variant) {
      element.setAttribute('data-variant', config.variant);
    }
    
    if (config.theme) {
      element.setAttribute('data-theme', config.theme);
    }
    
    Object.entries(config).forEach(([key, value]) => {
      if (key !== 'variant' && key !== 'theme') {
        if (typeof value === 'object') {
          element[key] = value;
        } else {
          element.setAttribute(key, value);
        }
      }
    });
    
    return element;
  }
  
  async importComponent(url, name) {
    try {
      const module = await import(url);
      const component = module.default || module[name];
      
      if (!component) {
        throw new Error(`Component not found in module`);
      }
      
      this.register(name, component, { lazy: false });
      return component;
    } catch (error) {
      console.error(`Failed to import component from ${url}:`, error);
      return null;
    }
  }
  
  generateCatalog() {
    const catalog = {
      components: this.getAllComponents(),
      categories: this.getAllCategories(),
      themes: Array.from(this.themes.keys())
    };
    
    return catalog;
  }
}

export const registry = new ComponentRegistry();

export function registerComponent(name, component, options) {
  return registry.register(name, component, options);
}

export function loadComponent(name) {
  return registry.load(name);
}

export function createComponent(name, config) {
  return registry.createComponent(name, config);
}