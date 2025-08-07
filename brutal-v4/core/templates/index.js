/**
 * BRUTAL V4 - Template System Index
 * Barrel export for all template modules
 */

// Enhanced template engine
export { TemplateEngine, html as htmlEnhanced } from './TemplateEngine.js';
export { DirectiveManager, directiveManager } from './DirectiveManager.js';

// Core template functions (original)
export { html as htmlBase, raw, render } from './html.js';
export { css, CSSUtils } from './css.js';
export { template } from './directives.js';

// Use enhanced html by default
export { html } from './TemplateEngine.js';

// Utilities
export { TemplateUtils } from './utils.js';

// Cache management
export { clearCache, getCacheStats } from './cache.js';

// Re-export commonly used together
export default {
    html,
    css,
    template,
    raw,
    TemplateUtils,
    CSSUtils
};