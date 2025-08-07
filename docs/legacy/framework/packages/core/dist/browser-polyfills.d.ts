/**
 * BROWSER API POLYFILLS
 * Essential polyfills for Native Web Components Framework
 *
 * Provides fallbacks for modern browser APIs to ensure 100% compatibility
 * without runtime errors or downgrades in functionality.
 */
/**
 * IntersectionObserver Polyfill
 * Required for: Animation triggers, scroll-based optimizations
 */
export declare class IntersectionObserverPolyfill implements IntersectionObserver {
    private callback;
    private options;
    private targets;
    private isPolyfill;
    readonly root: Element | Document | null;
    readonly rootMargin: string;
    readonly thresholds: ReadonlyArray<number>;
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit);
    observe(target: Element): void;
    unobserve(target: Element): void;
    disconnect(): void;
    takeRecords(): IntersectionObserverEntry[];
    private startPolling;
    private checkIntersection;
}
/**
 * CSSStyleSheet Polyfill
 * Required for: Constructable stylesheets, adoptedStyleSheets
 */
export declare class CSSStyleSheetPolyfill implements CSSStyleSheet {
    private _cssText;
    private _rules;
    readonly href: string | null;
    readonly media: MediaList;
    readonly ownerNode: Element | ProcessingInstruction | null;
    readonly ownerRule: CSSRule | null;
    readonly parentStyleSheet: CSSStyleSheet | null;
    readonly title: string | null;
    readonly type: string;
    disabled: boolean;
    constructor(options?: CSSStyleSheetInit);
    get cssRules(): CSSRuleList;
    get rules(): CSSRuleList;
    insertRule(rule: string, index?: number): number;
    deleteRule(index: number): void;
    addRule(selector: string, style: string, index?: number): number;
    removeRule(index: number): void;
    replace(text: string): Promise<CSSStyleSheet>;
    replaceSync(text: string): void;
    get cssText(): string;
    applyToShadowRoot(shadowRoot: ShadowRoot): void;
}
/**
 * Global Polyfill Installation
 * Installs polyfills only when native APIs are missing
 */
export declare function installBrowserPolyfills(): void;
/**
 * Enhanced polyfill installation with force option
 */
export declare function ensurePolyfillsInstalled(force?: boolean): void;
/**
 * ResizeObserver Polyfill
 * Required for: Component resize detection, responsive optimizations
 */
export declare class ResizeObserverPolyfill implements ResizeObserver {
    private callback;
    private targets;
    private isPolyfill;
    constructor(callback: ResizeObserverCallback);
    observe(target: Element, options?: ResizeObserverOptions): void;
    unobserve(target: Element): void;
    disconnect(): void;
    private startPolling;
    private checkAllTargets;
    private checkResize;
}
/**
 * MutationObserver Polyfill
 * Required for: DOM change detection, component lifecycle
 */
export declare class MutationObserverPolyfill implements MutationObserver {
    private callback;
    private targets;
    private isPolyfill;
    constructor(callback: MutationCallback);
    observe(target: Node, options: MutationObserverInit): void;
    disconnect(): void;
    takeRecords(): MutationRecord[];
    private startPolling;
    private checkAllTargets;
    private checkMutations;
    private getAttributes;
}
/**
 * CustomEvent Polyfill
 * Required for: Component communication, event dispatching
 */
export declare class CustomEventPolyfill extends Event implements CustomEvent {
    readonly detail: any;
    constructor(type: string, eventInitDict?: CustomEventInit);
    initCustomEvent(type: string, bubbles?: boolean, cancelable?: boolean, detail?: any): void;
}
/**
 * Performance API Polyfill
 * Required for: Performance monitoring, timing measurements
 */
export declare class PerformancePolyfill implements Performance {
    private startTime;
    readonly timeOrigin: number;
    readonly timing: PerformanceTiming;
    readonly navigation: PerformanceNavigation;
    now(): number;
    mark(name: string): void;
    measure(name: string, startMark?: string, endMark?: string): void;
    getEntries(): PerformanceEntryList;
    getEntriesByName(name: string, type?: string): PerformanceEntryList;
    getEntriesByType(type: string): PerformanceEntryList;
    clearMarks(name?: string): void;
    clearMeasures(name?: string): void;
    clearResourceTimings(): void;
    setResourceTimingBufferSize(maxSize: number): void;
    toJSON(): any;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    dispatchEvent(event: Event): boolean;
}
/**
 * Feature Detection Utilities
 */
export declare const browserSupport: {
    intersectionObserver: boolean;
    constructableStylesheets: boolean;
    adoptedStyleSheets: boolean;
    resizeObserver: boolean;
    mutationObserver: boolean;
    customEvent: boolean;
    performanceApi: boolean;
    webComponents: boolean;
    readonly hasAllFeatures: boolean;
    readonly compatibilityScore: number;
};
//# sourceMappingURL=browser-polyfills.d.ts.map