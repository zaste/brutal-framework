/**
 * BRUTAL V4 - Design System Foundation
 * CSS custom properties, theming, responsive breakpoints
 * Pure web standards with zero dependencies
 */

/**
 * BrutalDesign - Design token and theme management
 * Provides systematic design language foundation
 * Integrates with CSS custom properties and web standards
 */
export class BrutalDesign {
    static tokens = new Map();
    static themes = new Map();
    static breakpoints = new Map();
    static currentTheme = 'light';
    static isInitialized = false;
    static sharedStyleSheet = null;
    
    /**
     * Initialize design system
     */
    static init() {
        if (this.isInitialized) return;
        
        this.setupDefaultTokens();
        this.setupDefaultThemes();
        this.setupDefaultBreakpoints();
        this.injectCSS();
        this.detectSystemTheme();
        this.watchSystemTheme();
        
        this.isInitialized = true;
    }
    
    /**
     * Setup default design tokens
     */
    static setupDefaultTokens() {
        // Color palette
        this.setTokens('colors', {
            // Primary colors
            'primary-50': '#eff6ff',
            'primary-100': '#dbeafe',
            'primary-200': '#bfdbfe',
            'primary-300': '#93c5fd',
            'primary-400': '#60a5fa',
            'primary-500': '#3b82f6',
            'primary-600': '#2563eb',
            'primary-700': '#1d4ed8',
            'primary-800': '#1e40af',
            'primary-900': '#1e3a8a',
            
            // Secondary colors
            'secondary-50': '#f8fafc',
            'secondary-100': '#f1f5f9',
            'secondary-200': '#e2e8f0',
            'secondary-300': '#cbd5e1',
            'secondary-400': '#94a3b8',
            'secondary-500': '#64748b',
            'secondary-600': '#475569',
            'secondary-700': '#334155',
            'secondary-800': '#1e293b',
            'secondary-900': '#0f172a',
            
            // Success colors
            'success-50': '#ecfdf5',
            'success-100': '#d1fae5',
            'success-200': '#a7f3d0',
            'success-300': '#6ee7b7',
            'success-400': '#34d399',
            'success-500': '#10b981',
            'success-600': '#059669',
            'success-700': '#047857',
            'success-800': '#065f46',
            'success-900': '#064e3b',
            
            // Warning colors
            'warning-50': '#fffbeb',
            'warning-100': '#fef3c7',
            'warning-200': '#fde68a',
            'warning-300': '#fcd34d',
            'warning-400': '#fbbf24',
            'warning-500': '#f59e0b',
            'warning-600': '#d97706',
            'warning-700': '#b45309',
            'warning-800': '#92400e',
            'warning-900': '#78350f',
            
            // Error colors
            'error-50': '#fef2f2',
            'error-100': '#fee2e2',
            'error-200': '#fecaca',
            'error-300': '#fca5a5',
            'error-400': '#f87171',
            'error-500': '#ef4444',
            'error-600': '#dc2626',
            'error-700': '#b91c1c',
            'error-800': '#991b1b',
            'error-900': '#7f1d1d',
            
            // Neutral colors
            'neutral-0': '#ffffff',
            'neutral-50': '#fafafa',
            'neutral-100': '#f5f5f5',
            'neutral-200': '#e5e5e5',
            'neutral-300': '#d4d4d4',
            'neutral-400': '#a3a3a3',
            'neutral-500': '#737373',
            'neutral-600': '#525252',
            'neutral-700': '#404040',
            'neutral-800': '#262626',
            'neutral-900': '#171717',
            'neutral-950': '#0a0a0a'
        });
        
        // Typography scale
        this.setTokens('typography', {
            // Font families
            'font-sans': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'font-serif': 'Georgia, Cambria, "Times New Roman", Times, serif',
            'font-mono': 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            
            // Font sizes
            'text-xs': '0.75rem',      // 12px
            'text-sm': '0.875rem',     // 14px
            'text-base': '1rem',       // 16px
            'text-lg': '1.125rem',     // 18px
            'text-xl': '1.25rem',      // 20px
            'text-2xl': '1.5rem',      // 24px
            'text-3xl': '1.875rem',    // 30px
            'text-4xl': '2.25rem',     // 36px
            'text-5xl': '3rem',        // 48px
            'text-6xl': '3.75rem',     // 60px
            'text-7xl': '4.5rem',      // 72px
            'text-8xl': '6rem',        // 96px
            'text-9xl': '8rem',        // 128px
            
            // Line heights
            'leading-none': '1',
            'leading-tight': '1.25',
            'leading-snug': '1.375',
            'leading-normal': '1.5',
            'leading-relaxed': '1.625',
            'leading-loose': '2',
            
            // Font weights
            'font-thin': '100',
            'font-extralight': '200',
            'font-light': '300',
            'font-normal': '400',
            'font-medium': '500',
            'font-semibold': '600',
            'font-bold': '700',
            'font-extrabold': '800',
            'font-black': '900'
        });
        
        // Spacing scale
        this.setTokens('spacing', {
            '0': '0px',
            'px': '1px',
            '0.5': '0.125rem',    // 2px
            '1': '0.25rem',       // 4px
            '1.5': '0.375rem',    // 6px
            '2': '0.5rem',        // 8px
            '2.5': '0.625rem',    // 10px
            '3': '0.75rem',       // 12px
            '3.5': '0.875rem',    // 14px
            '4': '1rem',          // 16px
            '5': '1.25rem',       // 20px
            '6': '1.5rem',        // 24px
            '7': '1.75rem',       // 28px
            '8': '2rem',          // 32px
            '9': '2.25rem',       // 36px
            '10': '2.5rem',       // 40px
            '11': '2.75rem',      // 44px
            '12': '3rem',         // 48px
            '14': '3.5rem',       // 56px
            '16': '4rem',         // 64px
            '20': '5rem',         // 80px
            '24': '6rem',         // 96px
            '28': '7rem',         // 112px
            '32': '8rem',         // 128px
            '36': '9rem',         // 144px
            '40': '10rem',        // 160px
            '44': '11rem',        // 176px
            '48': '12rem',        // 192px
            '52': '13rem',        // 208px
            '56': '14rem',        // 224px
            '60': '15rem',        // 240px
            '64': '16rem',        // 256px
            '72': '18rem',        // 288px
            '80': '20rem',        // 320px
            '96': '24rem'         // 384px
        });
        
        // Border radius
        this.setTokens('borderRadius', {
            'none': '0px',
            'sm': '0.125rem',    // 2px
            'base': '0.25rem',   // 4px
            'md': '0.375rem',    // 6px
            'lg': '0.5rem',      // 8px
            'xl': '0.75rem',     // 12px
            '2xl': '1rem',       // 16px
            '3xl': '1.5rem',     // 24px
            'full': '9999px'
        });
        
        // Shadow
        this.setTokens('shadow', {
            'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            'base': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
            'none': '0 0 #0000'
        });
        
        // Z-index
        this.setTokens('zIndex', {
            '0': '0',
            '10': '10',
            '20': '20',
            '30': '30',
            '40': '40',
            '50': '50',
            'auto': 'auto',
            'tooltip': '1000',
            'modal': '1050',
            'popover': '1100',
            'dropdown': '1150',
            'notification': '1200'
        });
        
        // Animation
        this.setTokens('animation', {
            'duration-75': '75ms',
            'duration-100': '100ms',
            'duration-150': '150ms',
            'duration-200': '200ms',
            'duration-300': '300ms',
            'duration-500': '500ms',
            'duration-700': '700ms',
            'duration-1000': '1000ms',
            
            'ease-linear': 'linear',
            'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
            'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
            'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)'
        });
    }
    
    /**
     * Setup default themes
     */
    static setupDefaultThemes() {
        // Light theme
        this.setTheme('light', {
            // Text colors
            'text-primary': 'var(--color-neutral-900)',
            'text-secondary': 'var(--color-neutral-600)',
            'text-tertiary': 'var(--color-neutral-500)',
            'text-inverse': 'var(--color-neutral-0)',
            
            // Background colors
            'bg-primary': 'var(--color-neutral-0)',
            'bg-secondary': 'var(--color-neutral-50)',
            'bg-tertiary': 'var(--color-neutral-100)',
            'bg-inverse': 'var(--color-neutral-900)',
            
            // Border colors
            'border-primary': 'var(--color-neutral-200)',
            'border-secondary': 'var(--color-neutral-300)',
            'border-focus': 'var(--color-primary-500)',
            
            // Component colors
            'surface': 'var(--color-neutral-0)',
            'surface-elevated': 'var(--color-neutral-0)',
            'overlay': 'rgba(0, 0, 0, 0.5)'
        });
        
        // Dark theme
        this.setTheme('dark', {
            // Text colors
            'text-primary': 'var(--color-neutral-100)',
            'text-secondary': 'var(--color-neutral-300)',
            'text-tertiary': 'var(--color-neutral-400)',
            'text-inverse': 'var(--color-neutral-900)',
            
            // Background colors
            'bg-primary': 'var(--color-neutral-900)',
            'bg-secondary': 'var(--color-neutral-800)',
            'bg-tertiary': 'var(--color-neutral-700)',
            'bg-inverse': 'var(--color-neutral-0)',
            
            // Border colors
            'border-primary': 'var(--color-neutral-700)',
            'border-secondary': 'var(--color-neutral-600)',
            'border-focus': 'var(--color-primary-400)',
            
            // Component colors
            'surface': 'var(--color-neutral-800)',
            'surface-elevated': 'var(--color-neutral-700)',
            'overlay': 'rgba(0, 0, 0, 0.8)'
        });
        
        // High contrast theme
        this.setTheme('high-contrast', {
            'text-primary': '#000000',
            'text-secondary': '#000000',
            'text-tertiary': '#000000',
            'text-inverse': '#ffffff',
            
            'bg-primary': '#ffffff',
            'bg-secondary': '#ffffff',
            'bg-tertiary': '#f0f0f0',
            'bg-inverse': '#000000',
            
            'border-primary': '#000000',
            'border-secondary': '#000000',
            'border-focus': '#0000ff',
            
            'surface': '#ffffff',
            'surface-elevated': '#ffffff',
            'overlay': 'rgba(0, 0, 0, 0.9)'
        });
    }
    
    /**
     * Setup default breakpoints
     */
    static setupDefaultBreakpoints() {
        this.setBreakpoints({
            'xs': { min: 0, max: 475 },
            'sm': { min: 476, max: 768 },
            'md': { min: 769, max: 1024 },
            'lg': { min: 1025, max: 1280 },
            'xl': { min: 1281, max: 1536 },
            '2xl': { min: 1537, max: Infinity }
        });
    }
    
    /**
     * Set design tokens
     */
    static setTokens(category, tokens) {
        this.tokens.set(category, { ...this.tokens.get(category), ...tokens });
    }
    
    /**
     * Get design token
     */
    static getToken(category, name) {
        const categoryTokens = this.tokens.get(category);
        return categoryTokens ? categoryTokens[name] : undefined;
    }
    
    /**
     * Set theme
     */
    static setTheme(name, theme) {
        this.themes.set(name, theme);
    }
    
    /**
     * Get theme
     */
    static getTheme(name) {
        return this.themes.get(name);
    }
    
    /**
     * Apply theme
     */
    static applyTheme(themeName) {
        const theme = this.getTheme(themeName);
        if (!theme) {
            console.warn(`[BrutalDesign] Theme '${themeName}' not found`);
            return false;
        }
        
        const root = document.documentElement;
        
        // Apply theme variables
        Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(`--theme-${key}`, value);
        });
        
        // Update theme attribute
        root.setAttribute('data-theme', themeName);
        this.currentTheme = themeName;
        
        // Emit theme change event
        this.emitThemeChange(themeName);
        
        return true;
    }
    
    /**
     * Set breakpoints
     */
    static setBreakpoints(breakpoints) {
        Object.entries(breakpoints).forEach(([name, config]) => {
            this.breakpoints.set(name, config);
        });
    }
    
    /**
     * Get current breakpoint
     */
    static getCurrentBreakpoint() {
        const width = window.innerWidth;
        
        for (const [name, config] of this.breakpoints) {
            if (width >= config.min && width <= config.max) {
                return name;
            }
        }
        
        return 'unknown';
    }
    
    /**
     * Check if breakpoint matches
     */
    static matchesBreakpoint(breakpointName) {
        return this.getCurrentBreakpoint() === breakpointName;
    }
    
    /**
     * Create media query for breakpoint
     */
    static createMediaQuery(breakpointName) {
        const config = this.breakpoints.get(breakpointName);
        if (!config) return null;
        
        let query = '';
        if (config.min > 0) {
            query += `(min-width: ${config.min}px)`;
        }
        if (config.max !== Infinity) {
            if (query) query += ' and ';
            query += `(max-width: ${config.max}px)`;
        }
        
        return query ? `@media ${query}` : null;
    }
    
    /**
     * Inject CSS custom properties
     */
    static injectCSS() {
        let css = ':root {\n';
        
        // Add all tokens as CSS custom properties
        for (const [category, tokens] of this.tokens) {
            for (const [name, value] of Object.entries(tokens)) {
                css += `  --${category}-${name}: ${value};\n`;
            }
        }
        
        css += '}\n\n';
        
        // Add responsive classes
        css += this.generateResponsiveCSS();
        
        // Add utility classes
        css += this.generateUtilityCSS();
        
        // Create shared Constructable StyleSheet if supported
        if (typeof CSSStyleSheet !== 'undefined' && 'replaceSync' in CSSStyleSheet.prototype) {
            if (!this.sharedStyleSheet) {
                this.sharedStyleSheet = new CSSStyleSheet();
            }
            this.sharedStyleSheet.replaceSync(css);
            
            // Also apply to document for global styles
            if (document.adoptedStyleSheets !== undefined) {
                const sheets = [...document.adoptedStyleSheets];
                if (!sheets.includes(this.sharedStyleSheet)) {
                    sheets.push(this.sharedStyleSheet);
                    document.adoptedStyleSheets = sheets;
                }
            }
        }
        
        // Fallback to style element
        const style = document.createElement('style');
        style.id = 'brutal-design-tokens';
        style.textContent = css;
        document.head.appendChild(style);
        
        // Store reference for components
        window.BrutalDesignSystem = {
            sharedStyleSheet: this.sharedStyleSheet,
            css: css
        };
    }
    
    /**
     * Generate responsive CSS
     */
    static generateResponsiveCSS() {
        let css = '';
        
        for (const [name, config] of this.breakpoints) {
            const mediaQuery = this.createMediaQuery(name);
            if (mediaQuery) {
                css += `${mediaQuery} {\n`;
                css += `  :root {\n`;
                css += `    --current-breakpoint: "${name}";\n`;
                css += `  }\n`;
                css += `}\n\n`;
            }
        }
        
        return css;
    }
    
    /**
     * Generate utility CSS
     */
    static generateUtilityCSS() {
        let css = '';
        
        // Theme transition
        css += `
* {
  transition: background-color var(--animation-duration-200) var(--animation-ease-out),
              border-color var(--animation-duration-200) var(--animation-ease-out),
              color var(--animation-duration-200) var(--animation-ease-out);
}

/* Focus styles */
:focus-visible {
  outline: 2px solid var(--theme-border-focus);
  outline-offset: 2px;
}

/* Screen reader only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* High contrast support */
@media (prefers-contrast: high) {
  :root {
    --theme-border-primary: #000000;
    --theme-border-secondary: #000000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    color-scheme: dark;
  }
}
`;
        
        return css;
    }
    
    /**
     * Detect system theme preference
     */
    static detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.applyTheme('dark');
        } else {
            this.applyTheme('light');
        }
    }
    
    /**
     * Watch for system theme changes
     */
    static watchSystemTheme() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleChange = (e) => {
                if (!document.documentElement.hasAttribute('data-theme-locked')) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            };
            
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleChange);
            } else {
                // Fallback for older browsers
                mediaQuery.addListener(handleChange);
            }
        }
    }
    
    /**
     * Lock theme (prevent automatic switching)
     */
    static lockTheme(themeName) {
        if (themeName) {
            this.applyTheme(themeName);
        }
        document.documentElement.setAttribute('data-theme-locked', 'true');
    }
    
    /**
     * Unlock theme (allow automatic switching)
     */
    static unlockTheme() {
        document.documentElement.removeAttribute('data-theme-locked');
        this.detectSystemTheme();
    }
    
    /**
     * Toggle between light and dark themes
     */
    static toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.lockTheme(newTheme);
        return newTheme;
    }
    
    /**
     * Emit theme change event
     */
    static emitThemeChange(themeName) {
        const event = new CustomEvent('brutal:design:theme-change', {
            detail: {
                theme: themeName,
                previous: this.currentTheme
            },
            bubbles: true,
            composed: true
        });
        
        document.dispatchEvent(event);
    }
    
    /**
     * Get all available themes
     */
    static getAvailableThemes() {
        return Array.from(this.themes.keys());
    }
    
    /**
     * Get current theme name
     */
    static getCurrentTheme() {
        return this.currentTheme;
    }
    
    /**
     * Validate color contrast
     */
    static validateContrast(foreground, background) {
        // Simple contrast validation - in production, use proper contrast calculation
        const fgLum = this.getLuminance(foreground);
        const bgLum = this.getLuminance(background);
        
        const contrast = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
        
        return {
            ratio: contrast,
            aa: contrast >= 4.5,
            aaa: contrast >= 7
        };
    }
    
    /**
     * Calculate relative luminance (simplified)
     */
    static getLuminance(color) {
        // Simplified luminance calculation
        // In production, use proper color parsing and gamma correction
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    
    /**
     * Create CSS custom property reference
     */
    static createReference(category, name) {
        return `var(--${category}-${name})`;
    }
    
    /**
     * Create theme reference
     */
    static createThemeReference(name) {
        return `var(--theme-${name})`;
    }
    
    /**
     * Export design tokens as JSON
     */
    static exportTokens() {
        const tokens = {};
        for (const [category, categoryTokens] of this.tokens) {
            tokens[category] = categoryTokens;
        }
        return tokens;
    }
    
    /**
     * Import design tokens from JSON
     */
    static importTokens(tokens) {
        for (const [category, categoryTokens] of Object.entries(tokens)) {
            this.setTokens(category, categoryTokens);
        }
        
        // Re-inject CSS if already initialized
        if (this.isInitialized) {
            const existingStyle = document.getElementById('brutal-design-tokens');
            if (existingStyle) {
                existingStyle.remove();
            }
            this.injectCSS();
        }
    }
}

/**
 * Design utilities
 */
export const DesignUtils = {
    /**
     * Get responsive value based on current breakpoint
     */
    getResponsiveValue(values) {
        const currentBreakpoint = BrutalDesign.getCurrentBreakpoint();
        return values[currentBreakpoint] || values.default || values[Object.keys(values)[0]];
    },
    
    /**
     * Create responsive CSS
     */
    createResponsiveCSS(property, values) {
        let css = '';
        
        for (const [breakpoint, value] of Object.entries(values)) {
            if (breakpoint === 'default') {
                css += `${property}: ${value};\n`;
            } else {
                const mediaQuery = BrutalDesign.createMediaQuery(breakpoint);
                if (mediaQuery) {
                    css += `${mediaQuery} {\n`;
                    css += `  ${property}: ${value};\n`;
                    css += `}\n`;
                }
            }
        }
        
        return css;
    },
    
    /**
     * Generate spacing utilities
     */
    generateSpacingClasses() {
        const spacing = BrutalDesign.tokens.get('spacing');
        let css = '';
        
        for (const [name, value] of Object.entries(spacing)) {
            css += `.m-${name} { margin: ${value}; }\n`;
            css += `.mt-${name} { margin-top: ${value}; }\n`;
            css += `.mr-${name} { margin-right: ${value}; }\n`;
            css += `.mb-${name} { margin-bottom: ${value}; }\n`;
            css += `.ml-${name} { margin-left: ${value}; }\n`;
            css += `.mx-${name} { margin-left: ${value}; margin-right: ${value}; }\n`;
            css += `.my-${name} { margin-top: ${value}; margin-bottom: ${value}; }\n`;
            
            css += `.p-${name} { padding: ${value}; }\n`;
            css += `.pt-${name} { padding-top: ${value}; }\n`;
            css += `.pr-${name} { padding-right: ${value}; }\n`;
            css += `.pb-${name} { padding-bottom: ${value}; }\n`;
            css += `.pl-${name} { padding-left: ${value}; }\n`;
            css += `.px-${name} { padding-left: ${value}; padding-right: ${value}; }\n`;
            css += `.py-${name} { padding-top: ${value}; padding-bottom: ${value}; }\n`;
        }
        
        return css;
    },
    
    /**
     * Create dark mode styles
     */
    createDarkModeStyles(styles) {
        return `
            @media (prefers-color-scheme: dark) {
                :root:not([data-theme="light"]) {
                    ${styles}
                }
            }
            
            [data-theme="dark"] {
                ${styles}
            }
        `;
    }
};

/**
 * Theme toggle component
 */
export class ThemeToggle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }
    
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                }
                
                button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border: 1px solid var(--theme-border-primary);
                    border-radius: var(--borderRadius-md);
                    background: var(--theme-surface);
                    color: var(--theme-text-primary);
                    cursor: pointer;
                    transition: all var(--animation-duration-200) var(--animation-ease-out);
                }
                
                button:hover {
                    background: var(--theme-bg-secondary);
                }
                
                button:focus-visible {
                    outline: 2px solid var(--theme-border-focus);
                    outline-offset: 2px;
                }
                
                .icon {
                    width: 20px;
                    height: 20px;
                    fill: currentColor;
                }
            </style>
            
            <button type="button" aria-label="Toggle theme">
                <svg class="icon light-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M12 18a6 6 0 100-12 6 6 0 000 12zM12 2v2m0 16v2m10-10h-2M4 12H2m15.071-7.071l-1.414 1.414M8.343 8.343L6.929 6.929m12.728 12.728l-1.414-1.414M8.343 15.657l-1.414 1.414"/>
                </svg>
                <svg class="icon dark-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="display: none;">
                    <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
            </button>
        `;
        
        this.updateIcon();
    }
    
    setupEventListeners() {
        const button = this.shadowRoot.querySelector('button');
        button.addEventListener('click', () => {
            BrutalDesign.toggleTheme();
            this.updateIcon();
        });
        
        // Listen for theme changes
        document.addEventListener('brutal:design:theme-change', () => {
            this.updateIcon();
        });
    }
    
    updateIcon() {
        const lightIcon = this.shadowRoot.querySelector('.light-icon');
        const darkIcon = this.shadowRoot.querySelector('.dark-icon');
        const currentTheme = BrutalDesign.getCurrentTheme();
        
        if (currentTheme === 'dark') {
            lightIcon.style.display = 'none';
            darkIcon.style.display = 'block';
        } else {
            lightIcon.style.display = 'block';
            darkIcon.style.display = 'none';
        }
    }
}

// Register theme toggle component
if (!customElements.get('theme-toggle')) {
    customElements.define('theme-toggle', ThemeToggle);
}

// Auto-initialize design system
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => BrutalDesign.init());
    } else {
        BrutalDesign.init();
    }
}