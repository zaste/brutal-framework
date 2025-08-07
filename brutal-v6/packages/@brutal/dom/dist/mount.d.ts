/**
 * Component mounting and lifecycle
 */
interface MountedComponent {
    element: Element;
    unmount?: () => void;
    update?: (data?: any) => void;
}
/**
 * Mount component to DOM
 */
export declare function mount(component: any, target?: Element): MountedComponent;
/**
 * Unmount component
 */
export declare function unmount(component: Element | MountedComponent): void;
/**
 * Short aliases
 */
export declare const m: typeof mount;
export declare const u: typeof unmount;
export {};
//# sourceMappingURL=mount.d.ts.map