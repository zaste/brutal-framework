/**
 * AI Component Generator - Natural language to BRUTAL components
 * Uses pattern matching and templates for instant generation
 */

export class ComponentGenerator {
    constructor() {
        this.templates = this.initTemplates();
        this.patterns = this.initPatterns();
        this.components = [
            'button', 'input', 'card', 'select', 'table', 'list',
            'alert', 'toast', 'modal', 'tabs', 'menu', 'sidebar'
        ];
    }

    initTemplates() {
        return {
            button: {
                base: `<brutal-button variant="{variant}" {attributes}>{content}</brutal-button>`,
                variants: ['primary', 'secondary', 'danger', 'success', 'ghost'],
                attributes: ['disabled', 'loading', 'full-width', 'icon']
            },
            input: {
                base: `<brutal-input type="{type}" placeholder="{placeholder}" {attributes}></brutal-input>`,
                types: ['text', 'email', 'password', 'number', 'tel', 'url'],
                attributes: ['required', 'disabled', 'readonly', 'autofocus']
            },
            card: {
                base: `<brutal-card {attributes}>
                    {header}
                    {content}
                    {footer}
                </brutal-card>`,
                attributes: ['elevated', 'interactive', 'compact']
            },
            modal: {
                base: `<brutal-modal title="{title}" {attributes}>
                    {content}
                </brutal-modal>`,
                attributes: ['open', 'closable', 'backdrop']
            },
            table: {
                base: `<brutal-table columns='{columns}' data='{data}' {attributes}></brutal-table>`,
                attributes: ['sortable', 'filterable', 'paginated', 'virtual-scroll']
            }
        };
    }

    initPatterns() {
        return {
            // Component type patterns
            button: /\b(button|btn|click|submit|action)\b/i,
            input: /\b(input|field|text|type|enter|form)\b/i,
            card: /\b(card|box|container|panel|section)\b/i,
            modal: /\b(modal|dialog|popup|overlay)\b/i,
            table: /\b(table|grid|data|rows|columns)\b/i,
            list: /\b(list|items|collection|array)\b/i,
            
            // Variant patterns
            primary: /\b(primary|main|important|blue)\b/i,
            danger: /\b(danger|delete|remove|red|error)\b/i,
            success: /\b(success|save|green|confirm)\b/i,
            
            // Attribute patterns
            disabled: /\b(disabled|inactive|cant|cannot)\b/i,
            loading: /\b(loading|spinner|wait|processing)\b/i,
            required: /\b(required|must|need|mandatory)\b/i,
            
            // Size patterns
            small: /\b(small|tiny|sm|compact)\b/i,
            large: /\b(large|big|lg|huge)\b/i,
            
            // Color patterns
            colors: {
                blue: /\b(blue|primary|info)\b/i,
                red: /\b(red|danger|error)\b/i,
                green: /\b(green|success|ok)\b/i,
                yellow: /\b(yellow|warning|caution)\b/i,
                purple: /\b(purple|violet)\b/i,
                gray: /\b(gray|grey|neutral)\b/i
            }
        };
    }

    generate(prompt) {
        const normalized = prompt.toLowerCase();
        
        // Detect component type
        const componentType = this.detectComponentType(normalized);
        if (!componentType) {
            return {
                success: false,
                error: 'Could not determine component type',
                suggestion: `Try: "Create a ${this.components.join('/')}"`
            };
        }
        
        // Extract properties
        const props = this.extractProps(normalized, componentType);
        
        // Generate component
        const component = this.buildComponent(componentType, props);
        
        return {
            success: true,
            component,
            type: componentType,
            props,
            preview: this.generatePreview(component)
        };
    }

    detectComponentType(text) {
        for (const [type, pattern] of Object.entries(this.patterns)) {
            if (pattern instanceof RegExp && pattern.test(text)) {
                if (this.templates[type]) {
                    return type;
                }
            }
        }
        
        // Direct mention
        for (const type of this.components) {
            if (text.includes(type)) {
                return type;
            }
        }
        
        return null;
    }

    extractProps(text, componentType) {
        const props = {
            attributes: [],
            content: '',
            style: {}
        };
        
        // Extract variant
        if (this.templates[componentType].variants) {
            for (const variant of this.templates[componentType].variants) {
                if (this.patterns[variant] && this.patterns[variant].test(text)) {
                    props.variant = variant;
                    break;
                }
            }
            props.variant = props.variant || 'primary';
        }
        
        // Extract content
        const contentMatch = text.match(/["']([^"']+)["']/) || 
                           text.match(/\bsays?\s+(\w+(?:\s+\w+)*)/i) ||
                           text.match(/\btext\s+(\w+(?:\s+\w+)*)/i);
        if (contentMatch) {
            props.content = contentMatch[1];
        }
        
        // Extract attributes
        if (this.patterns.disabled.test(text)) props.attributes.push('disabled');
        if (this.patterns.loading.test(text)) props.attributes.push('loading');
        if (this.patterns.required.test(text)) props.attributes.push('required');
        
        // Extract size
        if (this.patterns.small.test(text)) props.size = 'small';
        if (this.patterns.large.test(text)) props.size = 'large';
        
        // Extract colors
        for (const [color, pattern] of Object.entries(this.patterns.colors)) {
            if (pattern.test(text)) {
                props.color = color;
                break;
            }
        }
        
        // Component-specific extraction
        this.extractComponentSpecific(text, componentType, props);
        
        return props;
    }

    extractComponentSpecific(text, componentType, props) {
        switch (componentType) {
            case 'input':
                // Extract type
                const typeMatch = text.match(/\b(email|password|number|tel|url)\b/i);
                props.type = typeMatch ? typeMatch[1].toLowerCase() : 'text';
                
                // Extract placeholder
                const placeholderMatch = text.match(/placeholder\s+["']([^"']+)["']/i) ||
                                       text.match(/\bfor\s+(\w+(?:\s+\w+)*)/i);
                props.placeholder = placeholderMatch ? placeholderMatch[1] : 'Enter value...';
                break;
                
            case 'modal':
                // Extract title
                const titleMatch = text.match(/title\s+["']([^"']+)["']/i) ||
                                 text.match(/\bcalled\s+(\w+(?:\s+\w+)*)/i);
                props.title = titleMatch ? titleMatch[1] : 'Modal Title';
                break;
                
            case 'table':
                // Extract column info
                const columnMatch = text.match(/columns?\s+(.+?)(?:\s+and\s+|$)/i);
                if (columnMatch) {
                    const columnNames = columnMatch[1].split(/,\s*|\s+and\s+/);
                    props.columns = columnNames.map(name => ({
                        key: name.toLowerCase().replace(/\s+/g, '_'),
                        label: name.trim()
                    }));
                }
                break;
        }
    }

    buildComponent(type, props) {
        let template = this.templates[type].base;
        
        // Replace placeholders
        template = template.replace('{variant}', props.variant || '');
        template = template.replace('{content}', props.content || '');
        template = template.replace('{placeholder}', props.placeholder || '');
        template = template.replace('{type}', props.type || 'text');
        template = template.replace('{title}', props.title || '');
        
        // Add attributes
        const attributes = [];
        if (props.size) attributes.push(`size="${props.size}"`);
        if (props.color) attributes.push(`color="${props.color}"`);
        attributes.push(...props.attributes);
        
        template = template.replace('{attributes}', attributes.join(' '));
        
        // Handle complex replacements
        if (type === 'table' && props.columns) {
            template = template.replace('{columns}', JSON.stringify(props.columns));
            template = template.replace('{data}', '[]');
        }
        
        if (type === 'card') {
            template = template.replace('{header}', props.title ? `<h3>${props.title}</h3>` : '');
            template = template.replace('{footer}', '');
        }
        
        // Clean up empty placeholders
        template = template.replace(/\{[^}]+\}/g, '');
        
        return template.trim();
    }

    generatePreview(component) {
        return `
<div style="padding: 2rem; background: #1a1a1a; border-radius: 0.5rem;">
    ${component}
</div>
        `.trim();
    }

    // Generate multiple variations
    generateVariations(prompt) {
        const base = this.generate(prompt);
        if (!base.success) return [base];
        
        const variations = [base];
        const type = base.type;
        
        // Generate variant variations
        if (this.templates[type].variants) {
            for (const variant of this.templates[type].variants) {
                if (variant !== base.props.variant) {
                    const varProps = { ...base.props, variant };
                    variations.push({
                        ...base,
                        props: varProps,
                        component: this.buildComponent(type, varProps),
                        preview: this.generatePreview(this.buildComponent(type, varProps))
                    });
                }
            }
        }
        
        return variations.slice(0, 3); // Return top 3 variations
    }

    // Smart suggestions based on context
    getSuggestions(currentCode) {
        const suggestions = [];
        
        // Analyze current code
        const components = currentCode.match(/<brutal-\w+/g) || [];
        const lastComponent = components[components.length - 1];
        
        if (!lastComponent) {
            // First component suggestions
            suggestions.push(
                "Create a primary button that says 'Get Started'",
                "Make a card with a title and content",
                "Create an email input field"
            );
        } else if (lastComponent.includes('button')) {
            // After button suggestions
            suggestions.push(
                "Add a loading spinner button",
                "Create a form with inputs",
                "Make a modal dialog"
            );
        } else if (lastComponent.includes('input')) {
            // After input suggestions
            suggestions.push(
                "Add a submit button",
                "Create a select dropdown",
                "Add form validation"
            );
        }
        
        return suggestions;
    }
}

// Export singleton
export const componentGenerator = new ComponentGenerator();