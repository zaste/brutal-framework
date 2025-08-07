/**
 * BrutalTestMetrics - Performance and metrics tracking for tests
 * 
 * Provides comprehensive metrics collection for test execution,
 * including memory usage, render times, and custom metrics.
 */

export class BrutalTestMetrics {
    constructor() {
        this.metrics = new Map();
        this.marks = new Map();
        this.measures = new Map();
    }
    
    // Mark a point in time
    mark(name) {
        const timestamp = performance.now();
        this.marks.set(name, timestamp);
        return timestamp;
    }
    
    // Measure between two marks
    measure(name, startMark, endMark) {
        const start = this.marks.get(startMark);
        const end = endMark ? this.marks.get(endMark) : performance.now();
        
        if (!start) {
            throw new Error(`Start mark "${startMark}" not found`);
        }
        
        const duration = end - start;
        this.measures.set(name, {
            name,
            startTime: start,
            duration,
            timestamp: performance.now()
        });
        
        return duration;
    }
    
    // Get current memory usage
    getMemoryUsage() {
        if (!performance.memory) {
            return {
                usedJSHeapSize: 0,
                totalJSHeapSize: 0,
                jsHeapSizeLimit: 0,
                available: false
            };
        }
        
        return {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            available: true
        };
    }
    
    // Measure memory delta
    measureMemory(fn) {
        const before = this.getMemoryUsage();
        const result = fn();
        const after = this.getMemoryUsage();
        
        return {
            result,
            memoryDelta: after.usedJSHeapSize - before.usedJSHeapSize,
            before,
            after
        };
    }
    
    // Async memory measurement
    async measureMemoryAsync(fn) {
        const before = this.getMemoryUsage();
        const result = await fn();
        const after = this.getMemoryUsage();
        
        return {
            result,
            memoryDelta: after.usedJSHeapSize - before.usedJSHeapSize,
            before,
            after
        };
    }
    
    // Count occurrences
    count(name) {
        const current = this.metrics.get(name) || 0;
        this.metrics.set(name, current + 1);
        return current + 1;
    }
    
    // Set a metric value
    set(name, value) {
        this.metrics.set(name, value);
    }
    
    // Get a metric value
    get(name) {
        return this.metrics.get(name);
    }
    
    // Increment a metric
    increment(name, amount = 1) {
        const current = this.metrics.get(name) || 0;
        this.metrics.set(name, current + amount);
        return current + amount;
    }
    
    // Decrement a metric
    decrement(name, amount = 1) {
        const current = this.metrics.get(name) || 0;
        this.metrics.set(name, current - amount);
        return current - amount;
    }
    
    // Track render performance
    trackRender(component) {
        const startMark = `render-start-${Date.now()}`;
        this.mark(startMark);
        
        const originalRender = component.render.bind(component);
        
        return new Promise((resolve) => {
            component.render = () => {
                const result = originalRender();
                const duration = this.measure('lastRender', startMark);
                
                this.increment('totalRenders');
                this.set('lastRenderTime', duration);
                
                // Track average render time
                const avgRender = this.get('avgRenderTime') || 0;
                const totalRenders = this.get('totalRenders') || 1;
                this.set('avgRenderTime', 
                    (avgRender * (totalRenders - 1) + duration) / totalRenders
                );
                
                // Restore original render
                component.render = originalRender;
                
                resolve({
                    duration,
                    avgRenderTime: this.get('avgRenderTime'),
                    totalRenders: this.get('totalRenders')
                });
                
                return result;
            };
            
            component.render();
        });
    }
    
    // Profile a function execution
    profile(name, fn) {
        const startMark = `${name}-start`;
        const endMark = `${name}-end`;
        
        this.mark(startMark);
        const memBefore = this.getMemoryUsage();
        
        try {
            const result = fn();
            
            this.mark(endMark);
            const duration = this.measure(name, startMark, endMark);
            const memAfter = this.getMemoryUsage();
            
            return {
                result,
                duration,
                memoryDelta: memAfter.usedJSHeapSize - memBefore.usedJSHeapSize,
                metrics: {
                    duration,
                    memory: {
                        before: memBefore.usedJSHeapSize,
                        after: memAfter.usedJSHeapSize,
                        delta: memAfter.usedJSHeapSize - memBefore.usedJSHeapSize
                    }
                }
            };
        } catch (error) {
            this.mark(endMark);
            const duration = this.measure(name, startMark, endMark);
            throw Object.assign(error, { profileDuration: duration });
        }
    }
    
    // Async profiling
    async profileAsync(name, fn) {
        const startMark = `${name}-start`;
        const endMark = `${name}-end`;
        
        this.mark(startMark);
        const memBefore = this.getMemoryUsage();
        
        try {
            const result = await fn();
            
            this.mark(endMark);
            const duration = this.measure(name, startMark, endMark);
            const memAfter = this.getMemoryUsage();
            
            return {
                result,
                duration,
                memoryDelta: memAfter.usedJSHeapSize - memBefore.usedJSHeapSize,
                metrics: {
                    duration,
                    memory: {
                        before: memBefore.usedJSHeapSize,
                        after: memAfter.usedJSHeapSize,
                        delta: memAfter.usedJSHeapSize - memBefore.usedJSHeapSize
                    }
                }
            };
        } catch (error) {
            this.mark(endMark);
            const duration = this.measure(name, startMark, endMark);
            throw Object.assign(error, { profileDuration: duration });
        }
    }
    
    // Get summary of all metrics
    getSummary() {
        const summary = {
            metrics: Object.fromEntries(this.metrics),
            measures: Object.fromEntries(this.measures),
            memory: this.getMemoryUsage()
        };
        
        // Add computed metrics
        if (this.metrics.has('totalRenders')) {
            summary.performance = {
                totalRenders: this.get('totalRenders'),
                avgRenderTime: this.get('avgRenderTime'),
                lastRenderTime: this.get('lastRenderTime')
            };
        }
        
        return summary;
    }
    
    // Reset all metrics
    reset() {
        this.metrics.clear();
        this.marks.clear();
        this.measures.clear();
    }
    
    // Export metrics for reporting
    export() {
        return {
            timestamp: Date.now(),
            metrics: this.getSummary(),
            environment: {
                userAgent: navigator.userAgent,
                memory: performance.memory ? true : false,
                timestamp: new Date().toISOString()
            }
        };
    }
}

// Singleton instance for global metrics
export const globalMetrics = new BrutalTestMetrics();

// Mixin for adding metrics to test classes
export const BrutalMetricsMixin = {
    setupMetrics() {
        this._metrics = new BrutalTestMetrics();
    },
    
    mark(name) {
        return this._metrics.mark(name);
    },
    
    measure(name, startMark, endMark) {
        return this._metrics.measure(name, startMark, endMark);
    },
    
    profileSync(name, fn) {
        return this._metrics.profile(name, fn);
    },
    
    async profile(name, fn) {
        return this._metrics.profileAsync(name, fn);
    },
    
    getMetrics() {
        return this._metrics.getSummary();
    }
};