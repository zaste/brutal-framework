/**
 * Minimal template system
 */
const cache = new WeakMap();
export function html(strings, ...values) {
    return { strings, values, _c: cache.get(strings) || cache.set(strings, 1) };
}
