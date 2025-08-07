/**
 * BRUTAL V4 - Template Utilities Module
 * Helper functions for template manipulation
 */

/**
 * Template utilities
 */
export const TemplateUtils = {
    /**
     * Clear template cache
     */
    clearCache() {
        // Import from cache module
        import('./cache.js').then(({ clearCache }) => clearCache());
    },
    
    /**
     * Get cache stats with detailed metrics
     */
    async getCacheStats() {
        const { getCacheStats } = await import('./cache.js');
        return getCacheStats();
    },
    
    /**
     * Create reusable template
     */
    createTemplate(templateFunction) {
        return function(...args) {
            return templateFunction(...args);
        };
    },
    
    /**
     * Join template arrays
     */
    join(templates, separator = '') {
        return templates.map(t => t.innerHTML || t).join(separator);
    },
    
    /**
     * Conditional template rendering
     */
    when(condition, template, elseTemplate = '') {
        return condition ? template : elseTemplate;
    },
    
    /**
     * Map array to templates
     */
    map(array, templateFunction) {
        return array.map(templateFunction);
    },
    
    /**
     * Repeat template
     */
    repeat(count, templateFunction) {
        return Array.from({ length: count }, (_, i) => templateFunction(i));
    }
};