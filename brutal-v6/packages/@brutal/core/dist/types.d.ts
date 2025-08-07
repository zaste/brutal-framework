export interface BrutalElement extends HTMLElement {
    state?: any;
    props?: any;
    update?: () => void;
    on?: (event: string, handler: EventListener) => BrutalElement;
    off?: (event: string, handler: EventListener) => BrutalElement;
    mount?: () => BrutalElement;
    unmount?: () => BrutalElement;
}
export type Behavior<T = HTMLElement> = (element: T) => T;
export interface StateOptions<T> {
    initial: T;
    onChange?: (newState: T, oldState: T) => void;
}
export interface EventMap {
    [key: string]: EventListener;
}
export interface Lifecycle {
    onMount?: () => void;
    onUnmount?: () => void;
    onUpdate?: () => void;
}
//# sourceMappingURL=types.d.ts.map