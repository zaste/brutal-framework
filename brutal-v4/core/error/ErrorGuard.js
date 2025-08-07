/**
 * BRUTAL V4 - Global Error Guard System
 * Centralized error handling and recovery mechanism
 * Provides application-wide error capture and reporting
 */

import { globalEventBus } from '../events/EventBus.js';

// Error types
export const ErrorType = {
    SYNC: 'sync',
    ASYNC: 'async',
    UNHANDLED_REJECTION: 'unhandledRejection',
    COMPONENT: 'component',
    NETWORK: 'network',
    SCRIPT: 'script'
};

// Error severity levels
export const ErrorSeverity = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

class ErrorGuard {
    constructor() {
        this.errors = [];
        this.maxErrors = 100;
        this.handlers = new Map();
        this.isActive = false;
        this.config = {
            logToConsole: true,
            preventDefault: true,
            captureStackTrace: true,
            groupSimilar: true
        };
    }

    /**
     * Initialize error guard
     */
    init(config = {}) {
        if (this.isActive) return;

        Object.assign(this.config, config);

        // Global error handler
        window.addEventListener('error', this._handleError.bind(this), true);
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', this._handleRejection.bind(this));

        this.isActive = true;
        globalEventBus.emit('errorguard:init');
    }

    /**
     * Shutdown error guard
     */
    shutdown() {
        if (!this.isActive) return;

        window.removeEventListener('error', this._handleError.bind(this), true);
        window.removeEventListener('unhandledrejection', this._handleRejection.bind(this));

        this.isActive = false;
        globalEventBus.emit('errorguard:shutdown');
    }

    /**
     * Handle global errors
     */
    _handleError(event) {
        const error = {
            type: ErrorType.SYNC,
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error,
            stack: event.error?.stack,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        };

        this._processError(error);

        if (this.config.preventDefault) {
            event.preventDefault();
        }
    }

    /**
     * Handle unhandled promise rejections
     */
    _handleRejection(event) {
        const error = {
            type: ErrorType.UNHANDLED_REJECTION,
            message: event.reason?.message || String(event.reason),
            error: event.reason,
            stack: event.reason?.stack,
            promise: event.promise,
            timestamp: Date.now()
        };

        this._processError(error);

        if (this.config.preventDefault) {
            event.preventDefault();
        }
    }

    /**
     * Process and store error
     */
    _processError(error) {
        // Determine severity
        error.severity = this._determineSeverity(error);

        // Group similar errors
        if (this.config.groupSimilar) {
            const similar = this._findSimilarError(error);
            if (similar) {
                similar.count = (similar.count || 1) + 1;
                similar.lastOccurred = Date.now();
                return;
            }
        }

        // Store error
        this.errors.push(error);
        
        // Maintain max errors limit
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // Log to console
        if (this.config.logToConsole) {
            console.error('[ErrorGuard]', error.message, error);
        }

        // Execute handlers
        this._executeHandlers(error);

        // Emit event
        globalEventBus.emit('error:captured', error);
    }

    /**
     * Determine error severity
     */
    _determineSeverity(error) {
        if (error.type === ErrorType.CRITICAL || error.message?.includes('CRITICAL')) {
            return ErrorSeverity.CRITICAL;
        }
        if (error.type === ErrorType.UNHANDLED_REJECTION) {
            return ErrorSeverity.HIGH;
        }
        if (error.type === ErrorType.NETWORK) {
            return ErrorSeverity.MEDIUM;
        }
        return ErrorSeverity.LOW;
    }

    /**
     * Find similar error
     */
    _findSimilarError(error) {
        return this.errors.find(e => 
            e.message === error.message && 
            e.filename === error.filename &&
            e.lineno === error.lineno
        );
    }

    /**
     * Execute error handlers
     */
    _executeHandlers(error) {
        this.handlers.forEach((handler, pattern) => {
            if (this._matchesPattern(error, pattern)) {
                try {
                    handler(error);
                } catch (handlerError) {
                    console.error('Error in error handler:', handlerError);
                }
            }
        });
    }

    /**
     * Check if error matches pattern
     */
    _matchesPattern(error, pattern) {
        if (pattern === '*') return true;
        if (pattern instanceof RegExp) {
            return pattern.test(error.message);
        }
        if (typeof pattern === 'function') {
            return pattern(error);
        }
        return error.type === pattern || error.severity === pattern;
    }

    /**
     * Register error handler
     */
    onError(pattern, handler) {
        this.handlers.set(pattern, handler);
        return () => this.handlers.delete(pattern);
    }

    /**
     * Capture error manually
     */
    captureError(error, context = {}) {
        const processedError = {
            type: ErrorType.COMPONENT,
            message: error.message || String(error),
            error,
            stack: error.stack,
            context,
            timestamp: Date.now()
        };

        this._processError(processedError);
    }

    /**
     * Capture exception with context
     */
    captureException(exception, context = {}) {
        this.captureError(exception, context);
    }

    /**
     * Get error statistics
     */
    getStats() {
        const stats = {
            total: this.errors.length,
            bySeverity: {},
            byType: {},
            recent: this.errors.slice(-10)
        };

        this.errors.forEach(error => {
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
        });

        return stats;
    }

    /**
     * Clear errors
     */
    clear() {
        this.errors = [];
        globalEventBus.emit('errorguard:cleared');
    }

    /**
     * Get errors
     */
    getErrors(filter = {}) {
        let errors = [...this.errors];

        if (filter.severity) {
            errors = errors.filter(e => e.severity === filter.severity);
        }
        if (filter.type) {
            errors = errors.filter(e => e.type === filter.type);
        }
        if (filter.since) {
            errors = errors.filter(e => e.timestamp >= filter.since);
        }

        return errors;
    }
}

// Export singleton instance
export const errorGuard = new ErrorGuard();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
    errorGuard.init();
}