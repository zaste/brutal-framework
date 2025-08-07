/**
 * BRUTAL V4 - Performance Observer Wrapper
 * Native PerformanceObserver with fallback support
 */

export class BrutalPerformanceObserver {
    constructor(performanceInstance) {
        this.performance = performanceInstance;
        this.observers = new Map();
        
        // Setup observers if available
        if ('PerformanceObserver' in window) {
            this.setupObservers();
        }
    }
    
    /**
     * Setup performance observers
     */
    setupObservers() {
        try {
            // Navigation timing
            this.setupNavigationObserver();
            
            // Resource timing
            this.setupResourceObserver();
            
            // User timing
            this.setupUserTimingObserver();
            
            // Layout shift (Core Web Vitals)
            this.setupLayoutShiftObserver();
            
            // Largest Contentful Paint
            this.setupLCPObserver();
            
            // First Input Delay
            this.setupFIDObserver();
            
        } catch (error) {
            console.warn('[BrutalPerformanceObserver] Setup failed:', error);
        }
    }
    
    /**
     * Setup navigation observer
     */
    setupNavigationObserver() {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.recordNavigation(entry);
            }
        });
        
        try {
            observer.observe({ entryTypes: ['navigation'] });
            this.observers.set('navigation', observer);
        } catch (e) {
            // Navigation timing might not be supported
        }
    }
    
    /**
     * Setup resource observer
     */
    setupResourceObserver() {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.recordResource(entry);
            }
        });
        
        observer.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', observer);
    }
    
    /**
     * Setup user timing observer
     */
    setupUserTimingObserver() {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.recordUserTiming(entry);
            }
        });
        
        observer.observe({ entryTypes: ['mark', 'measure'] });
        this.observers.set('userTiming', observer);
    }
    
    /**
     * Setup layout shift observer
     */
    setupLayoutShiftObserver() {
        if (!('LayoutShift' in window)) return;
        
        const observer = new PerformanceObserver((list) => {
            let cls = 0;
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    cls += entry.value;
                }
            }
            this.recordMetric('cls', cls);
        });
        
        try {
            observer.observe({ entryTypes: ['layout-shift'] });
            this.observers.set('layoutShift', observer);
        } catch (e) {
            // Layout shift might not be supported
        }
    }
    
    /**
     * Setup LCP observer
     */
    setupLCPObserver() {
        if (!('LargestContentfulPaint' in window)) return;
        
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.recordMetric('lcp', lastEntry.renderTime || lastEntry.loadTime);
        });
        
        try {
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.set('lcp', observer);
        } catch (e) {
            // LCP might not be supported
        }
    }
    
    /**
     * Setup FID observer
     */
    setupFIDObserver() {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-input') {
                    this.recordMetric('fid', entry.processingStart - entry.startTime);
                    break;
                }
            }
        });
        
        try {
            observer.observe({ entryTypes: ['first-input'] });
            this.observers.set('fid', observer);
        } catch (e) {
            // FID might not be supported
        }
    }
    
    /**
     * Record navigation performance
     */
    recordNavigation(entry) {
        const metrics = {
            'navigation-duration': entry.duration,
            'dom-interactive': entry.domInteractive,
            'dom-content-loaded': entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            'load-complete': entry.loadEventEnd - entry.loadEventStart,
            'time-to-first-byte': entry.responseStart - entry.requestStart
        };
        
        Object.entries(metrics).forEach(([name, value]) => {
            this.recordMetric(name, value);
        });
    }
    
    /**
     * Record resource performance
     */
    recordResource(entry) {
        this.recordMetric('resource-duration', entry.duration, {
            name: entry.name,
            type: entry.initiatorType,
            size: entry.transferSize || 0
        });
    }
    
    /**
     * Record user timing
     */
    recordUserTiming(entry) {
        this.recordMetric(`user-timing-${entry.entryType}`, entry.duration || 0, {
            name: entry.name
        });
    }
    
    /**
     * Record metric through performance instance
     */
    recordMetric(name, value, metadata) {
        if (this.performance.constructor.isEnabled) {
            this.performance.constructor.recordMetric(name, value, metadata);
        }
    }
    
    /**
     * Disconnect all observers
     */
    disconnect() {
        for (const observer of this.observers.values()) {
            observer.disconnect();
        }
        this.observers.clear();
    }
}