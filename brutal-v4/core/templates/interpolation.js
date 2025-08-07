/**
 * BRUTAL V4 - Template Interpolation Module
 * Value processing and interpolation for templates
 */

/**
 * Create placeholder for value interpolation
 * Enhanced with type detection for optimization
 */
export function createPlaceholder(index, value) {
    const marker = `__BRUTAL_PLACEHOLDER_${index}__`;
    
    // Determine value type for optimized handling
    let type = 'text';
    let isAttribute = false;
    
    if (value && typeof value === 'object') {
        if (value instanceof HTMLElement || value instanceof DocumentFragment) {
            type = 'element';
        } else if (value.nodeType) {
            type = 'node';
        } else if (typeof value.then === 'function') {
            type = 'promise';
        } else if (Array.isArray(value)) {
            type = 'array';
        }
    } else if (typeof value === 'function') {
        type = 'function';
    } else if (typeof value === 'boolean') {
        type = 'boolean';
    }
    
    return {
        index,
        marker,
        type,
        isAttribute,
        value
    };
}

/**
 * Interpolate template with actual values
 * Enhanced with type-aware processing and component integration
 */
export function interpolateTemplate(template, values, placeholders = []) {
    if (values.length === 0) {
        return template;
    }
    
    // Use optimized approach if we have placeholder metadata
    if (placeholders.length > 0) {
        return interpolateWithMetadata(template, values, placeholders);
    }
    
    // Fallback to simple string replacement
    let htmlString = template.innerHTML;
    
    // Replace placeholders with actual values
    for (let i = 0; i < values.length; i++) {
        const placeholder = createPlaceholder(i, values[i]);
        const value = processValue(values[i], placeholder.type);
        
        htmlString = htmlString.replaceAll(placeholder.marker, value);
    }
    
    // Update template content
    template.innerHTML = htmlString;
    
    return template;
}

/**
 * Optimized interpolation using placeholder metadata
 */
function interpolateWithMetadata(template, values, placeholders) {
    let htmlString = template.innerHTML;
    
    // Process each placeholder with type-aware handling
    placeholders.forEach(placeholder => {
        const value = values[placeholder.index];
        const processedValue = processValue(value, placeholder.type);
        
        htmlString = htmlString.replaceAll(placeholder.marker, processedValue);
    });
    
    template.innerHTML = htmlString;
    return template;
}

/**
 * Process value for HTML interpolation
 * Enhanced with type-aware processing
 */
export function processValue(value, type = 'text') {
    if (value === null || value === undefined) {
        return '';
    }
    
    // Type-specific processing for optimization
    switch (type) {
        case 'element':
            if (value instanceof HTMLElement) {
                return value.outerHTML;
            }
            if (value instanceof DocumentFragment) {
                const div = document.createElement('div');
                div.appendChild(value.cloneNode(true));
                return div.innerHTML;
            }
            break;
            
        case 'node':
            if (value.nodeType) {
                return value.outerHTML || value.textContent || '';
            }
            break;
            
        case 'boolean':
            return value ? 'true' : 'false';
            
        case 'function':
            try {
                const result = value();
                return processValue(result, typeof result === 'object' ? 'element' : 'text');
            } catch (error) {
                console.warn('[Template] Function execution failed:', error);
                return '';
            }
            
        case 'array':
            if (Array.isArray(value)) {
                return value.map(item => processValue(item)).join('');
            }
            break;
            
        case 'promise':
            // Handle promises by returning placeholder and resolving async
            if (typeof value.then === 'function') {
                const placeholderElement = `<span data-async-content="true">Loading...</span>`;
                value.then(result => {
                    // Find and replace placeholder with actual content
                    // This would need component integration for proper async handling
                }).catch(error => {
                    console.warn('[Template] Promise rejected:', error);
                });
                return placeholderElement;
            }
            break;
    }
    
    // Check for raw values
    if (value && value.__brutal_raw) {
        return value.value;
    }
    
    // Fallback to standard processing
    if (typeof value === 'string') {
        return escapeHTML(value);
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    
    if (typeof value === 'function') {
        return processValue(value());
    }
    
    if (Array.isArray(value)) {
        return value.map(item => processValue(item)).join('');
    }
    
    if (value instanceof HTMLElement) {
        return value.outerHTML;
    }
    
    if (value && typeof value === 'object' && value.toString) {
        return escapeHTML(value.toString());
    }
    
    return escapeHTML(String(value));
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}