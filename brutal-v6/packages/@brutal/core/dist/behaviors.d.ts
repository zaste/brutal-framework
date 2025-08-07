import { StateOptions, EventMap, Lifecycle } from './types';
export declare function withState<T>(options: StateOptions<T> | T): (element: HTMLElement & {
    state?: T;
    update?: () => void;
}) => HTMLElement & {
    state?: T;
    update?: () => void;
};
export declare function withEvents(events?: EventMap): (element: HTMLElement & {
    on?: Function;
    off?: Function;
}) => HTMLElement & {
    on?: Function;
    off?: Function;
};
export declare function withLifecycle(lifecycle: Lifecycle): (element: HTMLElement & {
    mount?: Function;
    unmount?: Function;
}) => HTMLElement & {
    mount?: Function;
    unmount?: Function;
};
export declare function withProps<T extends Record<string, any>>(props: T): (element: HTMLElement & {
    props?: T;
}) => HTMLElement & {
    props?: T;
};
//# sourceMappingURL=behaviors.d.ts.map