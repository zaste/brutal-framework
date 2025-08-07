/**
 * Performance Capture - Comprehensive performance metrics collection
 */

export class PerformanceCapture {
    constructor() {
        this.page = null;
        this.cdp = null;
        this.metrics = {
            navigation: {},
            resources: [],
            runtime: [],
            memory: [],
            fps: [],
            longtasks: [],
            userTiming: {},
            paint: {},
            layout: []
        };
        this.isCapturing = false;
        this.startTime = null;
    }

    async attach(page, cdp) {
        this.page = page;
        this.cdp = cdp;
        
        // CDP is required for performance metrics
        if (!this.cdp) {
            throw new Error('BRUTAL: CDP REQUIRED for performance metrics - this is not optional!');
        }
        
        await this.setupCDPMetrics();
        
        // Inject performance monitoring
        await this.injectPerformanceMonitor();
    }

    async setupCDPMetrics() {
        if (!this.cdp) return;

        // Enable performance domain
        await this.cdp.send('Performance.enable');
        
        // Enable runtime for memory metrics
        await this.cdp.send('Runtime.enable');
        
        // Enable rendering events
        await this.cdp.send('DOM.enable');
        await this.cdp.send('CSS.enable');
        
        // Collect performance metrics periodically
        this.metricsInterval = setInterval(async () => {
            if (this.isCapturing) {
                await this.collectCDPMetrics();
            }
        }, 100); // Every 100ms
    }

    async collectCDPMetrics() {
        try {
            // Get performance metrics
            const { metrics } = await this.cdp.send('Performance.getMetrics');
            
            this.metrics.runtime.push({
                timestamp: Date.now(),
                metrics: metrics.reduce((acc, metric) => {
                    acc[metric.name] = metric.value;
                    return acc;
                }, {})
            });

            // Get memory info
            const { result } = await this.cdp.send('Runtime.evaluate', {
                expression: 'performance.memory',
                returnByValue: true
            });
            
            if (result.value) {
                this.metrics.memory.push({
                    timestamp: Date.now(),
                    ...result.value
                });
            }
        } catch (error) {
            // Silently fail - metrics collection shouldn't break tests
        }
    }

    async injectPerformanceMonitor() {
        await this.page.evaluateOnNewDocument(() => {
            window.__BRUTAL_PERFORMANCE__ = {
                startTime: performance.now(),
                marks: {},
                measures: {},
                observations: {
                    navigation: [],
                    resources: [],
                    paint: [],
                    longtasks: [],
                    layout: [],
                    fps: []
                }
            };

            // FPS monitoring
            let lastTime = performance.now();
            let frameCount = 0;
            const measureFPS = () => {
                frameCount++;
                const currentTime = performance.now();
                const elapsed = currentTime - lastTime;
                
                if (elapsed >= 1000) {
                    window.__BRUTAL_PERFORMANCE__.observations.fps.push({
                        timestamp: currentTime,
                        fps: Math.round((frameCount * 1000) / elapsed)
                    });
                    frameCount = 0;
                    lastTime = currentTime;
                }
                
                requestAnimationFrame(measureFPS);
            };
            requestAnimationFrame(measureFPS);

            // Navigation timing
            if (performance.getEntriesByType) {
                window.addEventListener('load', () => {
                    const navTiming = performance.getEntriesByType('navigation')[0];
                    if (navTiming) {
                        window.__BRUTAL_PERFORMANCE__.observations.navigation = navTiming;
                    }
                });
            }

            // Performance Observer
            if (window.PerformanceObserver) {
                // Long tasks
                try {
                    const longTaskObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            window.__BRUTAL_PERFORMANCE__.observations.longtasks.push({
                                startTime: entry.startTime,
                                duration: entry.duration,
                                name: entry.name
                            });
                        }
                    });
                    longTaskObserver.observe({ entryTypes: ['longtask'] });
                } catch (e) {
                    throw new Error(`BRUTAL: Long task observer failed - ${e.message}`);
                }

                // Resources
                try {
                    const resourceObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            window.__BRUTAL_PERFORMANCE__.observations.resources.push({
                                name: entry.name,
                                type: entry.initiatorType,
                                startTime: entry.startTime,
                                duration: entry.duration,
                                transferSize: entry.transferSize,
                                encodedBodySize: entry.encodedBodySize,
                                decodedBodySize: entry.decodedBodySize
                            });
                        }
                    });
                    resourceObserver.observe({ entryTypes: ['resource'] });
                } catch (e) {
                    throw new Error(`BRUTAL: Long task observer failed - ${e.message}`);
                }

                // Paint timing
                try {
                    const paintObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            window.__BRUTAL_PERFORMANCE__.observations.paint[entry.name] = entry.startTime;
                        }
                    });
                    paintObserver.observe({ entryTypes: ['paint'] });
                } catch (e) {
                    throw new Error(`BRUTAL: Long task observer failed - ${e.message}`);
                }

                // Layout shifts (CLS)
                try {
                    const layoutObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            window.__BRUTAL_PERFORMANCE__.observations.layout.push({
                                startTime: entry.startTime,
                                value: entry.value,
                                sources: entry.sources
                            });
                        }
                    });
                    layoutObserver.observe({ entryTypes: ['layout-shift'] });
                } catch (e) {
                    throw new Error(`BRUTAL: Long task observer failed - ${e.message}`);
                }
            }

            // Override performance.mark and measure
            const originalMark = performance.mark.bind(performance);
            const originalMeasure = performance.measure.bind(performance);

            performance.mark = function(name, options) {
                window.__BRUTAL_PERFORMANCE__.marks[name] = performance.now();
                return originalMark(name, options);
            };

            performance.measure = function(name, start, end) {
                const measure = originalMeasure(name, start, end);
                window.__BRUTAL_PERFORMANCE__.measures[name] = {
                    start: window.__BRUTAL_PERFORMANCE__.marks[start] || 0,
                    end: window.__BRUTAL_PERFORMANCE__.marks[end] || performance.now(),
                    duration: (window.__BRUTAL_PERFORMANCE__.marks[end] || performance.now()) - 
                             (window.__BRUTAL_PERFORMANCE__.marks[start] || 0)
                };
                return measure;
            };
        });
    }

    async start() {
        this.isCapturing = true;
        this.startTime = Date.now();
        
        // Clear previous metrics
        this.metrics = {
            navigation: {},
            resources: [],
            runtime: [],
            memory: [],
            fps: [],
            longtasks: [],
            userTiming: {},
            paint: {},
            layout: []
        };
        
        // Start coverage if available
        if (this.page.coverage) {
            try {
                await this.page.coverage.startJSCoverage();
                await this.page.coverage.startCSSCoverage();
            } catch (error) {
                // Coverage might already be started
                throw new Error(`BRUTAL: Coverage conflict - ${error.message}`);
            }
        }
        
        return { status: 'capturing' };
    }

    async stop() {
        this.isCapturing = false;
        
        // Collect page metrics
        const pageMetrics = await this.page.evaluate(() => {
            return window.__BRUTAL_PERFORMANCE__ || {};
        });
        
        // Get coverage if available
        let coverage = null;
        if (this.page.coverage) {
            try {
                const [jsCoverage, cssCoverage] = await Promise.all([
                    this.page.coverage.stopJSCoverage(),
                    this.page.coverage.stopCSSCoverage()
                ]);
                coverage = { js: jsCoverage, css: cssCoverage };
            } catch (error) {
                throw new Error(`BRUTAL: Coverage collection FAILED - ${error.message}`);
            }
        }
        
        // Calculate key metrics
        const analysis = this.analyzeMetrics(pageMetrics);
        
        return {
            duration: Date.now() - this.startTime,
            observations: pageMetrics.observations || {},
            marks: pageMetrics.marks || {},
            measures: pageMetrics.measures || {},
            runtime: this.metrics.runtime,
            memory: this.metrics.memory,
            coverage,
            analysis,
            summary: this.generateSummary(pageMetrics, analysis)
        };
    }

    analyzeMetrics(pageMetrics) {
        const analysis = {
            loadTime: 0,
            firstPaint: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            timeToInteractive: 0,
            totalBlockingTime: 0,
            cumulativeLayoutShift: 0,
            averageFPS: 0,
            memoryLeaks: false,
            performanceScore: 100
        };
        
        // Navigation timing
        if (pageMetrics.observations?.navigation) {
            const nav = pageMetrics.observations.navigation;
            analysis.loadTime = nav.loadEventEnd - nav.fetchStart;
            analysis.domContentLoaded = nav.domContentLoadedEventEnd - nav.fetchStart;
            analysis.timeToFirstByte = nav.responseStart - nav.fetchStart;
        }
        
        // Paint timing
        if (pageMetrics.observations?.paint) {
            analysis.firstPaint = pageMetrics.observations.paint['first-paint'] || 0;
            analysis.firstContentfulPaint = pageMetrics.observations.paint['first-contentful-paint'] || 0;
        }
        
        // Long tasks (TBT)
        if (pageMetrics.observations?.longtasks) {
            analysis.totalBlockingTime = pageMetrics.observations.longtasks
                .reduce((total, task) => total + Math.max(0, task.duration - 50), 0);
        }
        
        // Layout shifts (CLS)
        if (pageMetrics.observations?.layout) {
            analysis.cumulativeLayoutShift = pageMetrics.observations.layout
                .reduce((total, shift) => total + shift.value, 0);
        }
        
        // FPS
        if (pageMetrics.observations?.fps?.length > 0) {
            const fpsValues = pageMetrics.observations.fps.map(f => f.fps);
            analysis.averageFPS = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
            analysis.minFPS = Math.min(...fpsValues);
            analysis.maxFPS = Math.max(...fpsValues);
        }
        
        // Memory leak detection
        if (this.metrics.memory.length > 2) {
            const firstMem = this.metrics.memory[0];
            const lastMem = this.metrics.memory[this.metrics.memory.length - 1];
            const memoryGrowth = lastMem.usedJSHeapSize - firstMem.usedJSHeapSize;
            const growthRate = memoryGrowth / firstMem.usedJSHeapSize;
            
            // Flag potential leak if memory grew by more than 50%
            analysis.memoryLeaks = growthRate > 0.5;
            analysis.memoryGrowth = {
                absolute: memoryGrowth,
                percentage: (growthRate * 100).toFixed(2)
            };
        }
        
        // Calculate performance score (simplified)
        let score = 100;
        if (analysis.firstContentfulPaint > 1800) score -= 20;
        if (analysis.timeToInteractive > 3800) score -= 20;
        if (analysis.totalBlockingTime > 300) score -= 20;
        if (analysis.cumulativeLayoutShift > 0.1) score -= 20;
        if (analysis.averageFPS < 30) score -= 20;
        
        analysis.performanceScore = Math.max(0, score);
        
        return analysis;
    }

    generateSummary(pageMetrics, analysis) {
        const summary = {
            score: analysis.performanceScore,
            metrics: {
                FCP: `${analysis.firstContentfulPaint.toFixed(0)}ms`,
                TBT: `${analysis.totalBlockingTime.toFixed(0)}ms`,
                CLS: analysis.cumulativeLayoutShift.toFixed(3),
                FPS: `${analysis.averageFPS.toFixed(0)} avg`
            },
            issues: []
        };
        
        // Identify issues
        if (analysis.firstContentfulPaint > 1800) {
            summary.issues.push({
                type: 'slow_fcp',
                message: 'First Contentful Paint is too slow',
                value: analysis.firstContentfulPaint,
                threshold: 1800
            });
        }
        
        if (analysis.totalBlockingTime > 300) {
            summary.issues.push({
                type: 'high_tbt',
                message: 'Total Blocking Time is too high',
                value: analysis.totalBlockingTime,
                threshold: 300
            });
        }
        
        if (analysis.cumulativeLayoutShift > 0.1) {
            summary.issues.push({
                type: 'high_cls',
                message: 'Cumulative Layout Shift is too high',
                value: analysis.cumulativeLayoutShift,
                threshold: 0.1
            });
        }
        
        if (analysis.averageFPS < 30) {
            summary.issues.push({
                type: 'low_fps',
                message: 'Frame rate is below acceptable threshold',
                value: analysis.averageFPS,
                threshold: 30
            });
        }
        
        if (analysis.memoryLeaks) {
            summary.issues.push({
                type: 'memory_leak',
                message: 'Potential memory leak detected',
                growth: analysis.memoryGrowth
            });
        }
        
        return summary;
    }

    cleanup() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
    }
}