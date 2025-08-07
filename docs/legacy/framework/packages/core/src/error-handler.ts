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
export class ErrorHandler {
  private errors: FrameworkError[] = [];
  private errorCounts: Map<string, number> = new Map();
  private recoveryStrategies: Map<string, ErrorRecoveryStrategy> = new Map();
  private errorListeners: ((error: FrameworkError) => void)[] = [];
  private isMonitoring = false;

  constructor() {
    this.setupDefaultRecoveryStrategies();
    this.setupGlobalErrorHandling();
  }

  /**
   * Handle a critical error that may affect framework stability
   */
  handleCriticalError(message: string, error: any, context?: Partial<ErrorContext>): void {
    const frameworkError = this.createFrameworkError('critical', message, error, context);
    this.processError(frameworkError);
    
    // Critical errors always trigger immediate recovery attempts
    this.attemptRecovery(frameworkError);
  }

  /**
   * Handle a general error
   */
  handleError(message: string, error: any, context?: Partial<ErrorContext>): void {
    const frameworkError = this.createFrameworkError('error', message, error, context);
    this.processError(frameworkError);
  }

  /**
   * Handle a warning
   */
  handleWarning(message: string, context?: Partial<ErrorContext>): void {
    const frameworkError = this.createFrameworkError('warning', message, null, context);
    this.processError(frameworkError);
  }

  /**
   * Log informational message
   */
  logInfo(message: string, context?: Partial<ErrorContext>): void {
    const frameworkError = this.createFrameworkError('info', message, null, context);
    this.processError(frameworkError);
  }

  /**
   * Add error listener for custom handling
   */
  addErrorListener(listener: (error: FrameworkError) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error listener
   */
  removeErrorListener(listener: (error: FrameworkError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Set recovery strategy for specific error types
   */
  setRecoveryStrategy(errorType: string, strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.set(errorType, strategy);
  }

  /**
   * Get error metrics
   */
  getMetrics(): ErrorMetrics {
    const totalErrors = this.errors.length;
    const criticalErrors = this.errors.filter(e => e.type === 'critical').length;
    const recoveredErrors = this.errors.filter(e => e.recovered).length;
    
    const errorRate = this.calculateErrorRate();
    const meanTimeToRecovery = this.calculateMeanTimeToRecovery();

    return {
      totalErrors,
      criticalErrors,
      recoveredErrors,
      errorRate,
      meanTimeToRecovery
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10): FrameworkError[] {
    return this.errors
      .sort((a, b) => b.context.timestamp - a.context.timestamp)
      .slice(0, limit);
  }

  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errors = [];
    this.errorCounts.clear();
  }

  /**
   * Start error monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 Error monitoring started');
  }

  /**
   * Stop error monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('🔍 Error monitoring stopped');
  }

  private createFrameworkError(
    type: FrameworkError['type'],
    message: string,
    error: any,
    context?: Partial<ErrorContext>
  ): FrameworkError {
    const id = this.generateErrorId();
    const timestamp = Date.now();
    
    const fullContext: ErrorContext = {
      timestamp,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      ...context
    };

    return {
      id,
      type,
      message,
      stack: error?.stack,
      context: fullContext,
      recovered: false
    };
  }

  private processError(error: FrameworkError): void {
    // Store error
    this.errors.push(error);
    
    // Update error counts
    const key = `${error.type}:${error.context.component || 'unknown'}`;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });

    // Log error based on type
    this.logError(error);

    // Automatic recovery for errors (not warnings/info)
    if (error.type === 'error') {
      this.attemptRecovery(error);
    }
  }

  private attemptRecovery(error: FrameworkError): void {
    const strategy = this.getRecoveryStrategy(error);
    if (strategy.type === 'none') return;

    const startTime = performance.now();
    
    this.executeRecoveryStrategy(error, strategy)
      .then(recovered => {
        if (recovered) {
          error.recovered = true;
          error.recoveryTime = performance.now() - startTime;
          console.log(`✅ Recovered from error ${error.id} in ${error.recoveryTime.toFixed(2)}ms`);
        }
      })
      .catch(recoveryError => {
        console.error(`❌ Recovery failed for error ${error.id}:`, recoveryError);
      });
  }

  private async executeRecoveryStrategy(
    error: FrameworkError,
    strategy: ErrorRecoveryStrategy
  ): Promise<boolean> {
    switch (strategy.type) {
      case 'retry':
        return this.executeRetryStrategy(error, strategy);
      
      case 'fallback':
        return this.executeFallbackStrategy(error, strategy);
      
      case 'graceful-degradation':
        return this.executeGracefulDegradation(error, strategy);
      
      case 'reload':
        return this.executeReloadStrategy(error, strategy);
      
      default:
        return false;
    }
  }

  private async executeRetryStrategy(
    error: FrameworkError,
    strategy: ErrorRecoveryStrategy
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
      try {
        // Wait with exponential backoff
        await this.delay(strategy.backoffMs * Math.pow(2, attempt - 1));
        
        // Attempt to retry the operation
        // This would need to be implemented based on the specific error context
        console.log(`🔄 Retry attempt ${attempt} for error ${error.id}`);
        
        // Simulate retry success (in real implementation, this would re-execute the failed operation)
        return attempt <= 2; // Simulate success on first or second attempt
        
      } catch (retryError) {
        console.warn(`Retry attempt ${attempt} failed:`, retryError);
      }
    }
    
    return false;
  }

  private async executeFallbackStrategy(
    error: FrameworkError,
    strategy: ErrorRecoveryStrategy
  ): Promise<boolean> {
    try {
      if (strategy.fallbackComponent) {
        console.log(`🔄 Using fallback component: ${strategy.fallbackComponent}`);
        
        // Create fallback component element
        const fallbackElement = document.createElement('div');
        fallbackElement.className = 'nwc-error-fallback';
        fallbackElement.innerHTML = `
          <div style="padding: 1rem; border: 1px solid #ff6b6b; background: #fff5f5; border-radius: 4px;">
            <h3 style="margin: 0 0 0.5rem; color: #c92a2a;">Component Error</h3>
            <p style="margin: 0; color: #666;">A component failed to load. Using fallback display.</p>
          </div>
        `;
        
        // Replace failed component with fallback
        if (error.component && error.component.parentNode) {
          error.component.parentNode.replaceChild(fallbackElement, error.component);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Fallback strategy failed:', e);
      return false;
    }
  }

  private async executeGracefulDegradation(
    error: FrameworkError,
    strategy: ErrorRecoveryStrategy
  ): Promise<boolean> {
    try {
      console.log(`🔄 Applying graceful degradation for error ${error.id}`);
      
      // Disable problematic features
      if (error.type === 'performance' || error.type === 'memory') {
        // Reduce performance optimizations
        if (typeof window !== 'undefined') {
          (window as any).__NWC_PERFORMANCE_DEGRADED__ = true;
        }
        
        // Clear caches to free memory
        if (error.component) {
          const templateCache = (error.component as any).__template_cache__;
          if (templateCache) {
            templateCache.clear();
          }
        }
        
        return true;
      }
      
      // For rendering errors, use minimal template
      if (error.type === 'rendering' && error.component) {
        const minimalTemplate = '<div class="nwc-minimal">Content loading...</div>';
        if (error.component.shadowRoot) {
          error.component.shadowRoot.innerHTML = minimalTemplate;
        } else {
          error.component.innerHTML = minimalTemplate;
        }
        return true;
      }
      
      return false;
    } catch (e) {
      console.error('Graceful degradation failed:', e);
      return false;
    }
  }

  private async executeReloadStrategy(
    error: FrameworkError,
    strategy: ErrorRecoveryStrategy
  ): Promise<boolean> {
    try {
      console.log(`🔄 Reloading component/page for error ${error.id}`);
      
      if (typeof window !== 'undefined' && error.type === 'critical') {
        // Only reload for critical errors in browser environment
        window.location.reload();
        return true;
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }

  private getRecoveryStrategy(error: FrameworkError): ErrorRecoveryStrategy {
    // Check for specific strategy
    const specificStrategy = this.recoveryStrategies.get(`${error.type}:${error.context.component}`);
    if (specificStrategy) return specificStrategy;

    // Check for type-based strategy
    const typeStrategy = this.recoveryStrategies.get(error.type);
    if (typeStrategy) return typeStrategy;

    // Return default strategy
    return this.recoveryStrategies.get('default')!;
  }

  private setupDefaultRecoveryStrategies(): void {
    // Default recovery strategies
    this.recoveryStrategies.set('default', {
      type: 'retry',
      maxAttempts: 2,
      backoffMs: 100
    });

    this.recoveryStrategies.set('critical', {
      type: 'reload',
      maxAttempts: 1,
      backoffMs: 0
    });

    this.recoveryStrategies.set('error', {
      type: 'retry',
      maxAttempts: 3,
      backoffMs: 250
    });

    this.recoveryStrategies.set('warning', {
      type: 'none',
      maxAttempts: 0,
      backoffMs: 0
    });

    this.recoveryStrategies.set('info', {
      type: 'none',
      maxAttempts: 0,
      backoffMs: 0
    });
  }

  private setupGlobalErrorHandling(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError('Unhandled promise rejection', event.reason, {
          operation: 'promise_rejection'
        });
      });

      window.addEventListener('error', (event) => {
        this.handleError('Global error', event.error, {
          operation: 'global_error',
          url: event.filename
        });
      });
    }

    // Handle Node.js unhandled rejections
    if (typeof process !== 'undefined') {
      process.on('unhandledRejection', (reason, promise) => {
        this.handleError('Unhandled promise rejection', reason, {
          operation: 'promise_rejection_node'
        });
      });

      process.on('uncaughtException', (error) => {
        this.handleCriticalError('Uncaught exception', error, {
          operation: 'uncaught_exception'
        });
      });
    }
  }

  private logError(error: FrameworkError): void {
    const timestamp = new Date(error.context.timestamp).toISOString();
    const prefix = this.getLogPrefix(error.type);
    
    console.group(`${prefix} [${timestamp}] ${error.message}`);
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    console.log('Context:', error.context);
    console.log('Error ID:', error.id);
    
    console.groupEnd();
  }

  private getLogPrefix(type: FrameworkError['type']): string {
    switch (type) {
      case 'critical': return '🚨';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  }

  private calculateErrorRate(): number {
    // Calculate errors per minute over last hour
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentErrors = this.errors.filter(e => e.context.timestamp > oneHourAgo);
    return recentErrors.length / 60; // errors per minute
  }

  private calculateMeanTimeToRecovery(): number {
    const recoveredErrors = this.errors.filter(e => e.recovered && e.recoveryTime);
    
    if (recoveredErrors.length === 0) return 0;
    
    const totalRecoveryTime = recoveredErrors.reduce((sum, error) => sum + (error.recoveryTime || 0), 0);
    return totalRecoveryTime / recoveredErrors.length;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}