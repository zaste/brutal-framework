/**
 * PERFORMANCE VALIDATOR
 * Continuous performance monitoring and validation system
 *
 * Maintains 50x React performance advantage through real-time monitoring,
 * regression detection, and automatic optimization recommendations.
 */
export interface PerformanceMetric {
    name: string;
    value: number;
    timestamp: number;
    target?: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
}
export interface PerformanceBenchmark {
    operation: string;
    nativeTime: number;
    reactTime: number;
    multiplier: number;
    samples: number;
    confidence: number;
}
export interface PerformanceValidationResult {
    passed: boolean;
    currentMultiplier: number;
    targetMultiplier: number;
    recommendations: string[];
    criticalIssues: string[];
}
export interface PerformanceAlert {
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    metric: string;
    threshold: number;
    currentValue: number;
    timestamp: number;
}
/**
 * Performance Validator Class
 *
 * Provides comprehensive performance monitoring with real-time validation,
 * regression detection, and optimization recommendations.
 */
export declare class PerformanceValidator {
    private metrics;
    private benchmarks;
    private alerts;
    private isMonitoring;
    private monitoringInterval?;
    private baselineMetrics;
    private performanceObserver?;
    private readonly TARGET_MULTIPLIER;
    private readonly WARNING_THRESHOLD;
    private readonly CRITICAL_THRESHOLD;
    constructor();
    /**
     * Initialize the performance validator
     */
    initialize(): Promise<void>;
    /**
     * Validate current performance against targets
     */
    validatePerformance(): PerformanceValidationResult;
    /**
     * Record a performance metric
     */
    recordMetric(name: string, value: number, target?: number): void;
    /**
     * Record a performance benchmark comparison
     */
    recordBenchmark(benchmark: PerformanceBenchmark): void;
    /**
     * Get performance metrics summary
     */
    getMetrics(): any;
    /**
     * Start continuous performance monitoring
     */
    startMonitoring(): void;
    /**
     * Stop performance monitoring
     */
    stopMonitoring(): void;
    /**
     * Run comprehensive performance benchmark
     */
    runPerformanceBenchmark(): Promise<PerformanceBenchmark[]>;
    /**
     * Get recent performance alerts
     */
    getAlerts(): PerformanceAlert[];
    /**
     * Clear all performance data
     */
    clearMetrics(): void;
    private runBaselineBenchmarks;
    private getCurrentPerformanceMultiplier;
    private getOverallStatus;
    private determineMetricStatus;
    private checkMetricAlert;
    private getRecentMetrics;
    private getActiveAlerts;
    private getAverageMultiplier;
    private getBestPerformance;
    private getWorstPerformance;
    private collectPerformanceMetrics;
    private detectRegressions;
    private analyzeSpecificMetrics;
    private setupPerformanceObserver;
    private establishBaselines;
    private benchmarkComponentCreation;
    private benchmarkRendering;
    private benchmarkEventHandling;
    private benchmarkStateUpdates;
    private measureComponentCreation;
    private measureRendering;
    private measureEventHandling;
    private measureStateUpdates;
}
//# sourceMappingURL=performance-validator.d.ts.map