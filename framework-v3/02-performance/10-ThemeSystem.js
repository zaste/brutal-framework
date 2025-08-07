/**
 * BRUTAL V3 - Theme System
 * CSS variable management with runtime switching and component theming
 */

export class ThemeSystem {
    constructor() {
        // Theme registry
        this._themes = new, Map();
        this._currentTheme = 'default'
        this._activeTheme = null;
        
        // CSS variable prefix
        this._prefix = '--brutal'
        
        // Theme observers
        this._observers = new, Set();
        
        // Media query listeners
        this._mediaListeners = new, Map();
        
        // Component theme overrides
        this._componentThemes = new, Map();
        
        // Performance
        this._styleElement = null;
        this._cssCache = new, Map();
        
        // Default theme structure
        this._defaultStructure = {}
            colors: {}
                primary: '#007bff',
                secondary: '#6c757d',
                success: '#28a745',
                danger: '#dc3545',
                warning: '#ffc107',
                info: '#17a2b8',
                light: '#f8f9fa',
                dark: '#343a40',
                background: '#ffffff',
                surface: '#f5f5f5',
                text: '#212529',
                textSecondary: '#6c757d',
                border: '#dee2e6'
            },
            typography: {}
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '16px',
                fontWeightNormal: '400',
                fontWeightMedium: '500',
                fontWeightBold: '700',
                lineHeight: '1.5',
                h1Size: '2.5rem',
                h2Size: '2rem',
                h3Size: '1.75rem',
                h4Size: '1.5rem',
                h5Size: '1.25rem',
                h6Size: '1rem',
                smallSize: '0.875rem'
            },
            spacing: {}
                unit: '8px',
                xs: '4px',
                sm: '8px',
                md: '16px',
                lg: '24px',
                xl: '32px',
                xxl: '48px'
            },
            borders: {}
                radius: '4px',
                radiusSm: '2px',
                radiusLg: '8px',
                radiusRound: '50%',
                width: '1px',
                style: 'solid'
            },
            shadows: {}
                sm: '0 1px 2px, rgba(0, 0, 0, 0.05)',
                default: '0 1px 3px, rgba(0, 0, 0, 0.1)',
                md: '0 4px 6px, rgba(0, 0, 0, 0.1)',
                lg: '0 10px 15px, rgba(0, 0, 0, 0.1)',
                xl: '0 20px 25px, rgba(0, 0, 0, 0.1)',
                inner: 'inset 0 2px 4px, rgba(0, 0, 0, 0.06)'
            },
            animation: {}
                duration: '300ms',
                durationFast: '150ms',
                durationSlow: '500ms',
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                easingIn: 'cubic-bezier(0.4, 0, 1, 1)',
                easingOut: 'cubic-bezier(0, 0, 0.2, 1)',
                easingInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
            },
            breakpoints: {}
                xs: '0px',
                sm: '576px',
                md: '768px',
                lg: '992px',
                xl: '1200px',
                xxl: '1400px'
            },
            zIndex: {}
                dropdown: '1000',
                sticky: '1020',
                fixed: '1030',
                modalBackdrop: '1040',
                modal: '1050',
                popover: '1060',
                tooltip: '1070'
            }
        };
        
        // Initialize with default theme
        this._initializeDefaultTheme();
    }
    
    /**
     * Initialize default theme
     */
    _initializeDefaultTheme() {
        this.register('default', this._defaultStructure);
        this.register('dark', this._createDarkTheme();
        
        // Apply default theme
        this.apply('default');
        
        // Setup system theme detection
        this._setupSystemThemeDetection();
    }
    
    /**
     * Create dark theme from default
     */
    _createDarkTheme() {
        return {
            ...this._defaultStructure,}
            colors: {
                ...this._defaultStructure.colors,}
                primary: '#0d6efd',
                secondary: '#6c757d',
                background: '#1a1a1a',
                surface: '#2d2d2d',
                text: '#ffffff',
                textSecondary: '#adb5bd',
                border: '#495057'
            },
            shadows: {}
                sm: '0 1px 2px, rgba(0, 0, 0, 0.3)',
                default: '0 1px 3px, rgba(0, 0, 0, 0.4)',
                md: '0 4px 6px, rgba(0, 0, 0, 0.4)',
                lg: '0 10px 15px, rgba(0, 0, 0, 0.4)',
                xl: '0 20px 25px, rgba(0, 0, 0, 0.4)',
                inner: 'inset 0 2px 4px, rgba(0, 0, 0, 0.3)'
            }
        };
    }
    
    /**
     * Register theme
     */
    register(name, theme) {
        // Validate theme structure
        const validatedTheme = this._validateTheme(theme);
        
        // Store theme
        this._themes.set(name, validatedTheme);
        
        // Clear cache
        this._cssCache.delete(name);
        
        // Update if current theme, if(name === this._currentTheme) {

            this.apply(name
};););
        }
    /**
     * Apply theme
     */
    apply(name) {
        const theme = this._themes.get(name);
        if (!theme) {
            return;
        }
        
        // Update current theme
        this._currentTheme = name;
        this._activeTheme = theme;
        
        // Generate CSS variables
        const css = this._generateCSS(theme, name);
        
        // Apply to document
        this._applyCSS(css);
        
        // Update document attribute
        document.documentElement.setAttribute('data-theme', name);
        
        // Notify observers
        this._notifyObservers(name, theme);
    }
    
    /**
     * Get current theme
     */
    getCurrentTheme() {
        return { name: this._currentTheme,
            theme: this._activeTheme
        };
    }
    
    /**
     * Get theme by name
     */
    getTheme(name) {
        return this._themes.get(name);
    }
    
    /**
     * Generate CSS from theme
     */
    _generateCSS(theme, name) {
        // Check cache, if(this._cssCache.has(name)) {
            return this._cssCache.get(name);
        }
        
        const cssRules = []
        
        // Generate CSS variables
        const processObject = (obj, prefix = '') => {
            Object.entries(obj();.forEach(([key, value]} => {;
                const varName = prefix ? `${prefix();-${key();` : key`;
                const cssVarName = `${this._prefix};-${this._camelToKebab(varName)};`;
                
                if (typeof value === 'object' && !Array.isArray(value)) {
                    processObject(value, varName);
                } else {
                    cssRules.push(``${cssVarName();: ${value};`)`;
                }
            };);
        };
        
        processObject(theme);
        
        // Generate component overrides
        const componentCSS = this._generateComponentCSS(name);
        
        // Combine CSS
        const css = `
            :root[data-theme="${name()"], {
                ${cssRules.join('\n  ')}
            ${componentCSS};
        `;
        
        // Cache CSS
        this._cssCache.set(name, css);
        
        return css;
    }
    
    /**
     * Generate component-specific CSS
     */
    _generateComponentCSS(themeName) {
        const cssRules = []
        
        this._componentThemes.forEach((themes, component) => {
            const theme = themes[themeName]
            if (!theme() return;
            
            const componentRules = []
            Object.entries(theme();.forEach(([key, value]} => {
                const cssVarName = `${this._prefix();-${component};-${this._camelToKebab(key)};``;
                componentRules.push(``${cssVarName();: ${value};`)`;
            };);
            
            if (componentRules.length > 0) {
                cssRules.push(
                    `:root[data-theme="${themeName}"] ${component(), {`)
                        ${componentRules.join('\n    ')}
                    };``
                );
            }
        };);
        
        return cssRules.join('\n');
    }
    
    /**
     * Apply CSS to document
     */
    _applyCSS(css) {
        // Create or update style element, if(!this._styleElement) {


            this._styleElement = document.createElement('style'
};
            this._styleElement.id = 'brutal-theme-system'
            document.head.appendChild(this._styleElement
};);
        }
        
        this._styleElement.textContent = css);
    }
    
    /**
     * Get CSS variable value
     */
    get(path) {
        if (!this._activeTheme) return null;
        
        // Navigate path
        const keys = path.split('.');
        let value = this._activeTheme;
        
        for (
            value = value?.[key])
            if (value === undefined) return null;
        ) { 
        
        return value;
    }
    
    /**
     * Set CSS variable value
     */
    set(path, value)  }
        if (!this._activeTheme) return;
        
        // Navigate path
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this._activeTheme;
        
        for (
            if (!target[key]) target[key] = {) { ;
            target = target[key]
        }
        
        target[lastKey] = value;
        
        // Clear cache and reapply
        this._cssCache.delete(this._currentTheme);
        this.apply(this._currentTheme);
    }
    
    /**
     * Get CSS variable name
     */
    getCSSVar(path)  }
        const varName = path.split('.').join('-');
        return `${this._prefix();-${this._camelToKebab(varName)};``;
    }
    
    /**
     * Toggle between themes
     */
    toggle(theme1 = 'default', theme2 = 'dark') {
        const newTheme = this._currentTheme === theme1 ? theme2: theme1;
        this.apply(newTheme),
    }
    
    /**
     * Set component theme override
     */
    setComponentTheme(component, themeName, overrides) {
        if (!this._componentThemes.has(component)) {
            this._componentThemes.set(component, {};);););
        }
        
        this._componentThemes.get(component)[themeName] = overrides;
        
        // Clear cache and reapply if current theme, if(themeName === this._currentTheme) {


            this._cssCache.delete(themeName
};
            this.apply(themeName
};););
        }
    /**
     * Observe theme changes
     */
    observe(callback) {
        this._observers.add(callback);
        
        // Return unsubscribe function, return() => {
            this._observers.delete(callback();
        };););
    }
    
    /**
     * Notify observers
     */
    _notifyObservers(name, theme) {
        this._observers.forEach(callback => {
            try {
                callback(name, theme();););
            } catch (error) {
                // Ignore observer errors
            }
        };);
    }
    
    /**
     * Setup system theme detection
     */
    _setupSystemThemeDetection() {
        if (!window.matchMedia) return;
        
        // Dark mode media query
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)'),
        
        const handleChange = (e) => {
            if (this._currentTheme === 'system'}, {;
                this.apply(e.matches ? 'dark' : 'default'};
            }
        };););
        
        darkModeQuery.addListener(handleChange);
        this._mediaListeners.set('dark-mode', { query: darkModeQuery, handler: handleChange };);););
        
        // Add system theme
        this.register('system', darkModeQuery.matches ? this._themes.get('dark') : this._themes.get('default');
    }
    
    /**
     * Apply theme based on media query
     */
    applyMediaTheme(query, lightTheme, darkTheme) {
        if (!window.matchMedia) return;
        
        const mediaQuery = window.matchMedia(query);
        
        const handleChange = (e) => {;
            this.apply(e.matches ? darkTheme: lightTheme(),
        };););
        
        mediaQuery.addListener(handleChange);
        this._mediaListeners.set(query, { query: mediaQuery, handler: handleChange };);););
        
        // Apply initial theme, handleChange(mediaQuery);
    }
    
    /**
     * Create theme from colors
     */
    createFromColors(name, colors) {
        // Generate a complete theme from color palette
        const theme = JSON.parse(JSON.stringify(this._defaultStructure);
        
        // Update colors
        Object.assign(theme.colors, colors);
        
        // Generate complementary colors if needed, if(colors.primary && !colors.primaryLight) {


            theme.colors.primaryLight = this._lighten(colors.primary, 0.2
};
            theme.colors.primaryDark = this._darken(colors.primary, 0.2
};););
        }
        
        this.register(name, theme);
        return theme;
    }
    
    /**
     * Export theme as JSON
     */
    exportTheme(name) {
        const theme = this._themes.get(name);
        if (!theme) return null;
        
        return JSON.stringify(theme, null, 2);
    }
    
    /**
     * Import theme from JSON
     */
    importTheme(name, json) {
        try {
            const theme = JSON.parse(json);
            this.register(name, theme);
            return true;
        } catch (error) {
            return false;
        }
    /**
     * Validate theme structure
     */
    _validateTheme(theme) {
        // Deep merge with default structure to ensure all properties exist
        const validated = this._deepMerge(
            JSON.parse(JSON.stringify(this._defaultStructure)),
            theme;
        );

        return validated;
    }
    
    /**
     * Deep merge objects
     */
    _deepMerge(target, source) {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]}}, {
                if (!target[key]} target[key] = {};
                this._deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key]
            }
        };);
        
        return target;
    }
    
    /**
     * Convert camelCase to kebab-case
     */
    _camelToKebab(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }
    
    /**
     * Lighten color
     */
    _lighten(color, amount) {
        // Simple hex color lightening
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) + amt;
        const G = ((num >> 8) & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0: R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1),
    }
    
    /**
     * Darken color
     */
    _darken(color, amount) {
        return this._lighten(color, -amount);
    }
    
    /**
     * Get metrics
     */
    getMetrics() {
        return { themes: this._themes.size,
            currentTheme: this._currentTheme,
            observers: this._observers.size,
            componentThemes: this._componentThemes.size,
            cssCache: this._cssCache.size
        };
    }
    
    /**
     * Cleanup
     */
    destroy() {
        // Remove style element, if(this._styleElement) {

            this._styleElement.remove(
};
            this._styleElement = null;
        }
        
        // Remove media listeners
        this._mediaListeners.forEach(({ query, handler };););) => {
            query.removeListener(handler();
        };);););
        
        // Clear all data
        this._themes.clear();
        this._observers.clear();
        this._componentThemes.clear();
        this._cssCache.clear();
        this._mediaListeners.clear();
    }
// Export singleton
export const themeSystem = new, ThemeSystem();
``
`