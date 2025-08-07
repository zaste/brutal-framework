/**
 * Minimal query utilities
 */
export function query(selector, root) {
    return (root || document).querySelector(selector);
}
export function queryAll(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
}
