/**
 * Efficient DOM patching
 * Minimal diffing for updates
 */
/**
 * Apply patches to DOM
 */
export function patch(patches) {
    patches.forEach(p => {
        switch (p.type) {
            case 'text':
                if (p.target.nodeType === Node.TEXT_NODE) {
                    p.target.textContent = String(p.value);
                }
                break;
            case 'attr':
                if (p.target instanceof Element && p.name) {
                    if (p.value == null) {
                        p.target.removeAttribute(p.name);
                    }
                    else {
                        p.target.setAttribute(p.name, String(p.value));
                    }
                }
                break;
            case 'add':
                if (p.value instanceof Node && p.target instanceof Element) {
                    p.target.appendChild(p.value);
                }
                break;
            case 'remove':
                if (p.target.parentNode) {
                    p.target.parentNode.removeChild(p.target);
                }
                break;
            case 'replace':
                if (p.value instanceof Node && p.target.parentNode) {
                    p.target.parentNode.replaceChild(p.value, p.target);
                }
                break;
        }
    });
}
/**
 * Short alias
 */
export const p = patch;
