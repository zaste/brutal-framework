/**
 * BRUTAL V4 - CSS Template Module
 * CSS template literal processing and utilities
 */

import { getStyleCache, setStyleCache } from './cache.js';

/**
 * CSS template function
 * Processes CSS template literals
 */
export function css(strings, ...values) {
    // Create cache key
    const cacheKey = strings.join('{{}}');
    
    // Check cache first
    const cached = getStyleCache(cacheKey);
    if (cached) {
        return interpolateCSS(cached, values);
    }
    
    // Process CSS
    let cssString = '';
    
    for (let i = 0; i < strings.length; i++) {
        cssString += strings[i];
        
        if (i < values.length) {
            cssString += createCSSPlaceholder(i);
        }
    }
    
    // Cache the CSS
    setStyleCache(cacheKey, cssString);
    
    // Interpolate and return
    return interpolateCSS(cssString, values);
}

/**
 * Create CSS placeholder for value interpolation
 */
function createCSSPlaceholder(index) {
    return `__BRUTAL_CSS_PLACEHOLDER_${index}__`;
}

/**
 * Interpolate CSS with actual values
 */
function interpolateCSS(cssString, values) {
    if (values.length === 0) {
        return cssString;
    }
    
    let result = cssString;
    
    // Replace CSS placeholders with actual values
    for (let i = 0; i < values.length; i++) {
        const placeholder = createCSSPlaceholder(i);
        const value = processCSSValue(values[i]);
        
        result = result.replaceAll(placeholder, value);
    }
    
    return result;
}

/**
 * Process value for CSS interpolation
 */
function processCSSValue(value) {
    if (value === null || value === undefined) {
        return '';
    }
    
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
    }
    
    if (typeof value === 'function') {
        return processCSSValue(value());
    }
    
    return String(value);
}

/**
 * Common CSS utilities
 */
export const CSSUtils = {
    /**
     * Create CSS custom properties
     */
    vars(variables) {
        return Object.entries(variables)
            .map(([key, value]) => `--${key}: ${value}`)
            .join('; ');
    },
    
    /**
     * Use CSS custom property
     */
    var(name, fallback = '') {
        return `var(--${name}${fallback ? `, ${fallback}` : ''})`;
    },
    
    /**
     * Media query helper
     */
    media(query, styles) {
        return `@media ${query} { ${styles} }`;
    },
    
    /**
     * Keyframes helper
     */
    keyframes(name, frames) {
        const frameStrings = Object.entries(frames)
            .map(([key, value]) => `${key} { ${value} }`)
            .join(' ');
        return `@keyframes ${name} { ${frameStrings} }`;
    }
};