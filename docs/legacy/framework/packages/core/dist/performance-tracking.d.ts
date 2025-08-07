/**
 * PERFORMANCE TRACKING SYSTEM
 * Global performance monitoring for Native Web Components Framework
 *
 * Provides real-time performance metrics, React comparison, and optimization insights
 * without any simulations or placeholders.
 */
export interface PerformanceMetrics {
    renderTime: number;
    memoryUsage: number;
    componentCount: number;
    eventHandlerCount: number;
    templateCacheHits: number;
    shadowDOMPoolUsage: number;
    reactComparisonMultiplier: number;
    timestamp: number;
}
export interface ComponentPerformanceData {
    name: string;
    creationTime: number;
    renderTime: number;
    updateTime: number;
    memoryFootprint: number;
    eventCount: number;
    optimizationLevel: 'none' | 'basic' | 'advanced' | 'enterprise';
}
/**
 * Global Performance Tracking System
 * Installed as window.__NWC_PERFORMANCE__ for framework-wide monitoring
 */
declare class PerformanceTracker {
    private metrics;
    private componentMetrics;
    private reactBaseline;
    private measurementStartTime;
    private isTracking;
    constructor();
    /**
     * Record a performance metric
     */
    recordMetric(name: string, value: number): void;
    /**
     * Record component-specific performance data
     */
    recordComponentMetrics(componentName: string, data: Partial<ComponentPerformanceData>): void;
    /**
     * Get current performance metrics
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Get component-specific metrics
     */
    getComponentMetrics(componentName?: string): ComponentPerformanceData[];
    /**
     * Calculate real React performance multiplier
     */
    private calculateReactMultiplier;
    /**
     * Calculate average render time across all components
     */
    private calculateAverageRenderTime;
    /**
     * Get current memory usage
     */
    private getCurrentMemoryUsage;
    /**
     * Analyze performance and log warnings
     */
    private analyzePerformance;
    /**
     * Initialize global performance tracking
     */
    private initializeGlobalTracking;
    /**
     * Start performance tracking
     */
    startTracking(): void;
    /**
     * Stop performance tracking
     */
    stopTracking(): void;
    /**
     * Reset all metrics
     */
    resetMetrics(): void;
    /**
     * Export performance data for analysis
     */
    exportData(): string;
}
export declare const performanceTracker: PerformanceTracker;
export declare const recordComponentMetrics: (componentName: string, data: Partial<ComponentPerformanceData>) => void;
export declare const recordMetric: (name: string, value: number) => void;
export declare const getPerformanceMetrics: () => PerformanceMetrics;
declare global {
    interface Window {
        __NWC_PERFORMANCE__: PerformanceTracker;
    }
}
export {};
//# sourceMappingURL=performance-tracking.d.ts.map