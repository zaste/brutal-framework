/**
 * FRAMEWORK ORCHESTRATOR
 * Central coordination system for Native Web Components Framework
 *
 * Optimal Stack Alignment:
 * - Native Web Components (no frameworks)
 * - TypeScript for type safety
 * - Cloudflare Workers for edge deployment
 * - Vercel for development/staging
 * - NPM for distribution
 * - Jest for testing
 */
import { NativeWebComponentsFramework } from './api-gateway';
export interface OrchestrationMetrics {
    totalInitTime: number;
    activeModules: string[];
    performanceStatus: string;
    errorCount: number;
    healthScore: number;
}
/**
 * Framework Orchestrator
 *
 * Coordinates initialization, lifecycle management, and inter-module communication
 * for optimal performance and reliability.
 */
export declare class FrameworkOrchestrator {
    private framework?;
    private initialized;
    private healthCheckInterval?;
    private readonly initStartTime;
    constructor();
    /**
     * Initialize the framework orchestrator
     */
    initialize(framework: NativeWebComponentsFramework): Promise<void>;
    /**
     * Get orchestration metrics
     */
    getMetrics(): OrchestrationMetrics;
    /**
     * Perform health check of all framework components
     */
    performHealthCheck(): Promise<boolean>;
    /**
     * Shutdown the framework gracefully
     */
    shutdown(): Promise<void>;
    private validateSystemReadiness;
    private startHealthMonitoring;
    private getActiveModules;
    private calculateHealthScore;
}
//# sourceMappingURL=framework-orchestrator.d.ts.map