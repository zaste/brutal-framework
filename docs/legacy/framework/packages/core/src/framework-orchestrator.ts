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
import { ErrorHandler } from './error-handler';
import { PerformanceValidator } from './performance-validator';

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
export class FrameworkOrchestrator {
  private framework?: NativeWebComponentsFramework;
  private initialized = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private readonly initStartTime: number;

  constructor() {
    this.initStartTime = performance.now();
  }

  /**
   * Initialize the framework orchestrator
   */
  async initialize(framework: NativeWebComponentsFramework): Promise<void> {
    if (this.initialized) {
      throw new Error('Framework orchestrator already initialized');
    }

    console.log('🎼 Initializing Framework Orchestrator...');
    
    this.framework = framework;
    
    // Setup health monitoring
    this.startHealthMonitoring();
    
    // Validate system readiness
    await this.validateSystemReadiness();
    
    this.initialized = true;
    
    const totalTime = performance.now() - this.initStartTime;
    console.log(`✅ Framework Orchestrator ready in ${totalTime.toFixed(2)}ms`);
  }

  /**
   * Get orchestration metrics
   */
  getMetrics(): OrchestrationMetrics {
    if (!this.framework) {
      return {
        totalInitTime: 0,
        activeModules: [],
        performanceStatus: 'not_initialized',
        errorCount: 0,
        healthScore: 0
      };
    }

    const frameworkMetrics = this.framework.getMetrics();
    const totalInitTime = performance.now() - this.initStartTime;
    
    return {
      totalInitTime,
      activeModules: this.getActiveModules(),
      performanceStatus: frameworkMetrics.performance.status || 'unknown',
      errorCount: frameworkMetrics.errors.totalErrors || 0,
      healthScore: this.calculateHealthScore()
    };
  }

  /**
   * Perform health check of all framework components
   */
  async performHealthCheck(): Promise<boolean> {
    if (!this.framework) return false;

    try {
      // Check performance validation
      const perfValidation = this.framework.performance.validatePerformance();
      if (!perfValidation.passed) {
        console.warn('⚠️ Performance validation failed:', perfValidation.criticalIssues);
      }

      // Check error levels
      const errorMetrics = this.framework.errors.getMetrics();
      if (errorMetrics.criticalErrors > 0) {
        console.warn('⚠️ Critical errors detected:', errorMetrics.criticalErrors);
      }

      // All checks passed
      return perfValidation.passed && errorMetrics.criticalErrors === 0;
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  /**
   * Shutdown the framework gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Framework Orchestrator...');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.framework) {
      this.framework.performance.stopMonitoring();
      this.framework.errors.stopMonitoring();
    }

    this.initialized = false;
    console.log('✅ Framework Orchestrator shutdown complete');
  }

  private async validateSystemReadiness(): Promise<void> {
    if (!this.framework) {
      throw new Error('Framework not available for validation');
    }

    // Validate performance system
    const perfMetrics = this.framework.performance.getMetrics();
    if (perfMetrics.performanceMultiplier < 10) {
      console.warn('⚠️ Performance multiplier below minimum threshold');
    }

    // Validate error handling
    const errorMetrics = this.framework.errors.getMetrics();
    if (errorMetrics.totalErrors > 100) {
      console.warn('⚠️ High error count detected during initialization');
    }

    console.log('✅ System readiness validation complete');
  }

  private startHealthMonitoring(): void {
    // Run health check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.performHealthCheck();
      
      if (!isHealthy) {
        console.warn('⚠️ Framework health check failed - investigating...');
        // Could trigger automatic recovery here
      }
    }, 30000);

    console.log('🏥 Health monitoring started');
  }

  private getActiveModules(): string[] {
    if (!this.framework) return [];

    const modules = ['core'];
    
    // Check which extensions are loaded
    if (this.framework.extensions.aiml) modules.push('ai-ml');
    if (this.framework.extensions.developerExperience) modules.push('developer-experience');
    if (this.framework.extensions.performanceScale) modules.push('performance-scale');
    if (this.framework.extensions.advancedSecurity) modules.push('advanced-security');
    if (this.framework.extensions.industrySpecific) modules.push('industry-specific');
    if (this.framework.extensions.crossPlatform) modules.push('cross-platform');

    return modules;
  }

  private calculateHealthScore(): number {
    if (!this.framework) return 0;

    let score = 100;

    try {
      const perfMetrics = this.framework.performance.getMetrics();
      const errorMetrics = this.framework.errors.getMetrics();

      // Performance score (40% weight)
      const perfMultiplier = perfMetrics.performanceMultiplier || 0;
      const perfScore = Math.min(100, (perfMultiplier / 50) * 100);
      score = score * 0.4 + perfScore * 0.4;

      // Error score (30% weight)
      const errorRate = errorMetrics.errorRate || 0;
      const errorScore = Math.max(0, 100 - (errorRate * 10));
      score = score * 0.7 + errorScore * 0.3;

      // Availability score (30% weight)
      const availabilityScore = this.initialized ? 100 : 0;
      score = score * 0.7 + availabilityScore * 0.3;

    } catch (error) {
      console.warn('Error calculating health score:', error);
      score = 50; // Default to moderate health if calculation fails
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  }
}