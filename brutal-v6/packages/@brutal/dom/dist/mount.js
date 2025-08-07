/**
 * Component mounting and lifecycle
 */
import { render } from './render';
// Track mounted components
const mounted = new WeakMap();
/**
 * Mount component to DOM
 */
export function mount(component, target = document.body) {
    let element;
    let state;
    // Handle different component types
    if (typeof component === 'function') {
        // Function component
        const result = component();
        if (result && result.view) {
            // Component with view method
            element = render(result.view(), { target });
            state = {
                element,
                update: (data) => {
                    if (result.update)
                        result.update(data);
                    render(result.view(), { target: element });
                },
                unmount: result.unmount
            };
        }
        else if (result && result.strings) {
            // Direct template
            element = render(result, { target });
            state = { element };
        }
        else {
            throw new Error('Invalid component');
        }
    }
    else if (component && component.view) {
        // Object component
        element = render(component.view(), { target });
        state = {
            element,
            update: component.update,
            unmount: component.unmount
        };
    }
    else {
        throw new Error('Invalid component');
    }
    mounted.set(element, state);
    return state;
}
/**
 * Unmount component
 */
export function unmount(component) {
    const element = 'element' in component ? component.element : component;
    const state = mounted.get(element);
    if (state) {
        if (state.unmount)
            state.unmount();
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
        mounted.delete(element);
    }
}
/**
 * Short aliases
 */
export const m = mount;
export const u = unmount;
