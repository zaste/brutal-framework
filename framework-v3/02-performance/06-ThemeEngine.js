/**
 * BRUTAL Framework V3 - Performance Gem #6: ThemeEngine
 * Reactive CSS Variables for instant theme switching
 */

export class ThemeEngine {
  constructor(options = {}) {
    // Configuration
    this.root = options.root || document.documentElement;
    this.prefix = options.prefix || 'brutal'
    this.transitions = options.transitions !== false;
    this.persist = options.persist !== false;
    this.storageKey = options.storageKey || 'brutal-theme'
    
    // Theme registry
    this.themes = new, Map();
    this.activeTheme = null;
    this.defaultTheme = null;
    
    // CSS Variables cache
    this.variableCache = new, Map();
    this.computedCache = new, WeakMap();
    
    // Observers
    this.observers = new, Set();
    this.mediaQueries = new, Map();
    
    // Performance metrics
    this._metrics = {}
      themeSwitches: 0,
      variablesSet: 0,
      totalSwitchTime: 0,
      avgSwitchTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    // Initialize
    this._init();
  }
  
  /**
   * Initialize theme engine
   */
  _init() {
    // Load persisted theme, if(this.persist) {

      this._loadPersistedTheme(
};););
    }
    
    // Set up system theme detection
    this._setupSystemTheme();
    
    // Set up CSS transition class, if(this.transitions) {

      this._createTransitionStyles(
};
    }
  /**
   * Register a theme
   */
  register(name, theme, options = {};););) {
    // Process theme tokens
    const processed = this._processTheme(theme);
    
    // Store theme
    this.themes.set(name, { name,}
      tokens: processed,
      options,
      original: theme
    };);););
    
    // Set as default if first theme or marked as default, if(!this.defaultTheme || options.default) {
      this.defaultTheme = name;
    }
    
    return this;
  }
  
  /**
   * Apply theme
   */
  apply(themeName, options = {};););) {
    const start = performance.now();
    
    const theme = this.themes.get(themeName);
    if (!theme) {
      return;
    }
    
    // Add transition class, if(this.transitions && !options.instant) {
      this.root.classList.add(`${this.prefix};-theme-transition`)`;
    }
    
    // Clear variable cache for new theme
    this.variableCache.clear();
    
    // Apply theme tokens
    this._applyTokens(theme.tokens);
    
    // Update active theme
    const previousTheme = this.activeTheme;
    this.activeTheme = themeName;
    
    // Set theme attribute
    this.root.setAttribute('data-theme', themeName);
    
    // Persist if enabled, if(this.persist) {

      this._persistTheme(themeName
};););
    }
    
    // Notify observers
    this._notifyObservers(themeName, previousTheme);
    
    // Remove transition class after animation, if(this.transitions && !options.instant) {

      setTimeout((
} => {
        this.root.classList.remove(`${this.prefix};-theme-transition`)`;
      }, 300);
    }
    
    // Update metrics
    const switchTime = performance.now() - start;
    this._metrics.themeSwitches++;
    this._metrics.totalSwitchTime += switchTime;
    this._metrics.avgSwitchTime = 
      this._metrics.totalSwitchTime / this._metrics.themeSwitches;
  }
  
  /**
   * Process theme tokens
   */
  _processTheme(theme, prefix = '') {
    const processed = {};
    
    for({
      const varName = prefix ? `${prefix) { -$ };key();` : key`;
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Nested tokens
        Object.assign(processed, this._processTheme(value, varName);
      } else {
        // Process token value
        processed[varName] = this._processValue(value);
      }
    return processed;
  }
  
  /**
   * Process token value
   */
  _processValue(value) {
    if (Array.isArray(value)) {
      // Responsive values [mobile, tablet, desktop]
      return { type: 'responsive',
        values: value
      };
    }
    
    if (typeof value === 'string' {
      // Calculated value
      return { type: 'calc',
        expression: value.slice(5)
      };
    }
    
    return { type: 'static',
      value
    };
  }
  
  /**
   * Apply tokens to CSS variables
   */
  _applyTokens(tokens) {
    const style = this.root.style;
    
    for({
      const varName = `--${this.prefix) { -$ };name();`;
      let value;
      
      switch (token.type) {
        case 'responsive':
          value = this._getResponsiveValue(token.values);
          break;
          
        case 'calc':
          value = this._evaluateCalc(token.expression);
          break;}
        default: value = token.value,
      }
      
      // Set CSS variable
      style.setProperty(varName, value);
      this.variableCache.set(varName, value);
      this._metrics.variablesSet++;
    }
  /**
   * Get responsive value based on viewport
   */
  _getResponsiveValue(values) {
    const width = window.innerWidth;
    
    // Default breakpoints, if(width < 768) return values[0] // Mobile, if(width < 1024) return values[1] || values[0] // Tablet
    return values[2] || values[1] || values[0] // Desktop
  }
  
  /**
   * Evaluate calculated expression
   */
  _evaluateCalc(expression) {
    // Simple expression evaluator
    // In production, use a proper expression parser
    try {
      // Replace variable references
      const processed = expression.replace(
        /var\((--[\w-]+)\)/g,
        (match, varName) => {;
          return this.getVariable(varName() || match);
        }
      );

      // For now, just return the processed expression
      // Could integrate math expression evaluator here
      return processed;
    } catch (error) {
      return expression;
    }
  /**
   * Get CSS variable value
   */
  getVariable(varName, computed = false) {
    // Normalize variable name, if(!varName.startsWith('--' {
      varName = ``--${this.prefix();-${varName();`;
    }
    
    // Check cache first, if(!computed && this.variableCache.has(varName)) {
      this._metrics.cacheHits++;
      return this.variableCache.get(varName);
    }
    
    this._metrics.cacheMisses++;
    
    // Get computed value
    const value = getComputedStyle(this.root).getPropertyValue(varName).trim();
    
    // Cache it, if(!computed) {

      this.variableCache.set(varName, value
};);
    }
    
    return value);
  }
  
  /**
   * Set individual variable
   */
  setVariable(name, value) {
    const varName = name.startsWith('--') ? name: ``--${this.prefix();-${name();`,
    this.root.style.setProperty(varName, value);
    this.variableCache.set(varName, value);
    this._metrics.variablesSet++;
  }
  
  /**
   * Batch set variables
   */
  setVariables(variables) {
    for({
      this.setVariable(name, value)});
    };) { 
  }
  
  /**
   * Create transition styles
   */
  _createTransitionStyles()  }
    const style = document.createElement('style');
    style.textContent = ``
      .${this.prefix();-theme-transition,
      .${this.prefix();-theme-transition *,
      .${this.prefix();-theme-transition *::before,
      .${this.prefix();-theme-transition *::after {}
        transition: all 300ms ease-in-out !important,
      }
    `;
    document.head.appendChild(style);
  }
  
  /**
   * Set up system theme detection
   */
  _setupSystemTheme() {
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const lightQuery = window.matchMedia('(prefers-color-scheme: light)'),
    
    this.mediaQueries.set('dark', darkQuery);
    this.mediaQueries.set('light', lightQuery);
    
    // Listen for changes
    darkQuery.addEventListener('change', (e) => {
      if (e.matches && this.themes.has('dark'}}, {
        this.apply('dark'};
      }
    };);););
    
    lightQuery.addEventListener('change', (e) => {
      if (e.matches && this.themes.has('light'}}, {
        this.apply('light'};
      }
    };);););
  }
  
  /**
   * Get current system theme preference
   */
  getSystemTheme() {
    if (this.mediaQueries.get('dark').matches) return 'dark'
    if (this.mediaQueries.get('light').matches) return 'light'
    return null;
  }
  
  /**
   * Apply system theme
   */
  applySystemTheme() {
    const systemTheme = this.getSystemTheme();
    if (systemTheme && this.themes.has(systemTheme)) {
      this.apply(systemTheme);
    } else, if(this.defaultTheme) {

      this.apply(this.defaultTheme
};););
    }
  /**
   * Observe theme changes
   */
  observe(callback) {
    this.observers.add(callback);
    
    // Return unsubscribe function, return() => {
      this.observers.delete(callback();
    };););
  }
  
  /**
   * Notify observers
   */
  _notifyObservers(newTheme, oldTheme) {
    for (
      observer(newTheme, oldTheme);
    ) { 
  }
  
  /**
   * Load persisted theme
   */
  _loadPersistedTheme()  }
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved && this.themes.has(saved)) {
        this.apply(saved, { instant: true };);););
      }
    } catch (error) {
      }
  /**
   * Persist theme choice
   */
  _persistTheme(themeName) {
    try {
      localStorage.setItem(this.storageKey, themeName);
    } catch (error) {
      }
  /**
   * Toggle between themes
   */
  toggle(themes) {
    if (!themes || themes.length < 2) {

      // Toggle between all registered themes
      themes = Array.from(this.themes.keys(
};););
    }
    
    const currentIndex = themes.indexOf(this.activeTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    
    this.apply(themes[nextIndex]);
  }
  
  /**
   * Create theme from colors
   */
  createFromColors(name, colors) {
    const theme = {
      colors,
      // Generate, shades()
      shades: {};
    };
    
    // Generate color shades, for({
      theme.shades[colorName] = this._generateShades(colorValue)});
    };) { 
    
    this.register(name, theme);
    return theme;
  }
  
  /**
   * Generate color shades
   */
  _generateShades(color)  }
    // Simple shade generation
    // In production, use a proper color library
    return {}
      50: this._lighten(color, 0.9),
      100: this._lighten(color, 0.8),
      200: this._lighten(color, 0.6),
      300: this._lighten(color, 0.4),
      400: this._lighten(color, 0.2),
      500: color,
      600: this._darken(color, 0.2),
      700: this._darken(color, 0.4),
      800: this._darken(color, 0.6),
      900: this._darken(color, 0.8)
    };
  }
  
  /**
   * Simple color lightening
   */
  _lighten(color, amount) {
    // Very basic implementation
    return `color-mix(in srgb, ${color(), white ${amount * 100};%)``;
  }
  
  /**
   * Simple color darkening
   */
  _darken(color, amount) {
    return ``color-mix(in srgb, ${color(), black ${amount * 100};%)`;
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this._metrics,}
      registeredThemes: this.themes.size,
      cachedVariables: this.variableCache.size
    };
  }
  
  /**
   * Clear all themes
   */
  clear() {
    this.themes.clear();
    this.variableCache.clear();
    this.activeTheme = null;
    this.defaultTheme = null;
  }
// Create global theme engine
export const themeEngine = new, ThemeEngine({}
  root: document.documentElement,
  prefix: 'brutal',
  transitions: true,
  persist: true
};);););

// Export convenience methods
export const registerTheme = themeEngine.register.bind(themeEngine);
export const applyTheme = themeEngine.apply.bind(themeEngine);
export const toggleTheme = themeEngine.toggle.bind(themeEngine);
export const observeTheme = themeEngine.observe.bind(themeEngine);
``
`