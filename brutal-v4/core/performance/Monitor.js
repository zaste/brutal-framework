/**
 * BRUTAL V4 - Performance Monitor Core
 * Main performance monitoring class
 * Native Web APIs with zero overhead when disabled
 */

import { ComponentCollector } from './collectors/ComponentCollector.js';
import { MemoryCollector } from './collectors/MemoryCollector.js';
import { DOMCollector } from './collectors/DOMCollector.js';
import { NetworkCollector } from './collectors/NetworkCollector.js';
import { BrutalPerformanceObserver } from './observers/PerformanceObserver.js';

/**
 * BrutalPerformance - Performance monitoring and instrumentation
 * Provides hooks for Phase 2 performance optimizations
 */
export class BrutalPerformance {
    static instance = null;
    static isEnabled = false;
    static collectors = new Map();
    static thresholds = new Map();
    static observers = new Set();
    
    constructor() {
        if (BrutalPerformance.instance) {
            return BrutalPerformance.instance;
        }
        
        this.metrics = new Map();
        this.measurements = [];
        this.timers = new Map();
        this.marks = new Map();
        this.sessions = new Map();
        
        // Performance observer for native metrics
        this.performanceObserver = new BrutalPerformanceObserver(this);
        
        BrutalPerformance.instance = this;
    }
    
    /**
     * Enable performance monitoring
     */
    static enable(options = {}) {
        BrutalPerformance.isEnabled = true;
        
        // Setup default thresholds
        this.setupDefaultThresholds();
        
        // Setup collectors
        this.setupCollectors(options);
        
        // Setup monitoring
        this.setupMonitoring(options);
        
        console.log('[BrutalPerformance] Performance monitoring enabled');
    }
    
    /**
     * Disable performance monitoring
     */
    static disable() {
        BrutalPerformance.isEnabled = false;
        
        // Clear all collections
        this.collectors.clear();
        this.thresholds.clear();
        this.observers.clear();
        
        if (this.instance) {
            this.instance.cleanup();
        }
        
        console.log('[BrutalPerformance] Performance monitoring disabled');
    }
    
    /**
     * Setup default performance thresholds
     */
    static setupDefaultThresholds() {
        this.thresholds.set('component-render', 16); // 16ms (60fps)
        this.thresholds.set('component-init', 100);  // 100ms
        this.thresholds.set('state-update', 5);      // 5ms
        this.thresholds.set('event-handling', 10);   // 10ms
        this.thresholds.set('template-render', 8);   // 8ms
        this.thresholds.set('memory-usage', 50 * 1024 * 1024); // 50MB
        this.thresholds.set('dom-nodes', 10000);     // 10k DOM nodes
    }
    
    /**
     * Setup performance collectors
     */
    static setupCollectors(options) {
        // Component performance collector
        this.collectors.set('components', new ComponentCollector(options.componentInterval || 1000));
        
        // Memory performance collector
        this.collectors.set('memory', new MemoryCollector(options.memoryInterval || 5000));
        
        // DOM performance collector
        this.collectors.set('dom', new DOMCollector(options.domInterval || 2000));
        
        // Network performance collector
        this.collectors.set('network', new NetworkCollector(options.networkInterval || 10000));
        
        // Start collection intervals
        this.startCollectors();
    }
    
    /**
     * Setup monitoring
     */
    static setupMonitoring(options) {
        // Setup memory monitoring
        if (options.memory !== false) {
            this.collectors.get('memory')?.setupMonitoring(this);
        }
        
        // Setup component monitoring
        if (options.components !== false) {
            this.collectors.get('components')?.setupMonitoring(this);
        }
        
        // Setup rendering monitoring
        if (options.rendering !== false) {
            this.setupRenderingMonitoring();
        }
    }
    
    /**
     * Start performance collectors
     */
    static startCollectors() {
        for (const [name, collector] of this.collectors) {
            collector.start();
        }
    }
    
    /**
     * Setup rendering monitoring
     */
    static setupRenderingMonitoring() {
        // Monitor frame timing
        let frameCount = 0;
        let lastFrameTime = performance.now();
        
        const measureFrames = () => {
            const now = performance.now();
            const frameTime = now - lastFrameTime;
            lastFrameTime = now;
            frameCount++;
            
            if (this.isEnabled) {
                this.recordMetric('frame-time', frameTime);
                
                // Calculate FPS every second
                if (frameCount % 60 === 0) {
                    const fps = 1000 / frameTime;
                    this.recordMetric('fps', fps);
                }
            }
            
            requestAnimationFrame(measureFrames);
        };
        
        requestAnimationFrame(measureFrames);
    }
    
    /**
     * Start performance measurement
     */
    static startMeasurement(name, category = 'custom') {
        if (!this.isEnabled) return null;
        
        const startTime = performance.now();
        const markName = `${category}-${name}-start`;
        
        // Create performance mark
        performance.mark(markName);
        
        // Store timer
        const timer = {
            name,
            category,
            startTime,
            markName
        };
        
        this.instance?.timers.set(name, timer);
        
        return timer;
    }
    
    /**
     * End performance measurement
     */
    static endMeasurement(name) {
        if (!this.isEnabled) return null;
        
        const timer = this.instance?.timers.get(name);
        if (!timer) return null;
        
        const endTime = performance.now();
        const duration = endTime - timer.startTime;
        const endMarkName = `${timer.category}-${name}-end`;
        const measureName = `${timer.category}-${name}`;
        
        // Create performance marks and measure
        performance.mark(endMarkName);
        performance.measure(measureName, timer.markName, endMarkName);
        
        // Record metric
        this.recordMetric(`${timer.category}-${name}`, duration);
        
        // Clean up timer
        this.instance?.timers.delete(name);
        
        // Check threshold if exists
        const thresholdKey = `${timer.category}-${name}`;
        const threshold = this.thresholds.get(thresholdKey);
        if (threshold && duration > threshold) {
            this.emitThresholdExceeded(thresholdKey, duration, threshold);
        }
        
        return {
            name,
            category: timer.category,
            duration,
            startTime: timer.startTime,
            endTime
        };
    }
    
    /**
     * Record performance metric
     */
    static recordMetric(name, value, metadata = {}) {
        if (!this.isEnabled) return;
        
        const metric = {
            name,
            value,
            timestamp: Date.now(),
            metadata
        };
        
        // Store in instance
        if (this.instance) {
            if (!this.instance.metrics.has(name)) {
                this.instance.metrics.set(name, []);
            }
            
            const metrics = this.instance.metrics.get(name);
            metrics.push(metric);
            
            // Keep only last 100 measurements per metric
            if (metrics.length > 100) {
                metrics.shift();
            }
        }
        
        // Notify observers
        this.notifyObservers('metric-recorded', metric);
        
        // Emit event
        this.emitPerformanceEvent('metric-recorded', metric);
    }
    
    /**
     * Record component event
     */
    static recordComponentEvent(type, detail) {
        this.recordMetric(`component-${type}`, 1, detail);
    }
    
    /**
     * Emit threshold exceeded event
     */
    static emitThresholdExceeded(metric, value, threshold) {
        this.emitPerformanceEvent('threshold-exceeded', {
            metric,
            value,
            threshold,
            exceeded: value - threshold
        });
    }
    
    /**
     * Emit performance event
     */
    static emitPerformanceEvent(type, detail) {
        const event = new CustomEvent(`brutal:performance:${type}`, {
            detail,
            bubbles: true,
            composed: true
        });
        
        window.dispatchEvent(event);
    }
    
    /**
     * Notify observers
     */
    static notifyObservers(type, data) {
        this.observers.forEach(observer => {
            try {
                observer(type, data);
            } catch (error) {
                console.warn('[BrutalPerformance] Observer failed:', error);
            }
        });
    }
    
    /**
     * Add performance observer
     */
    static addObserver(observer) {
        this.observers.add(observer);
        return () => this.observers.delete(observer);
    }
    
    /**
     * Get performance summary
     */
    static getSummary() {
        if (!this.instance) return null;
        
        const summary = {
            enabled: this.isEnabled,
            metrics: {},
            thresholds: Object.fromEntries(this.thresholds),
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
        
        // Aggregate metrics
        for (const [name, measurements] of this.instance.metrics) {
            if (measurements.length > 0) {
                const values = measurements.map(m => m.value);
                summary.metrics[name] = {
                    count: values.length,
                    avg: values.reduce((a, b) => a + b, 0) / values.length,
                    min: Math.min(...values),
                    max: Math.max(...values),
                    last: values[values.length - 1]
                };
            }
        }
        
        return summary;
    }
    
    /**
     * Get detailed metrics
     */
    static getMetrics() {
        if (!this.instance) return new Map();
        return new Map(this.instance.metrics);
    }
    
    /**
     * Clear all metrics
     */
    static clearMetrics() {
        if (this.instance) {
            this.instance.metrics.clear();
            this.instance.measurements = [];
            this.instance.timers.clear();
            this.instance.marks.clear();
        }
    }
    
    /**
     * Set performance threshold
     */
    static setThreshold(metric, value) {
        this.thresholds.set(metric, value);
    }
    
    /**
     * Cleanup performance monitoring
     */
    cleanup() {
        // Clear intervals
        for (const collector of BrutalPerformance.collectors.values()) {
            collector.stop();
        }
        
        // Disconnect observer
        this.performanceObserver.disconnect();
        
        // Clear data
        this.metrics.clear();
        this.measurements = [];
        this.timers.clear();
        this.marks.clear();
        this.sessions.clear();
    }
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
    // Enable performance monitoring in development
    if (window.BRUTAL_DEBUG || location.hostname === 'localhost') {
        BrutalPerformance.enable({
            components: true,
            memory: true,
            rendering: true
        });
    }
}