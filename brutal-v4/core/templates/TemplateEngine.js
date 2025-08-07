/**
 * BRUTAL V4 - Template Engine
 * Enhanced template system with directive support
 * Zero dependencies, native template literals
 */

import { html as htmlBase, raw } from './html.js';
import { DirectiveManager } from './DirectiveManager.js';

// Cache for compiled templates
const templateCache = new WeakMap();
const directiveCache = new WeakMap();

export class TemplateEngine {
    static directives = new DirectiveManager();

    /**
     * Enhanced html tagged template literal
     */
    static html(strings, ...values) {
        // Check if template has directives
        const hasDirectives = strings.some(str => 
            str.includes(':if=') || 
            str.includes(':for=') || 
            str.includes(':ref=') ||
            str.includes(':show=') ||
            str.includes(':class=') ||
            str.includes(':style=') ||
            str.includes(':prefetch=') ||
            str.includes(':aria-')
        );

        if (!hasDirectives) {
            // Use base html for better performance
            return htmlBase(strings, ...values);
        }

        // Process with directives
        return this._processWithDirectives(strings, values);
    }

    /**
     * Process template with directives
     */
    static _processWithDirectives(strings, values) {
        const key = strings.join('{{}}');
        let compiled = templateCache.get(strings);

        if (!compiled) {
            compiled = this._compileTemplate(strings);
            templateCache.set(strings, compiled);
        }

        // Execute compiled template with values
        return compiled(values);
    }

    /**
     * Compile template with directive analysis
     */
    static _compileTemplate(strings) {
        const template = strings.join('{{VALUE}}');
        const directives = this._extractDirectives(template);

        return (values) => {
            let processed = template;
            let valueIndex = 0;

            // Apply directives
            directives.forEach(dir => {
                processed = this.directives.apply(dir.type, processed, dir, values);
            });

            // Replace value placeholders
            processed = processed.replace(/\{\{VALUE\}\}/g, () => {
                const value = values[valueIndex++];
                return this._sanitizeValue(value);
            });

            // Create template element
            const temp = document.createElement('template');
            temp.innerHTML = processed;
            return temp;
        };
    }

    /**
     * Extract directives from template
     */
    static _extractDirectives(template) {
        const directives = [];
        const directivePattern = /:(if|for|ref|show|class|style)="([^"]+)"/g;
        let match;

        while ((match = directivePattern.exec(template)) !== null) {
            directives.push({
                type: match[1],
                expression: match[2],
                index: match.index,
                full: match[0]
            });
        }

        return directives;
    }

    /**
     * Sanitize value for safe HTML insertion
     */
    static _sanitizeValue(value) {
        if (value == null) return '';
        if (typeof value === 'object') {
            if (value instanceof HTMLElement) {
                return value.outerHTML;
            }
            if (Array.isArray(value)) {
                return value.map(v => this._sanitizeValue(v)).join('');
            }
            return this._escapeHtml(String(value));
        }
        return this._escapeHtml(String(value));
    }

    /**
     * Escape HTML entities
     */
    static _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Register custom directive
     */
    static registerDirective(name, handler) {
        this.directives.register(name, handler);
    }

    /**
     * Create reusable template
     */
    static createTemplate(name, templateFn) {
        const templates = window.BRUTAL_TEMPLATES || (window.BRUTAL_TEMPLATES = {});
        templates[name] = templateFn;
        return templateFn;
    }

    /**
     * Get named template
     */
    static getTemplate(name) {
        return window.BRUTAL_TEMPLATES?.[name];
    }

    /**
     * Clear template cache
     */
    static clearCache() {
        templateCache.clear();
        directiveCache.clear();
    }
}

// Export enhanced html function
export const html = TemplateEngine.html.bind(TemplateEngine);

// Export utility functions
export { raw } from './html.js';
export { css } from './css.js';