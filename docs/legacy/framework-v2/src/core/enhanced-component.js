import { Component } from './component.js';

export class EnhancedComponent extends Component {
  static variants = {};
  static responsive = true;
  static a11y = true;
  static theme = 'default';
  
  constructor(config = {}) {
    super();
    
    this.config = {
      variant: 'default',
      responsive: this.constructor.responsive,
      a11y: this.constructor.a11y,
      theme: this.constructor.theme,
      ...config
    };
    
    this.variantStyles = new Map();
    this.responsiveRules = new Map();
    this.setupVariants();
  }
  
  setupVariants() {
    const variants = this.constructor.variants;
    Object.keys(variants).forEach(name => {
      this.variantStyles.set(name, variants[name]);
    });
  }
  
  generateVariant(name) {
    const variant = this.variantStyles.get(name);
    if (!variant) {
      console.warn(`Variant "${name}" not found`);
      return '';
    }
    
    const { styles, classes, attributes } = variant;
    
    if (styles) {
      Object.assign(this.style, styles);
    }
    
    if (classes) {
      this.classList.add(...classes);
    }
    
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        this.setAttribute(key, value);
      });
    }
    
    return variant;
  }
  
  applyResponsive() {
    if (!this.config.responsive) return;
    
    const breakpoints = {
      mobile: '(max-width: 640px)',
      tablet: '(min-width: 641px) and (max-width: 1024px)',
      desktop: '(min-width: 1025px)'
    };
    
    Object.entries(breakpoints).forEach(([device, query]) => {
      const mediaQuery = window.matchMedia(query);
      
      const handleChange = (e) => {
        if (e.matches) {
          this.setAttribute('data-device', device);
          this.dispatchEvent(new CustomEvent('responsive-change', {
            detail: { device, query }
          }));
        }
      };
      
      mediaQuery.addListener(handleChange);
      handleChange(mediaQuery);
      
      this.responsiveRules.set(device, { query, handler: handleChange });
    });
  }
  
  ensureA11y() {
    if (!this.config.a11y) return;
    
    const role = this.getAttribute('role');
    if (!role) {
      const tagName = this.tagName.toLowerCase();
      const roleMap = {
        'nav': 'navigation',
        'header': 'banner',
        'main': 'main',
        'footer': 'contentinfo',
        'aside': 'complementary',
        'section': 'region'
      };
      
      if (roleMap[tagName]) {
        this.setAttribute('role', roleMap[tagName]);
      }
    }
    
    const interactive = ['button', 'a', 'input', 'select', 'textarea'];
    const isInteractive = interactive.includes(this.tagName.toLowerCase()) ||
                         this.querySelector(interactive.join(','));
    
    if (isInteractive && !this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
    
    if (!this.getAttribute('aria-label') && !this.getAttribute('aria-labelledby')) {
      const heading = this.querySelector('h1, h2, h3, h4, h5, h6');
      if (heading && heading.id) {
        this.setAttribute('aria-labelledby', heading.id);
      }
    }
  }
  
  connectedCallback() {
    super.connectedCallback();
    
    if (this.config.variant && this.config.variant !== 'default') {
      this.generateVariant(this.config.variant);
    }
    
    this.applyResponsive();
    this.ensureA11y();
    
    this.classList.add('enhanced-component');
    this.setAttribute('data-variant', this.config.variant);
    this.setAttribute('data-theme', this.config.theme);
  }
  
  requestUpdate() {
    this.render();
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    
    this.responsiveRules.forEach(({ handler }, device) => {
      const { query } = this.responsiveRules.get(device);
      window.matchMedia(query).removeListener(handler);
    });
    
    this.responsiveRules.clear();
  }
  
  updateVariant(variantName) {
    this.classList.remove(`variant-${this.config.variant}`);
    this.config.variant = variantName;
    this.setAttribute('data-variant', variantName);
    this.generateVariant(variantName);
    this.classList.add(`variant-${variantName}`);
  }
  
  updateTheme(themeName) {
    this.classList.remove(`theme-${this.config.theme}`);
    this.config.theme = themeName;
    this.setAttribute('data-theme', themeName);
    this.classList.add(`theme-${themeName}`);
  }
  
  static define(tagName, componentClass) {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, componentClass);
    }
    return componentClass;
  }
}

export function createEnhancedComponent(tagName, config) {
  class CustomEnhancedComponent extends EnhancedComponent {
    static variants = config.variants || {};
    static responsive = config.responsive !== false;
    static a11y = config.a11y !== false;
    static theme = config.theme || 'default';
    
    render() {
      if (config.render) {
        return config.render.call(this);
      }
      return '';
    }
    
    styles() {
      if (config.styles) {
        return config.styles.call(this);
      }
      return '';
    }
  }
  
  if (config.methods) {
    Object.entries(config.methods).forEach(([name, method]) => {
      CustomEnhancedComponent.prototype[name] = method;
    });
  }
  
  if (config.lifecycle) {
    Object.entries(config.lifecycle).forEach(([name, handler]) => {
      CustomEnhancedComponent.prototype[name] = handler;
    });
  }
  
  return EnhancedComponent.define(tagName, CustomEnhancedComponent);
}