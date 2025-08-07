/**
 * EXTENSION SYSTEM
 * Dynamic extension loading and management for Native Web Components Framework
 *
 * Provides secure, sandboxed environment for third-party extensions with
 * full lifecycle management and performance monitoring.
 */
export interface ExtensionManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    main: string;
    dependencies?: Record<string, string>;
    permissions?: ExtensionPermission[];
    api?: string;
    sandboxed?: boolean;
    trusted?: boolean;
}
export interface ExtensionPermission {
    type: 'dom' | 'network' | 'storage' | 'events' | 'components' | 'performance';
    scope: string;
    level: 'read' | 'write' | 'full';
}
export interface ExtensionContext {
    id: string;
    manifest: ExtensionManifest;
    sandbox: ExtensionSandbox;
    permissions: ExtensionPermission[];
    state: 'loading' | 'active' | 'inactive' | 'error';
    exports: any;
    dependencies: Map<string, Extension>;
}
export interface Extension {
    manifest: ExtensionManifest;
    context: ExtensionContext;
    instance: any;
    activate(): Promise<void>;
    deactivate(): Promise<void>;
    reload(): Promise<void>;
}
export interface ExtensionSandbox {
    id: string;
    iframe?: HTMLIFrameElement;
    worker?: Worker;
    isolated: boolean;
    permissions: ExtensionPermission[];
    api: ExtensionAPI;
}
export interface ExtensionAPI {
    framework: {
        version: string;
        createComponent: (definition: any) => any;
        getMetrics: () => any;
        getSecurityManager: () => any;
    };
    dom: {
        createElement: (tag: string) => HTMLElement;
        querySelector: (selector: string) => Element | null;
        addEventListener: (event: string, handler: Function) => void;
    };
    storage: {
        get: (key: string) => any;
        set: (key: string, value: any) => void;
        remove: (key: string) => void;
    };
    events: {
        emit: (event: string, data?: any) => void;
        on: (event: string, handler: Function) => void;
        off: (event: string, handler: Function) => void;
    };
}
export interface ExtensionEvent {
    type: 'loaded' | 'activated' | 'deactivated' | 'error' | 'permission_denied';
    extensionId: string;
    timestamp: number;
    data?: any;
}
/**
 * Extension Manager Class
 *
 * Manages the complete lifecycle of extensions including loading, sandboxing,
 * security validation, and runtime management.
 */
export declare class ExtensionManager {
    private extensions;
    private registry;
    private sandboxes;
    private eventListeners;
    private isInitialized;
    private trustedDomains;
    constructor();
    /**
     * Initialize the extension system
     */
    initialize(): Promise<void>;
    /**
     * Register an extension
     */
    registerExtension(manifest: ExtensionManifest): Promise<void>;
    /**
     * Load and activate an extension
     */
    loadExtension(extensionId: string): Promise<Extension>;
    /**
     * Unload an extension
     */
    unloadExtension(extensionId: string): Promise<void>;
    /**
     * Get loaded extensions
     */
    getExtensions(): Extension[];
    /**
     * Get extension by ID
     */
    getExtension(extensionId: string): Extension | undefined;
    /**
     * Get extension registry
     */
    getRegistry(): ExtensionManifest[];
    /**
     * Extension event system
     */
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
    /**
     * Get extension metrics
     */
    getMetrics(): any;
    private setupTrustedDomains;
    private setupExtensionRegistry;
    private initializeSandboxing;
    private setupExtensionAPI;
    private setupSecurityValidation;
    private validateManifest;
    private validateSecurity;
    private validateTrustedExtension;
    private validatePermissions;
    private createSandbox;
    private createIframeSandbox;
    private createExtensionAPI;
    private hasPermission;
    private loadDependencies;
    private loadExtensionCode;
    private activateExtension;
    private deactivateExtension;
    private reloadExtension;
    private destroySandbox;
    private emitEvent;
}
export declare const extensionManager: ExtensionManager;
//# sourceMappingURL=extension-system.d.ts.map