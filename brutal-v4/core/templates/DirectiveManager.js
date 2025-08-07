/**
 * BRUTAL V4 - Directive Manager
 * Native template directives for control flow and binding
 * Zero dependencies implementation
 */

const directiveHandlers = new Map();

export class DirectiveManager {
    constructor() {
        // Register built-in directives
        this._registerBuiltinDirectives();
    }

    /**
     * Register a directive handler
     */
    register(name, handler) {
        if (typeof handler !== 'function') {
            throw new Error(`Directive handler for '${name}' must be a function`);
        }
        directiveHandlers.set(name, handler);
    }

    /**
     * Apply directive to template
     */
    apply(type, template, directive, values) {
        const handler = directiveHandlers.get(type);
        if (!handler) {
            console.warn(`Unknown directive: ${type}`);
            return template;
        }
        return handler(template, directive, values);
    }

    /**
     * Register built-in directives
     */
    _registerBuiltinDirectives() {
        // :if directive - Conditional rendering
        this.register('if', (template, directive, values) => {
            const condition = this._evaluateExpression(directive.expression, values);
            if (!condition) {
                // Remove the element with :if
                const elementPattern = new RegExp(
                    `<[^>]+${directive.full}[^>]*>.*?</[^>]+>|<[^>]+${directive.full}[^>]*/?>`,
                    'gs'
                );
                return template.replace(elementPattern, '');
            }
            // Remove the directive attribute
            return template.replace(directive.full, '');
        });

        // :for directive - List rendering
        this.register('for', (template, directive, values) => {
            const [itemName, , listExpr] = directive.expression.split(' ');
            const list = this._evaluateExpression(listExpr, values);
            
            if (!Array.isArray(list)) {
                console.warn(':for directive requires an array');
                return template.replace(directive.full, '');
            }

            // Find the element with :for
            const elementMatch = template.match(
                new RegExp(`<([^>\\s]+)[^>]*${directive.full}[^>]*>.*?</\\1>`, 's')
            );
            
            if (!elementMatch) return template;

            const elementTemplate = elementMatch[0].replace(directive.full, '');
            const repeated = list.map((item, index) => {
                return elementTemplate
                    .replace(new RegExp(`\\$\\{${itemName}\\}`, 'g'), item)
                    .replace(/\$\{index\}/g, index);
            }).join('');

            return template.replace(elementMatch[0], repeated);
        });

        // :ref directive - Element reference
        this.register('ref', (template, directive, values) => {
            const refName = directive.expression;
            // Add data-ref attribute for easy querying
            return template.replace(
                directive.full, 
                `data-ref="${refName}"`
            );
        });

        // :show directive - Visibility control
        this.register('show', (template, directive, values) => {
            const shouldShow = this._evaluateExpression(directive.expression, values);
            if (!shouldShow) {
                // Add display:none style
                if (template.includes('style="')) {
                    return template.replace(
                        directive.full,
                        '').replace(
                        'style="',
                        'style="display: none; '
                    );
                } else {
                    return template.replace(
                        directive.full,
                        'style="display: none;"'
                    );
                }
            }
            return template.replace(directive.full, '');
        });

        // :class directive - Dynamic classes
        this.register('class', (template, directive, values) => {
            const classValue = this._evaluateExpression(directive.expression, values);
            let classes = '';

            if (typeof classValue === 'string') {
                classes = classValue;
            } else if (typeof classValue === 'object') {
                classes = Object.entries(classValue)
                    .filter(([, value]) => value)
                    .map(([key]) => key)
                    .join(' ');
            }

            if (template.includes('class="')) {
                return template.replace(directive.full, '').replace(
                    /class="([^"]*)"/,
                    (match, existing) => `class="${existing} ${classes}"`
                );
            } else {
                return template.replace(directive.full, `class="${classes}"`);
            }
        });

        // :prefetch directive - Prefetch resources
        this.register('prefetch', (template, directive, values) => {
            const url = this._evaluateExpression(directive.expression, values);
            
            // Add prefetch link to head if not exists
            if (url && typeof document !== 'undefined') {
                const existingPrefetch = document.querySelector(`link[rel="prefetch"][href="${url}"]`);
                if (!existingPrefetch) {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = url;
                    document.head.appendChild(link);
                }
            }
            
            // Remove directive from template
            return template.replace(directive.full, '');
        });

        // :aria-* directives - Dynamic ARIA attributes
        this.register('aria', (template, directive, values) => {
            // Extract aria attribute name from directive
            const ariaMatch = directive.full.match(/:aria-([a-z]+)="([^"]+)"/);
            if (!ariaMatch) return template;
            
            const [, ariaAttr, expression] = ariaMatch;
            const value = this._evaluateExpression(expression, values);
            
            // Replace directive with actual aria attribute
            return template.replace(
                directive.full,
                `aria-${ariaAttr}="${value}"`
            );
        });

        // :style directive - Dynamic styles
        this.register('style', (template, directive, values) => {
            const styleValue = this._evaluateExpression(directive.expression, values);
            let styles = '';

            if (typeof styleValue === 'string') {
                styles = styleValue;
            } else if (typeof styleValue === 'object') {
                styles = Object.entries(styleValue)
                    .map(([key, value]) => `${this._kebabCase(key)}: ${value}`)
                    .join('; ');
            }

            if (template.includes('style="')) {
                return template.replace(directive.full, '').replace(
                    /style="([^"]*)"/,
                    (match, existing) => `style="${existing}; ${styles}"`
                );
            } else {
                return template.replace(directive.full, `style="${styles}"`);
            }
        });
    }

    /**
     * Evaluate expression with values context
     */
    _evaluateExpression(expr, values) {
        // Simple expression evaluation
        // In production, use a proper expression parser
        try {
            if (expr.startsWith('$')) {
                const index = parseInt(expr.slice(1));
                return values[index];
            }
            // Direct value reference
            const index = parseInt(expr);
            if (!isNaN(index)) {
                return values[index];
            }
            return expr;
        } catch (error) {
            console.error('Expression evaluation error:', error);
            return null;
        }
    }

    /**
     * Convert camelCase to kebab-case
     */
    _kebabCase(str) {
        return str.replace(/([A-Z])/g, '-$1').toLowerCase();
    }

    /**
     * Get all registered directives
     */
    getAll() {
        return Array.from(directiveHandlers.keys());
    }

    /**
     * Check if directive exists
     */
    has(name) {
        return directiveHandlers.has(name);
    }
}

// Export singleton instance
export const directiveManager = new DirectiveManager();