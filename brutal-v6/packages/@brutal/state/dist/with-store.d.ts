/**
 * Integrate stores with components
 */
import { Store } from './types';
/**
 * Connects a store to a component
 * Auto-subscribes and provides store data
 */
export declare function withStore<T>(store: Store<T>): (element: HTMLElement & {
    update?: () => void;
    store?: T;
}) => HTMLElement & {
    update?: () => void;
    store?: T;
};
//# sourceMappingURL=with-store.d.ts.map