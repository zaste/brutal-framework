const stateMap = new WeakMap();
const listenersMap = new WeakMap();
const observerMap = new WeakMap();
export function withState(options) {
    return (element) => {
        const opts = options.initial !== undefined
            ? options
            : { initial: options };
        const state = new Proxy(opts.initial, {
            set(target, key, value) {
                const old = { ...target };
                target[key] = value;
                opts.onChange?.(target, old);
                element.update?.();
                return true;
            }
        });
        stateMap.set(element, state);
        element.state = state;
        return element;
    };
}
export function withEvents(events) {
    return (element) => {
        const elementListeners = new Map();
        listenersMap.set(element, elementListeners);
        element.on = (event, handler) => {
            if (!elementListeners.has(event)) {
                elementListeners.set(event, new Set());
                element.addEventListener(event, (e) => {
                    elementListeners.get(event)?.forEach(h => h(e));
                });
            }
            elementListeners.get(event)?.add(handler);
            return element;
        };
        element.off = (event, handler) => {
            elementListeners.get(event)?.delete(handler);
            return element;
        };
        if (events) {
            Object.entries(events).forEach(([event, handler]) => {
                element.on(event, handler);
            });
        }
        return element;
    };
}
export function withLifecycle(lifecycle) {
    return (element) => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node === element)
                        lifecycle.onMount?.();
                });
                mutation.removedNodes.forEach((node) => {
                    if (node === element) {
                        lifecycle.onUnmount?.();
                        observer.disconnect();
                    }
                });
            });
        });
        const startObserving = () => {
            const target = element.parentNode || document.body;
            observer.observe(target, { childList: true, subtree: true });
        };
        element.mount = () => {
            startObserving();
            lifecycle.onMount?.();
            return element;
        };
        element.unmount = () => {
            lifecycle.onUnmount?.();
            observer.disconnect();
            observerMap.delete(element);
            return element;
        };
        observerMap.set(element, observer);
        if (element.parentNode) {
            startObserving();
        }
        return element;
    };
}
export function withProps(props) {
    return (element) => {
        element.props = new Proxy(props, {
            set(target, key, value) {
                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                    element.setAttribute(String(key), String(value));
                }
                target[key] = value;
                return true;
            }
        });
        Object.entries(props).forEach(([key, value]) => {
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                element.setAttribute(key, String(value));
            }
        });
        return element;
    };
}
//# sourceMappingURL=behaviors.js.map