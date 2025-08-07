/**
 * Integrate stores with components
 */
/**
 * Connects a store to a component
 * Auto-subscribes and provides store data
 */
export function withStore(store) {
    return (element) => {
        // Auto-subscribe to updates
        const unsubscribe = store.subscribe(() => {
            element.update?.();
        });
        // Expose store
        Object.defineProperty(element, 'store', {
            get: () => store,
            configurable: true
        });
        // Store unsubscribe for manual cleanup if needed
        element._unsubscribe = unsubscribe;
        return element;
    };
}
