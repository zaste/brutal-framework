/**
 * Template utilities
 * Tagged template literals for HTML and CSS
 */

// HTML template tag
export function html(strings, ...values) {
  return strings.reduce((result, string, i) => {
    const value = values[i] || '';
    return result + string + value;
  }, '');
}

// CSS template tag
export function css(strings, ...values) {
  return strings.reduce((result, string, i) => {
    const value = values[i] || '';
    return result + string + value;
  }, '');
}

// Template caching
const templateCache = new Map();

export function cacheTemplate(key, template) {
  templateCache.set(key, template);
}

export function getCachedTemplate(key) {
  return templateCache.get(key);
}

// Sanitize HTML
export function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Create element from HTML
export function createElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

// Batch DOM updates
export function batch(updates) {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}