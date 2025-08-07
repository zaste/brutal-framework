/**
 * BRUTAL V4 - Component Performance Collector
 * Monitors component lifecycle and performance metrics
 */

export class ComponentCollector {
    constructor(interval = 1000) {
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
    }
    
    /**
     * Stop collecting metrics
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    /**
     * Collect component metrics
     */
    collect() {
        if (!this.performance?.constructor.isEnabled) return;
        
        const components = document.querySelectorAll('*').length;
        const brutalComponents = document.querySelectorAll('[is-brutal-component]').length;
        
        this.performance.constructor.recordMetric('dom-nodes-total', components);
        this.performance.constructor.recordMetric('brutal-components-total', brutalComponents);
        
        // Check DOM nodes threshold
        const threshold = this.performance.constructor.thresholds.get('dom-nodes');
        if (threshold && components > threshold) {
            this.performance.constructor.emitThresholdExceeded('dom-nodes', components, threshold);
        }
    }
    
    /**
     * Setup component monitoring
     */
    setupMonitoring(performanceClass) {
        this.performance = performanceClass;
        
        // Listen for component events
        window.addEventListener('brutal:component:created', (event) => {
            performanceClass.recordComponentEvent('created', event.detail);
        });
        
        window.addEventListener('brutal:component:rendered', (event) => {
            performanceClass.recordComponentEvent('rendered', event.detail);
        });
        
        window.addEventListener('brutal:component:destroyed', (event) => {
            performanceClass.recordComponentEvent('destroyed', event.detail);
        });
        
        window.addEventListener('brutal:render', (event) => {
            const { renderTime } = event.detail;
            performanceClass.recordMetric('component-render', renderTime);
            
            // Check threshold
            const threshold = performanceClass.thresholds.get('component-render');
            if (threshold && renderTime > threshold) {
                performanceClass.emitThresholdExceeded('component-render', renderTime, threshold);
            }
        });
    }
}