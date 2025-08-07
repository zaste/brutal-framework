/**
 * BRUTAL V4 - Memory Performance Collector
 * Monitors JavaScript heap and memory usage
 */

export class MemoryCollector {
    constructor(interval = 5000) {
        this.interval = interval;
        this.intervalId = null;
        this.performance = null;
        this.observers = new Set();
    }
    
    /**
     * Start collecting metrics
     */
    start() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        this.intervalId = setInterval(() => {
            this.collect();
        }, this.interval);
    }
    
    /**
     * Stop collecting metrics
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.observers.clear();
    }
    
    /**
     * Collect memory metrics
     */
    collect() {
        if (!this.performance?.constructor.isEnabled || !performance.memory) return;
        
        const memory = performance.memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMB = memory.totalJSHeapSize / 1024 / 1024;
        const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
        
        this.performance.constructor.recordMetric('memory-used-mb', usedMB);
        this.performance.constructor.recordMetric('memory-total-mb', totalMB);
        this.performance.constructor.recordMetric('memory-limit-mb', limitMB);
        
        // Run observers
        this.notifyObservers(this.performance.constructor.instance?.metrics);
    }
    
    /**
     * Setup memory monitoring
     */
    setupMonitoring(performanceClass) {
        this.performance = performanceClass;
        
        if (!performance.memory) return;
        
        // Monitor memory usage
        this.observers.add((metrics) => {
            const memory = performance.memory;
            const used = memory.usedJSHeapSize;
            const total = memory.totalJSHeapSize;
            const limit = memory.jsHeapSizeLimit;
            
            metrics.set('memory-used', used);
            metrics.set('memory-total', total);
            metrics.set('memory-limit', limit);
            metrics.set('memory-usage-percent', (used / limit) * 100);
            
            // Check threshold
            const threshold = performanceClass.thresholds.get('memory-usage');
            if (threshold && used > threshold) {
                performanceClass.emitThresholdExceeded('memory-usage', used, threshold);
            }
        });
    }
    
    /**
     * Add memory observer
     */
    addObserver(observer) {
        this.observers.add(observer);
        return () => this.observers.delete(observer);
    }
    
    /**
     * Notify observers
     */
    notifyObservers(metrics) {
        this.observers.forEach(observer => {
            try {
                observer(metrics);
            } catch (error) {
                console.warn('[MemoryCollector] Observer failed:', error);
            }
        });
    }
}