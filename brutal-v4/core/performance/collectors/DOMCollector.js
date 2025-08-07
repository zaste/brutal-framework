/**
 * BRUTAL V4 - DOM Performance Collector
 * Monitors DOM node counts and Shadow DOM usage
 */

export class DOMCollector {
    constructor(interval = 2000) {
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
     * Collect DOM metrics
     */
    collect() {
        if (!this.performance?.constructor.isEnabled) return;
        
        const elements = document.querySelectorAll('*');
        const shadowRoots = Array.from(elements).filter(el => el.shadowRoot).length;
        const customElements = Array.from(elements).filter(el => el.tagName.includes('-')).length;
        
        this.performance.constructor.recordMetric('dom-elements', elements.length);
        this.performance.constructor.recordMetric('shadow-roots', shadowRoots);
        this.performance.constructor.recordMetric('custom-elements', customElements);
        
        // Detailed analysis
        this.collectDetailedMetrics(elements);
    }
    
    /**
     * Collect detailed DOM metrics
     */
    collectDetailedMetrics(elements) {
        const depths = new Map();
        let maxDepth = 0;
        
        // Calculate DOM depth
        elements.forEach(el => {
            let depth = 0;
            let current = el;
            while (current.parentElement) {
                depth++;
                current = current.parentElement;
            }
            maxDepth = Math.max(maxDepth, depth);
            depths.set(el, depth);
        });
        
        this.performance.constructor.recordMetric('dom-max-depth', maxDepth);
        
        // Count element types
        const elementTypes = new Map();
        elements.forEach(el => {
            const tagName = el.tagName.toLowerCase();
            elementTypes.set(tagName, (elementTypes.get(tagName) || 0) + 1);
        });
        
        // Find most common elements
        const sortedTypes = Array.from(elementTypes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        this.performance.constructor.recordMetric('dom-top-elements', sortedTypes, {
            types: Object.fromEntries(sortedTypes)
        });
    }
}