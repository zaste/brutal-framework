/**
 * BRUTAL V4 - Performance Utilities
 * Helper functions and decorators for performance monitoring
 */

import { BrutalPerformance } from '../Monitor.js';

/**
 * Performance utilities
 */
export const PerformanceUtils = {
    /**
     * Measure function execution
     */
    measureFunction(fn, name = 'anonymous') {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        BrutalPerformance.recordMetric(`function-${name}`, end - start);
        
        return result;
    },
    
    /**
     * Measure async function execution
     */
    async measureAsync(fn, name = 'anonymous') {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        
        BrutalPerformance.recordMetric(`async-function-${name}`, end - start);
        
        return result;
    },
    
    /**
     * Create performance session
     */
    createSession(name) {
        return {
            name,
            start: performance.now(),
            end: null,
            measurements: [],
            
            measure(label, fn) {
                const start = performance.now();
                const result = fn();
                const end = performance.now();
                
                this.measurements.push({
                    label,
                    duration: end - start,
                    timestamp: start
                });
                
                return result;
            },
            
            async measureAsync(label, fn) {
                const start = performance.now();
                const result = await fn();
                const end = performance.now();
                
                this.measurements.push({
                    label,
                    duration: end - start,
                    timestamp: start
                });
                
                return result;
            },
            
            finish() {
                this.end = performance.now();
                const summary = {
                    name: this.name,
                    totalDuration: this.end - this.start,
                    measurements: this.measurements
                };
                
                // Record session metrics
                BrutalPerformance.recordMetric(`session-${this.name}`, summary.totalDuration, {
                    measurements: this.measurements.length
                });
                
                return summary;
            }
        };
    },
    
    /**
     * Throttle function execution
     */
    throttle(fn, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * Debounce function execution
     */
    debounce(fn, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    },
    
    /**
     * Memory size formatter
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
    
    /**
     * Time formatter
     */
    formatTime(ms) {
        if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
        if (ms < 1000) return `${ms.toFixed(2)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    }
};

/**
 * Performance measurement decorator
 */
export function measure(name, category = 'function') {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        
        descriptor.value = function(...args) {
            if (BrutalPerformance.isEnabled) {
                const measureName = `${target.constructor.name}.${propertyKey}`;
                BrutalPerformance.startMeasurement(measureName, category);
                
                try {
                    const result = originalMethod.apply(this, args);
                    
                    // Handle async methods
                    if (result && typeof result.then === 'function') {
                        return result.finally(() => {
                            BrutalPerformance.endMeasurement(measureName);
                        });
                    } else {
                        BrutalPerformance.endMeasurement(measureName);
                        return result;
                    }
                } catch (error) {
                    BrutalPerformance.endMeasurement(measureName);
                    throw error;
                }
            } else {
                return originalMethod.apply(this, args);
            }
        };
        
        return descriptor;
    };
}