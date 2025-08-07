/**
 * BRUTAL V4 - HTML Template Module
 * Core HTML template literal processing
 */

import { createPlaceholder, interpolateTemplate } from './interpolation.js';
import { getTemplateCache, setTemplateCache } from './cache.js';

/**
 * HTML template function
 * Processes template literals into HTML template elements
 * Optimized for component integration
 */
export function html(strings, ...values) {
    // Performance tracking
    const startTime = performance.now();
    
    // Create cache key from strings
    const cacheKey = strings.join('{{}}');
    
    // Check cache first
    const cached = getTemplateCache(cacheKey);
    if (cached) {
        const result = interpolateTemplate(cached.template.cloneNode(true), values, cached.placeholders);
        
        // Track cache hit
        if (window.BRUTAL_DEBUG) {
            const duration = performance.now() - startTime;
            window.dispatchEvent(new CustomEvent('brutal:template:cache-hit', {
                detail: { cacheKey, duration, values: values.length }
            }));
        }
        
        return result;
    }
    
    // Process template with enhanced interpolation
    let htmlString = '';
    const placeholders = [];
    
    for (let i = 0; i < strings.length; i++) {
        htmlString += strings[i];
        
        if (i < values.length) {
            const placeholder = createPlaceholder(i, values[i]);
            placeholders.push(placeholder);
            htmlString += placeholder.marker;
        }
    }
    
    // Create template element
    const template = document.createElement('template');
    template.innerHTML = htmlString;
    
    // Cache the template with metadata
    setTemplateCache(cacheKey, {
        template: template.cloneNode(true),
        placeholders: placeholders,
        created: Date.now(),
        hits: 0
    });
    
    // Interpolate values and return
    const result = interpolateTemplate(template, values, placeholders);
    
    // Track cache miss
    if (window.BRUTAL_DEBUG) {
        const duration = performance.now() - startTime;
        window.dispatchEvent(new CustomEvent('brutal:template:cache-miss', {
            detail: { cacheKey, duration, values: values.length, templateSize: htmlString.length }
        }));
    }
    
    return result;
}

/**
 * Raw HTML function (unsafe - use with caution)
 */
export function raw(value) {
    return {
        __brutal_raw: true,
        value: value
    };
}