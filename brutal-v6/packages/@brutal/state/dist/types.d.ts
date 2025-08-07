/**
 * State types
 */
export type Action<T = any> = (state: T, ...args: any[]) => Partial<T>;
export type StoreConfig = {
    [key: string]: any | Action;
};
export type Subscriber<T = any> = (state: T) => void;
export interface Store<T = any> {
    subscribe(fn: Subscriber<T>): () => void;
    [key: string]: any;
}
//# sourceMappingURL=types.d.ts.map