/**
 * BRUTAL V4 - Network Performance Collector
 * Monitors network connection and performance
 */

export class NetworkCollector {
    constructor(interval = 10000) {
        this.interval = interval;
        this.intervalId = null;
        this.performance = null;
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
        
        // Setup connection change listener
        this.setupConnectionListener();
    }
    
    /**
     * Stop collecting metrics
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        // Remove connection listener
        if (this.connectionListener && 'connection' in navigator) {
            navigator.connection.removeEventListener('change', this.connectionListener);
        }
    }
    
    /**
     * Collect network metrics
     */
    collect() {
        if (!this.performance?.constructor.isEnabled || !('connection' in navigator)) return;
        
        const connection = navigator.connection;
        
        this.performance.constructor.recordMetric('network-effective-type', connection.effectiveType);
        this.performance.constructor.recordMetric('network-downlink', connection.downlink);
        this.performance.constructor.recordMetric('network-rtt', connection.rtt);
        
        // Additional metrics if available
        if (connection.saveData !== undefined) {
            this.performance.constructor.recordMetric('network-save-data', connection.saveData);
        }
        
        // Resource timing metrics
        this.collectResourceMetrics();
    }
    
    /**
     * Setup connection change listener
     */
    setupConnectionListener() {
        if (!('connection' in navigator)) return;
        
        this.connectionListener = () => {
            this.collect();
            
            // Emit connection change event
            if (this.performance?.constructor.isEnabled) {
                this.performance.constructor.emitPerformanceEvent('network-change', {
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink,
                    rtt: navigator.connection.rtt
                });
            }
        };
        
        navigator.connection.addEventListener('change', this.connectionListener);
    }
    
    /**
     * Collect resource timing metrics
     */
    collectResourceMetrics() {
        const resources = performance.getEntriesByType('resource');
        if (resources.length === 0) return;
        
        // Group by type
        const resourcesByType = new Map();
        let totalSize = 0;
        let totalDuration = 0;
        
        resources.forEach(resource => {
            const type = resource.initiatorType;
            if (!resourcesByType.has(type)) {
                resourcesByType.set(type, {
                    count: 0,
                    totalDuration: 0,
                    avgDuration: 0
                });
            }
            
            const typeData = resourcesByType.get(type);
            typeData.count++;
            typeData.totalDuration += resource.duration;
            totalDuration += resource.duration;
            
            if (resource.transferSize) {
                totalSize += resource.transferSize;
            }
        });
        
        // Calculate averages
        resourcesByType.forEach((data, type) => {
            data.avgDuration = data.totalDuration / data.count;
            this.performance.constructor.recordMetric(`network-resource-${type}-avg`, data.avgDuration);
        });
        
        this.performance.constructor.recordMetric('network-resources-total', resources.length);
        this.performance.constructor.recordMetric('network-resources-size-kb', totalSize / 1024);
        this.performance.constructor.recordMetric('network-resources-duration-avg', totalDuration / resources.length);
    }
}