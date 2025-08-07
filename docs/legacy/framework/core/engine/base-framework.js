/**
 * MISSING BASE FRAMEWORK - FOUNDATION CLASS
 * Foundation class for the Native Web Components Framework
 * 
 * This class provides the base functionality that all other classes inherit from
 * BREAKTHROUGH: Universal base class with performance tracking and caching
 * 
 * CORE CAPABILITIES:
 * 1. Performance measurement utilities
 * 2. Caching infrastructure
 * 3. Error handling patterns
 * 4. Async/await patterns
 * 5. Configuration management
 * 6. Logging utilities
 * 
 * Foundation: Base class for all framework components
 * Target: Universal patterns and utilities
 */

class BaseFramework {
  
  // BASE FRAMEWORK CONSTANTS
  static PERFORMANCE_TRACKING = {
    ENABLED: true,
    PRECISION: 3,
    STORAGE_LIMIT: 1000
  };
  
  static CACHE_LIMITS = {
    DEFAULT: 100,
    MEMORY: 50,
    DISK: 200
  };

  // BASE FRAMEWORK INFRASTRUCTURE
  static globalCache = new Map();
  static performanceMetrics = new Map();
  static errorLog = new Map();
  static configRegistry = new Map();
  
  static baseMetrics = {
    operationTimes: [],
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0
  };

  /**
   * Calculate average from array of numbers
   */
  static _calculateAverage(values) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Format performance time
   */
  static _formatPerformanceTime(ms) {
    if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  /**
   * Track performance metrics
   */
  static _trackPerformance(operation, startTime) {
    if (!this.PERFORMANCE_TRACKING.ENABLED) return;
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    
    const metrics = this.performanceMetrics.get(operation);
    metrics.push(duration);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
    
    this.baseMetrics.operationTimes.push(duration);
  }

  /**
   * Get cache with hit/miss tracking
   */
  static _getCached(key, cache = this.globalCache) {
    if (cache.has(key)) {
      this.baseMetrics.cacheHits++;
      return cache.get(key);
    }
    this.baseMetrics.cacheMisses++;
    return null;
  }

  /**
   * Set cache with size limits
   */
  static _setCached(key, value, cache = this.globalCache, limit = this.CACHE_LIMITS.DEFAULT) {
    if (cache.size >= limit) {
      // Remove oldest entry
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(key, value);
  }

  /**
   * Log error with context
   */
  static _logError(error, context = {}) {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errorEntry = {
      id: errorId,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };
    
    this.errorLog.set(errorId, errorEntry);
    this.baseMetrics.errors++;
    
    console.error(`🚨 Error [${errorId}]:`, error.message);
    if (context.operation) {
      console.error(`📍 Operation: ${context.operation}`);
    }
    
    return errorId;
  }

  /**
   * Validate configuration object
   */
  static _validateConfig(config, requiredKeys = []) {
    if (!config || typeof config !== 'object') {
      throw new Error('Configuration must be an object');
    }
    
    for (const key of requiredKeys) {
      if (!(key in config)) {
        throw new Error(`Missing required configuration key: ${key}`);
      }
    }
    
    return true;
  }

  /**
   * Merge configuration with defaults
   */
  static _mergeConfig(userConfig, defaultConfig) {
    return {
      ...defaultConfig,
      ...userConfig
    };
  }

  /**
   * Get base framework metrics
   */
  static getBaseFrameworkMetrics() {
    const totalOperations = this.baseMetrics.operationTimes.length;
    const avgOperationTime = this._calculateAverage(this.baseMetrics.operationTimes);
    const cacheHitRate = this.baseMetrics.cacheHits / (this.baseMetrics.cacheHits + this.baseMetrics.cacheMisses);
    
    return {
      baseFramework: {
        mode: 'BASE_FRAMEWORK',
        performance: {
          totalOperations,
          avgOperationTime,
          formattedAvgTime: this._formatPerformanceTime(avgOperationTime)
        },
        caching: {
          hits: this.baseMetrics.cacheHits,
          misses: this.baseMetrics.cacheMisses,
          hitRate: isNaN(cacheHitRate) ? 0 : cacheHitRate,
          cacheSize: this.globalCache.size
        },
        errors: {
          total: this.baseMetrics.errors,
          errorLogSize: this.errorLog.size
        },
        memory: {
          performanceMetrics: this.performanceMetrics.size,
          configRegistry: this.configRegistry.size
        }
      }
    };
  }

  /**
   * Initialize base framework
   */
  static initialize() {
    console.log('🏗️ Base Framework initialized');
    return this.getBaseFrameworkMetrics();
  }
}

export {
  BaseFramework
};