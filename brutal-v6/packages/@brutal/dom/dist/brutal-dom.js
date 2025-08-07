/**
 * Minimal template system
 */
const cache = new WeakMap();
function html(strings, ...values) {
    return { strings, values, _c: cache.get(strings) || cache.set(strings, 1) };
}

/**
 * Minimal render - just enough to work
 */
const rendered = new WeakMap();
function render(template, target = document.body) {
    // Build HTML
    let html = '';
    const { strings, values } = template;
    for (let i = 0; i < strings.length; i++) {
        html += strings[i];
        if (i < values.length) {
            const val = values[i];
            // Event handler
            if (strings[i].endsWith('on') && strings[i + 1]?.startsWith('=')) {
                html += `brutal-e${i}`;
            }
            // Array of templates
            else if (Array.isArray(val)) {
                html += val.map(v => v && v.strings ? render(v, document.createElement('div')).innerHTML : v).join('');
            }
            // Nested template
            else if (val && val.strings) {
                html += render(val, document.createElement('div')).innerHTML;
            }
            // Value
            else {
                html += val ?? '';
            }
        }
    }
    // Create element
    const temp = document.createElement('div');
    temp.innerHTML = html;
    // Attach events
    temp.querySelectorAll('[*|brutal-e]').forEach((el) => {
        const attrs = Array.from(el.attributes);
        attrs.forEach(attr => {
            const match = attr.name.match(/on(\w+)brutal-e(\d+)/);
            if (match) {
                const [, event, index] = match;
                el.removeAttribute(attr.name);
                el.addEventListener(event, values[+index]);
            }
        });
    });
    // Apply to target
    const content = temp.firstElementChild || temp;
    if (target.parentNode) {
        target.parentNode.replaceChild(content, target);
    }
    else {
        target.innerHTML = '';
        target.appendChild(content);
    }
    return content;
}

/**
 * Minimal query utilities
 */
function query(selector, root) {
    return (root || document).querySelector(selector);
}
function queryAll(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
}

export{html,render,query,queryAll};