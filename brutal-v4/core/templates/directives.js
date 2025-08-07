/**
 * BRUTAL V4 - Template Directives Module
 * Processing for template directives (@event, :prop, ?conditional, *repeat)
 */

/**
 * Advanced template function with directive support
 */
export async function template(strings, ...values) {
    // Import html from the html module to avoid circular dependency
    const { html } = await import('./html.js');
    const tmpl = html(strings, ...values);
    
    // Process directives
    processDirectives(tmpl);
    
    return tmpl;
}

/**
 * Process template directives
 */
export function processDirectives(template) {
    const content = template.content;
    
    // Process @event directives
    processEventDirectives(content);
    
    // Process :prop directives
    processPropDirectives(content);
    
    // Process ?conditional directives
    processConditionalDirectives(content);
    
    // Process *repeat directives
    processRepeatDirectives(content);
}

/**
 * Process event directives (@click, @input, etc.)
 */
export function processEventDirectives(content) {
    const walker = document.createTreeWalker(
        content,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
    );
    
    const elements = [];
    let node;
    
    while (node = walker.nextNode()) {
        elements.push(node);
    }
    
    for (const element of elements) {
        for (const attr of Array.from(element.attributes)) {
            if (attr.name.startsWith('@')) {
                const eventName = attr.name.slice(1);
                const handlerName = attr.value;
                
                // Mark for event binding
                element.setAttribute('data-brutal-event', eventName);
                element.setAttribute('data-brutal-handler', handlerName);
                element.removeAttribute(attr.name);
            }
        }
    }
}

/**
 * Process property directives (:value, :disabled, etc.)
 */
export function processPropDirectives(content) {
    const walker = document.createTreeWalker(
        content,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
    );
    
    const elements = [];
    let node;
    
    while (node = walker.nextNode()) {
        elements.push(node);
    }
    
    for (const element of elements) {
        for (const attr of Array.from(element.attributes)) {
            if (attr.name.startsWith(':')) {
                const propName = attr.name.slice(1);
                const propValue = attr.value;
                
                // Mark for property binding
                element.setAttribute('data-brutal-prop', propName);
                element.setAttribute('data-brutal-prop-value', propValue);
                element.removeAttribute(attr.name);
            }
        }
    }
}

/**
 * Process conditional directives (?show, ?hidden, etc.)
 */
export function processConditionalDirectives(content) {
    const walker = document.createTreeWalker(
        content,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
    );
    
    const elements = [];
    let node;
    
    while (node = walker.nextNode()) {
        elements.push(node);
    }
    
    for (const element of elements) {
        for (const attr of Array.from(element.attributes)) {
            if (attr.name.startsWith('?')) {
                const conditionType = attr.name.slice(1);
                const conditionValue = attr.value;
                
                // Mark for conditional rendering
                element.setAttribute('data-brutal-condition', conditionType);
                element.setAttribute('data-brutal-condition-value', conditionValue);
                element.removeAttribute(attr.name);
            }
        }
    }
}

/**
 * Process repeat directives (*for, *each, etc.)
 */
export function processRepeatDirectives(content) {
    const walker = document.createTreeWalker(
        content,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
    );
    
    const elements = [];
    let node;
    
    while (node = walker.nextNode()) {
        elements.push(node);
    }
    
    for (const element of elements) {
        for (const attr of Array.from(element.attributes)) {
            if (attr.name.startsWith('*')) {
                const repeatType = attr.name.slice(1);
                const repeatValue = attr.value;
                
                // Mark for repeat rendering
                element.setAttribute('data-brutal-repeat', repeatType);
                element.setAttribute('data-brutal-repeat-value', repeatValue);
                element.removeAttribute(attr.name);
            }
        }
    }
}