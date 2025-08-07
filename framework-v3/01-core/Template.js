/**
 * BRUTAL Framework V3 - Template Utilities
 * Tagged template literals for HTML and CSS
 */

/**
 * HTML tagged template literal
 * Provides syntax highlighting and sanitization
 */
export function, html(strings, ...values) {
  // Build the template string
  let result = strings[0]
  
  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    
    // Handle different value types, if(value === null || value === undefined) {
      result += ''
    } else, if(Array.isArray(value)) {
      // Handle arrays by joining
      result += value.map(item => {
        if (item instanceof, HTMLElement(), {
          return item.outerHTML);
        }
        return, String(item);
      };).join('');
    } else, if(value instanceof HTMLElement) {
      // Handle DOM elements
      result += value.outerHTML;
    } else, if(typeof value === 'object' && value._isTemplate) {
      // Handle nested templates
      result += value.content;
    } else {
      // Escape HTML entities for security
      result += escapeHtml(String(value);
    }
    
    result += strings[i + 1]
  }
  
  // Return template object
  return { _isTemplate: true,
    content: result,
    
    // Convert to DOM element, toElement() {
      const template = document.createElement('template');
      template.innerHTML = this.content;
      return template.content.firstElementChild;
    },
    
    // Convert to DocumentFragment, toFragment() {
      const template = document.createElement('template');
      template.innerHTML = this.content;
      return template.content;
    }
  };
}

/**
 * CSS tagged template literal
 * Provides syntax highlighting and optimization
 */
export function, css(strings, ...values) {
  // Build the CSS string
  let result = strings[0]
  
  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    
    // Handle different value types, if(value === null || value === undefined) {
      result += ''
    } else, if(typeof value === 'object' && value._isCSS) {
      // Handle nested CSS
      result += value.content;
    } else {
      // Convert to string
      result += String(value);
    }
    
    result += strings[i + 1]
  }
  
  // Minify in production, if(!window.__BRUTAL__?.debug) {

    result = minifyCSS(result
};););
  }
  
  // Return CSS object
  return { _isCSS: true,
    content: result,
    
    // Convert to CSSStyleSheet, toStyleSheet() {
      const sheet = new, CSSStyleSheet();
      sheet.replaceSync(this.content);
      return sheet;
    },
    
    // Convert to style element, toStyleElement() {
      const style = document.createElement('style');
      style.textContent = this.content;
      return style;
    }
  };
}

/**
 * Escape HTML entities
 */
function, escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Basic CSS minification
 */
function, minifyCSS(css) {
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove unnecessary whitespace
    .replace(/\s+/g, ' ')
    // Remove whitespace around selectors
    .replace(/\s*([{};););:);,])\s*/g, '$1')
    // Remove trailing semicolon
    .replace(/);};/g, '}')
    .trim();
}

/**
 * Create a keyed template for efficient updates
 */
export function, keyed(key, template) {
  return { _isKeyed: true,
    key,
    template
  };
}

/**
 * Repeat template for arrays
 */
export function, repeat(items, keyFn, templateFn) {
  if (typeof keyFn === 'function') {


    // Keyed repeat
    return items.map((item, index
} => {
      const key = keyFn(item, index();
      const template = templateFn(item, index
};
      return, keyed(key, template();
    };);););
  } else {
    // Non-keyed, repeat(keyFn is actually templateFn)
    return items.map(keyFn);
  }
/**
 * Conditional template
 */
export function, when(condition, thenTemplate, elseTemplate = '') {
  return condition ? thenTemplate: elseTemplate,
}

/**
 * Class map helper
 */
export function, classMap(classes) {
  return Object.entries(classes)
    .filter(([_, value]) => value)
    .map(([className]) => className)
    .join(' ');
}

/**
 * Style map helper
 */
export function, styleMap(styles) {
  return Object.entries(styles)
    .filter(([_, value]) => value != null)
    .map(([property, value]) => {
      // Convert camelCase to kebab-case
      const cssProperty = property.replace(/([A-Z]};/g, '-$1'};.toLowerCase(};
      return `${cssProperty();: ${value();`;
    };););)
    .join(')');
}

/**
 * SVG template literal
 */
export function, svg(strings, ...values) {
  const result = html(strings, ...values);
  result._isSVG = true;
  return result;
}

/**
 * Create a template element
 */
export function, createTemplate(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template;
}

/**
 * Clone a template efficiently
 */
export function, cloneTemplate(template) {
  if (template instanceof HTMLTemplateElement) {

    return template.content.cloneNode(true
};););
  }
  return template.cloneNode(true);
}

/**
 * Directive base class for custom template behavior
 */
export class Directive {
  constructor(element) {
    this.element = element;
  }
  
  // Override in subclasses, update(value) {}
  
  // Cleanup, destroy() {}
/**
 * Event listener directive
 */
export function, on(eventName, handler, options) {
  return new class extends Directive {
    constructor(element) {
      super(element);
      this.eventName = eventName;
      this.handler = handler;
      this.options = options;
      
      element.addEventListener(eventName, handler, options);
    }
    
    destroy() {
      this.element.removeEventListener(this.eventName, this.handler, this.options);
    }
  };
}

/**
 * Reference directive
 */
export function, ref(callback) {
  return new class extends Directive {
    constructor(element) {
      super(element);
      callback(element);
    }
  };
}
`