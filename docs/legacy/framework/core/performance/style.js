/**
 * CSS Styling Optimization Framework for Shadow DOM
 * Week 2 Day 7: CSS-in-JS performance optimization patterns
 * Based on Chromium StyleEngine and CSSStyleSheet performance analysis
 */

export class CSSStyleOptimizer {
  static styleSheetCache = new Map();
  static constructableStyleSheetCache = new Map();
  static cssTemplateCache = new Map();
  static cssVariableCache = new Map();
  
  // Performance metrics tracking
  static metrics = {
    styleInjection: [],
    cssCompilation: [],
    styleSharing: [],
    memoryUsage: []
  };

  /**
   * Inject optimized CSS styles into Shadow DOM
   * Based on Chromium CSSStyleSheet performance patterns
   */
  static injectStyles(shadowRoot, styles, options = {}) {
    const startTime = performance.now();
    
    const config = {
      constructableStyleSheets: true,
      cache: true,
      variables: {},
      shared: false,
      minify: true,
      ...options
    };

    // Process CSS with optimization patterns
    const processedCSS = this._processCSS(styles, config);
    const styleHash = this._generateStyleHash(processedCSS);

    // Use Constructable Stylesheets for optimal performance (Chrome optimization)
    if (config.constructableStyleSheets && 'adoptedStyleSheets' in shadowRoot) {
      this._injectConstructableStyleSheet(shadowRoot, processedCSS, styleHash, config);
    } else {
      // Fallback to optimized <style> element injection
      this._injectStyleElement(shadowRoot, processedCSS, styleHash, config);
    }
    
    const endTime = performance.now();
    this.metrics.styleInjection.push(endTime - startTime);
    
    return styleHash;
  }

  /**
   * Create optimized CSS-in-JS template system
   * Enables efficient CSS generation with variables and mixins
   */
  static css(template, ...values) {
    const startTime = performance.now();
    
    // Create template key for caching
    const templateKey = template.join('__PLACEHOLDER__');
    
    if (this.cssTemplateCache.has(templateKey)) {
      const cachedTemplate = this.cssTemplateCache.get(templateKey);
      const result = this._interpolateTemplate(cachedTemplate, values);
      
      const endTime = performance.now();
      this.metrics.cssCompilation.push(endTime - startTime);
      return result;
    }

    // Create new CSS template with optimization
    const cssTemplate = this._createOptimizedTemplate(template, values);
    this.cssTemplateCache.set(templateKey, cssTemplate);
    
    const result = cssTemplate.interpolated;
    
    const endTime = performance.now();
    this.metrics.cssCompilation.push(endTime - startTime);
    
    return result;
  }

  /**
   * CSS Variables optimization for efficient theme switching
   * Based on CSS Custom Properties performance patterns
   */
  static defineVariables(shadowRoot, variables) {
    const startTime = performance.now();
    
    // Generate CSS custom properties
    const variableCSS = Object.entries(variables)
      .map(([key, value]) => `--${key}: ${value};`)
      .join('\n');
    
    const hostStyle = `:host {\n${variableCSS}\n}`;
    
    // Cache variables for reuse
    const variableHash = this._generateStyleHash(JSON.stringify(variables));
    this.cssVariableCache.set(variableHash, hostStyle);
    
    // Inject variable definitions
    this.injectStyles(shadowRoot, hostStyle, {
      constructableStyleSheets: true,
      cache: true,
      priority: 'variables'
    });
    
    const endTime = performance.now();
    this.metrics.cssCompilation.push(endTime - startTime);
    
    return variableHash;
  }

  /**
   * Shared stylesheet optimization for memory efficiency
   * Multiple components can share the same stylesheets
   */
  static createSharedStyleSheet(css, options = {}) {
    const startTime = performance.now();
    
    const config = {
      cache: true,
      minify: true,
      ...options
    };
    
    const processedCSS = this._processCSS(css, config);
    const styleHash = this._generateStyleHash(processedCSS);
    
    if (this.constructableStyleSheetCache.has(styleHash)) {
      const endTime = performance.now();
      this.metrics.styleSharing.push(endTime - startTime);
      return this.constructableStyleSheetCache.get(styleHash);
    }
    
    // Create new CSSStyleSheet for sharing
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(processedCSS);
    
    this.constructableStyleSheetCache.set(styleHash, sheet);
    
    const endTime = performance.now();
    this.metrics.styleSharing.push(endTime - startTime);
    
    return sheet;
  }

  /**
   * Performance-optimized CSS minification
   * Removes unnecessary whitespace and comments
   */
  static minifyCSS(css) {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/;\s*}/g, '}') // Remove last semicolon in blocks
      .replace(/{\s*/g, '{') // Remove space after opening brace
      .replace(/}\s*/g, '}') // Remove space after closing brace
      .replace(/,\s*/g, ',') // Remove space after commas
      .replace(/:\s*/g, ':') // Remove space after colons
      .replace(/;\s*/g, ';') // Remove space after semicolons
      .trim();
  }

  /**
   * CSS property optimization and vendor prefix management
   */
  static optimizeProperties(css) {
    // Common CSS property optimizations
    const optimizations = new Map([
      ['margin: 0px;', 'margin:0;'],
      ['padding: 0px;', 'padding:0;'],
      ['border: none;', 'border:0;'],
      ['font-weight: normal;', 'font-weight:400;'],
      ['font-weight: bold;', 'font-weight:700;']
    ]);

    let optimizedCSS = css;
    
    optimizations.forEach((optimized, original) => {
      optimizedCSS = optimizedCSS.replace(new RegExp(original, 'g'), optimized);
    });

    return optimizedCSS;
  }

  /**
   * Memory usage optimization and cleanup
   */
  static optimizeMemoryUsage() {
    const startTime = performance.now();
    
    // Clear old cache entries if cache is too large
    if (this.styleSheetCache.size > 200) {
      const entries = Array.from(this.styleSheetCache.entries());
      entries.slice(0, 100).forEach(([key]) => {
        this.styleSheetCache.delete(key);
      });
    }

    if (this.cssTemplateCache.size > 100) {
      const entries = Array.from(this.cssTemplateCache.entries());
      entries.slice(0, 50).forEach(([key]) => {
        this.cssTemplateCache.delete(key);
      });
    }
    
    const endTime = performance.now();
    this.metrics.memoryUsage.push(endTime - startTime);
  }

  /**
   * Get comprehensive performance metrics
   */
  static getPerformanceMetrics() {
    const calculateStats = (values) => {
      if (values.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };
      
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      return { avg, min, max, count: values.length };
    };

    return {
      styleInjection: calculateStats(this.metrics.styleInjection),
      cssCompilation: calculateStats(this.metrics.cssCompilation),
      styleSharing: calculateStats(this.metrics.styleSharing),
      memoryUsage: calculateStats(this.metrics.memoryUsage),
      cacheEfficiency: {
        styleSheets: this.styleSheetCache.size,
        constructableSheets: this.constructableStyleSheetCache.size,
        cssTemplates: this.cssTemplateCache.size,
        cssVariables: this.cssVariableCache.size
      }
    };
  }

  // Private optimization methods

  static _processCSS(css, config) {
    let processedCSS = css;

    // Apply CSS variables if provided
    if (config.variables && Object.keys(config.variables).length > 0) {
      Object.entries(config.variables).forEach(([key, value]) => {
        const variablePattern = new RegExp(`var\\(--${key}\\)`, 'g');
        processedCSS = processedCSS.replace(variablePattern, value);
      });
    }

    // Minify CSS if requested
    if (config.minify) {
      processedCSS = this.minifyCSS(processedCSS);
      processedCSS = this.optimizeProperties(processedCSS);
    }

    return processedCSS;
  }

  static _injectConstructableStyleSheet(shadowRoot, css, styleHash, config) {
    // Check if sheet already exists in cache
    if (config.cache && this.constructableStyleSheetCache.has(styleHash)) {
      const sheet = this.constructableStyleSheetCache.get(styleHash);
      shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, sheet];
      return;
    }

    // Create new CSSStyleSheet
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);

    if (config.cache) {
      this.constructableStyleSheetCache.set(styleHash, sheet);
    }

    shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, sheet];
  }

  static _injectStyleElement(shadowRoot, css, styleHash, config) {
    // Check if style element already exists
    if (config.cache) {
      const existingStyle = shadowRoot.querySelector(`style[data-hash="${styleHash}"]`);
      if (existingStyle) {
        return;
      }
    }

    // Create new style element
    const styleElement = document.createElement('style');
    styleElement.textContent = css;
    
    if (config.cache) {
      styleElement.setAttribute('data-hash', styleHash);
    }

    // Insert based on priority
    if (config.priority === 'variables') {
      shadowRoot.prepend(styleElement);
    } else {
      shadowRoot.appendChild(styleElement);
    }
  }

  static _generateStyleHash(css) {
    // Simple hash function for CSS caching
    let hash = 0;
    for (let i = 0; i < css.length; i++) {
      const char = css.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  static _createOptimizedTemplate(template, values) {
    // Create optimized template structure
    const segments = [];
    const placeholders = [];
    
    for (let i = 0; i < template.length; i++) {
      segments.push(template[i]);
      if (i < values.length) {
        placeholders.push(values[i]);
      }
    }

    const interpolated = segments.reduce((result, segment, index) => {
      return result + segment + (placeholders[index] || '');
    }, '');

    return {
      segments,
      placeholders,
      interpolated
    };
  }

  static _interpolateTemplate(template, values) {
    return template.segments.reduce((result, segment, index) => {
      return result + segment + (values[index] || '');
    }, '');
  }

  /**
   * Reset all caches and metrics (useful for testing)
   */
  static reset() {
    this.styleSheetCache.clear();
    this.constructableStyleSheetCache.clear();
    this.cssTemplateCache.clear();
    this.cssVariableCache.clear();
    
    this.metrics = {
      styleInjection: [],
      cssCompilation: [],
      styleSharing: [],
      memoryUsage: []
    };
  }
}

/**
 * Optimized CSS-in-JS component base class
 * Integrates all CSS optimization patterns with Shadow DOM
 */
export class StyledShadowElement extends HTMLElement {
  constructor() {
    super();
    this._shadowRoot = null;
    this._styleSheets = [];
    this._cssVariables = {};
  }

  createStyledShadow(config = {}) {
    if (this._shadowRoot) {
      return this._shadowRoot;
    }
    
    this._shadowRoot = this.attachShadow({
      mode: 'open',
      delegatesFocus: true,
      ...config
    });
    
    return this._shadowRoot;
  }

  addStyles(css, options = {}) {
    if (!this._shadowRoot) {
      throw new Error('Shadow root must be created first');
    }
    
    const styleHash = CSSStyleOptimizer.injectStyles(this._shadowRoot, css, {
      constructableStyleSheets: true,
      cache: true,
      minify: true,
      variables: this._cssVariables,
      ...options
    });
    
    this._styleSheets.push(styleHash);
    return styleHash;
  }

  setVariables(variables) {
    this._cssVariables = { ...this._cssVariables, ...variables };
    
    if (this._shadowRoot) {
      CSSStyleOptimizer.defineVariables(this._shadowRoot, this._cssVariables);
    }
  }

  updateVariable(name, value) {
    this._cssVariables[name] = value;
    
    if (this._shadowRoot) {
      CSSStyleOptimizer.defineVariables(this._shadowRoot, this._cssVariables);
    }
  }

  disconnectedCallback() {
    // Cleanup optimization resources
    CSSStyleOptimizer.optimizeMemoryUsage();
  }

  getStyleMetrics() {
    return CSSStyleOptimizer.getPerformanceMetrics();
  }
}

// Convenience CSS template function
export const css = CSSStyleOptimizer.css.bind(CSSStyleOptimizer);

// Convenience functions for common patterns
export const createSharedStyles = CSSStyleOptimizer.createSharedStyleSheet.bind(CSSStyleOptimizer);
export const optimizeStyles = CSSStyleOptimizer.minifyCSS.bind(CSSStyleOptimizer);
export const getStyleMetrics = CSSStyleOptimizer.getPerformanceMetrics.bind(CSSStyleOptimizer);