/**
 * ERROR HANDLER
 * Centralized error management and recovery system
 *
 * Features: Global error handling, recovery mechanisms, error reporting
 * Integration: Monitoring systems, alerting, debugging tools
 */
export interface ErrorMetrics {
    totalErrors: number;
    criticalErrors: number;
    recoveredErrors: number;
    errorRate: number;
    meanTimeToRecovery: number;
}
export interface ErrorContext {
    component?: string;
    extension?: string;
    operation?: string;
    timestamp: number;
    userAgent: string;
    url: string;
    userId?: string;
    sessionId?: string;
}
export interface FrameworkError {
    id: string;
    type: 'critical' | 'error' | 'warning' | 'info';
    message: string;
    stack?: string;
    context: ErrorContext;
    recovered: boolean;
    recoveryTime?: number;
}
export interface ErrorRecoveryStrategy {
    type: 'retry' | 'fallback' | 'graceful-degradation' | 'reload' | 'none';
    maxAttempts: number;
    backoffMs: number;
    fallbackComponent?: string;
}
/**
 * Error Handler Class
 *
 * Provides comprehensive error management with automatic recovery,
 * monitoring integration, and debugging capabilities.
 */
export declare class ErrorHandler {
    private errors;
    private errorCounts;
    private recoveryStrategies;
    private errorListeners;
    private isMonitoring;
    constructor();
    /**
     * Handle a critical error that may affect framework stability
     */
    handleCriticalError(message: string, error: any, context?: Partial<ErrorContext>): void;
    /**
     * Handle a general error
     */
    handleError(message: string, error: any, context?: Partial<ErrorContext>): void;
    /**
     * Handle a warning
     */
    handleWarning(message: string, context?: Partial<ErrorContext>): void;
    /**
     * Log informational message
     */
    logInfo(message: string, context?: Partial<ErrorContext>): void;
    /**
     * Add error listener for custom handling
     */
    addErrorListener(listener: (error: FrameworkError) => void): void;
    /**
     * Remove error listener
     */
    removeErrorListener(listener: (error: FrameworkError) => void): void;
    /**
     * Set recovery strategy for specific error types
     */
    setRecoveryStrategy(errorType: string, strategy: ErrorRecoveryStrategy): void;
    /**
     * Get error metrics
     */
    getMetrics(): ErrorMetrics;
    /**
     * Get recent errors
     */
    getRecentErrors(limit?: number): FrameworkError[];
    /**
     * Clear error history
     */
    clearErrors(): void;
    /**
     * Start error monitoring
     */
    startMonitoring(): void;
    /**
     * Stop error monitoring
     */
    stopMonitoring(): void;
    private createFrameworkError;
    private processError;
    private attemptRecovery;
    private executeRecoveryStrategy;
    private executeRetryStrategy;
    private executeFallbackStrategy;
    private executeGracefulDegradation;
    private executeReloadStrategy;
    private getRecoveryStrategy;
    private setupDefaultRecoveryStrategies;
    private setupGlobalErrorHandling;
    private logError;
    private getLogPrefix;
    private calculateErrorRate;
    private calculateMeanTimeToRecovery;
    private generateErrorId;
    private delay;
}
//# sourceMappingURL=error-handler.d.ts.map