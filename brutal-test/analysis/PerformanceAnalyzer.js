/**
 * Performance Analyzer - Deep performance analysis and bottleneck detection
 */

export class PerformanceAnalyzer {
    constructor() {
        this.thresholds = {
            FCP: { good: 1000, moderate: 1800, poor: 3000 },
            LCP: { good: 2500, moderate: 4000, poor: 6000 },
            TBT: { good: 200, moderate: 300, poor: 600 },
            CLS: { good: 0.1, moderate: 0.25, poor: 0.5 },
            FID: { good: 100, moderate: 300, poor: 500 },
            INP: { good: 200, moderate: 500, poor: 1000 },
            TTFB: { good: 800, moderate: 1800, poor: 3000 },
            FPS: { good: 60, moderate: 30, poor: 15 },
            memory: { good: 50, moderate: 100, poor: 200 } // MB
        };
    }

    async analyze(performanceData) {
        const analysis = {
            metrics: {},
            scores: {},
            issues: [],
            bottlenecks: [],
            trends: {},
            recommendations: []
        };

        // Extract and analyze metrics
        if (performanceData.observations) {
            analysis.metrics = this.extractMetrics(performanceData.observations);
        }

        if (performanceData.runtime && performanceData.runtime.length > 0) {
            analysis.trends = this.analyzeRuntimeTrends(performanceData.runtime);
        }

        // Calculate scores
        analysis.scores = this.calculateScores(analysis.metrics);

        // Identify issues
        analysis.issues = this.identifyIssues(analysis.metrics, analysis.trends);

        // Find bottlenecks
        analysis.bottlenecks = this.findBottlenecks(performanceData);

        // Generate recommendations
        analysis.recommendations = this.generateRecommendations(analysis);

        // Overall performance grade
        analysis.grade = this.calculateGrade(analysis.scores);

        return analysis;
    }

    extractMetrics(observations) {
        const metrics = {
            FCP: 0,
            LCP: 0,
            TBT: 0,
            CLS: 0,
            FID: 0,
            TTFB: 0,
            domContentLoaded: 0,
            load: 0,
            resourceCount: 0,
            resourceSize: 0,
            averageFPS: 0,
            minFPS: 999,
            maxFPS: 0,
            jsHeapSize: 0,
            layoutShifts: 0,
            longTasks: 0,
            blockingTime: 0
        };

        // Navigation timing
        if (observations.navigation) {
            const nav = observations.navigation;
            metrics.TTFB = nav.responseStart - nav.fetchStart;
            metrics.domContentLoaded = nav.domContentLoadedEventEnd - nav.fetchStart;
            metrics.load = nav.loadEventEnd - nav.fetchStart;
        }

        // Paint timing
        if (observations.paint) {
            metrics.FCP = observations.paint['first-contentful-paint'] || 0;
            // LCP would come from PerformanceObserver
        }

        // Long tasks (TBT)
        if (observations.longtasks && Array.isArray(observations.longtasks)) {
            metrics.longTasks = observations.longtasks.length;
            metrics.TBT = observations.longtasks.reduce((total, task) => 
                total + Math.max(0, task.duration - 50), 0
            );
            metrics.blockingTime = observations.longtasks.reduce((total, task) => 
                total + task.duration, 0
            );
        }

        // Layout shifts (CLS)
        if (observations.layout && Array.isArray(observations.layout)) {
            metrics.layoutShifts = observations.layout.length;
            metrics.CLS = observations.layout.reduce((total, shift) => 
                total + shift.value, 0
            );
        }

        // FPS
        if (observations.fps && Array.isArray(observations.fps)) {
            const fpsValues = observations.fps.map(f => f.fps);
            if (fpsValues.length > 0) {
                metrics.averageFPS = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
                metrics.minFPS = Math.min(...fpsValues);
                metrics.maxFPS = Math.max(...fpsValues);
            }
        }

        // Resources
        if (observations.resources && Array.isArray(observations.resources)) {
            metrics.resourceCount = observations.resources.length;
            metrics.resourceSize = observations.resources.reduce((total, resource) => 
                total + (resource.encodedBodySize || 0), 0
            );
        }

        return metrics;
    }

    analyzeRuntimeTrends(runtimeData) {
        const trends = {
            memory: { increasing: false, rate: 0, leak: false },
            fps: { stable: true, drops: 0 },
            cpu: { average: 0, spikes: 0 }
        };

        if (runtimeData.length < 2) return trends;

        // Memory trend analysis
        const memoryData = runtimeData
            .filter(d => d.metrics && d.metrics.JSHeapUsedSize)
            .map(d => ({
                time: d.timestamp,
                size: d.metrics.JSHeapUsedSize
            }));

        if (memoryData.length > 1) {
            const first = memoryData[0];
            const last = memoryData[memoryData.length - 1];
            const growth = last.size - first.size;
            const duration = last.time - first.time;
            
            trends.memory.rate = growth / duration * 1000; // bytes per second
            trends.memory.increasing = growth > 0;
            
            // Simple leak detection: consistent growth over time
            const growthRate = growth / first.size;
            trends.memory.leak = growthRate > 0.5 && duration > 30000; // 50% growth over 30s
        }

        // FPS stability
        const fpsDrops = runtimeData.filter(d => 
            d.metrics && d.metrics.FPS && d.metrics.FPS < 30
        );
        trends.fps.drops = fpsDrops.length;
        trends.fps.stable = fpsDrops.length < runtimeData.length * 0.1; // Less than 10% drops

        return trends;
    }

    calculateScores(metrics) {
        const scores = {};
        
        // Calculate individual metric scores (0-100)
        for (const [metric, value] of Object.entries(metrics)) {
            if (this.thresholds[metric]) {
                scores[metric] = this.getMetricScore(metric, value);
            }
        }

        // Calculate category scores
        scores.loading = Math.round((scores.FCP || 0) + (scores.TTFB || 0)) / 2;
        scores.interactivity = Math.round((scores.TBT || 0) + (scores.FID || 0)) / 2;
        scores.stability = scores.CLS || 0;
        scores.smoothness = scores.FPS || 0;

        // Overall score (weighted average)
        scores.overall = Math.round(
            scores.loading * 0.25 +
            scores.interactivity * 0.25 +
            scores.stability * 0.25 +
            scores.smoothness * 0.25
        );

        return scores;
    }

    getMetricScore(metric, value) {
        const threshold = this.thresholds[metric];
        if (!threshold) return 50;

        // For metrics where lower is better (most timing metrics)
        if (['FCP', 'LCP', 'TBT', 'CLS', 'FID', 'INP', 'TTFB'].includes(metric)) {
            if (value <= threshold.good) return 100;
            if (value <= threshold.moderate) return 50 + 50 * (threshold.moderate - value) / (threshold.moderate - threshold.good);
            if (value <= threshold.poor) return 50 * (threshold.poor - value) / (threshold.poor - threshold.moderate);
            return 0;
        }
        
        // For metrics where higher is better (FPS)
        if (metric === 'FPS') {
            if (value >= threshold.good) return 100;
            if (value >= threshold.moderate) return 50 + 50 * (value - threshold.moderate) / (threshold.good - threshold.moderate);
            if (value >= threshold.poor) return 50 * (value - threshold.poor) / (threshold.moderate - threshold.poor);
            return 0;
        }

        return 50;
    }

    identifyIssues(metrics, trends) {
        const issues = [];

        // Check each metric against thresholds
        for (const [metric, value] of Object.entries(metrics)) {
            const threshold = this.thresholds[metric];
            if (!threshold) continue;

            let severity = null;
            if (['FCP', 'LCP', 'TBT', 'CLS', 'FID', 'INP', 'TTFB'].includes(metric)) {
                if (value > threshold.poor) severity = 'critical';
                else if (value > threshold.moderate) severity = 'warning';
            } else if (metric === 'FPS') {
                if (value < threshold.poor) severity = 'critical';
                else if (value < threshold.moderate) severity = 'warning';
            }

            if (severity) {
                issues.push({
                    metric,
                    value,
                    threshold: threshold[severity === 'critical' ? 'poor' : 'moderate'],
                    severity,
                    impact: this.getImpactDescription(metric, severity)
                });
            }
        }

        // Check trends
        if (trends.memory?.leak) {
            issues.push({
                metric: 'memory',
                type: 'leak',
                severity: 'critical',
                rate: trends.memory.rate,
                impact: 'Memory leak detected - will cause performance degradation and crashes'
            });
        }

        if (trends.fps && !trends.fps.stable) {
            issues.push({
                metric: 'fps',
                type: 'instability',
                severity: 'warning',
                drops: trends.fps.drops,
                impact: 'Frame rate instability - causes janky user experience'
            });
        }

        return issues;
    }

    findBottlenecks(performanceData) {
        const bottlenecks = [];

        // Long task analysis
        if (performanceData.observations?.longtasks) {
            const longTasks = performanceData.observations.longtasks;
            if (longTasks.length > 5) {
                bottlenecks.push({
                    type: 'javascript',
                    severity: 'high',
                    description: `${longTasks.length} long tasks blocking main thread`,
                    totalBlockingTime: longTasks.reduce((sum, task) => sum + task.duration, 0),
                    suggestion: 'Break up long-running JavaScript into smaller chunks'
                });
            }
        }

        // Resource loading
        if (performanceData.observations?.resources) {
            const resources = performanceData.observations.resources;
            const slowResources = resources.filter(r => r.duration > 1000);
            
            if (slowResources.length > 0) {
                bottlenecks.push({
                    type: 'network',
                    severity: 'medium',
                    description: `${slowResources.length} slow resources`,
                    resources: slowResources.map(r => ({
                        url: r.name,
                        duration: r.duration,
                        size: r.encodedBodySize
                    })),
                    suggestion: 'Optimize resource loading with compression, CDN, or lazy loading'
                });
            }

            // Large resources
            const largeResources = resources.filter(r => r.encodedBodySize > 500000); // 500KB
            if (largeResources.length > 0) {
                bottlenecks.push({
                    type: 'payload',
                    severity: 'medium',
                    description: `${largeResources.length} large resources`,
                    totalSize: largeResources.reduce((sum, r) => sum + r.encodedBodySize, 0),
                    suggestion: 'Reduce payload size with compression, minification, or code splitting'
                });
            }
        }

        // Layout shifts
        if (performanceData.observations?.layout?.length > 10) {
            bottlenecks.push({
                type: 'layout',
                severity: 'high',
                description: 'Excessive layout shifts detected',
                count: performanceData.observations.layout.length,
                suggestion: 'Reserve space for dynamic content and avoid inserting content above existing content'
            });
        }

        return bottlenecks;
    }

    generateRecommendations(analysis) {
        const recommendations = [];

        // Based on scores
        if (analysis.scores.loading < 50) {
            recommendations.push({
                category: 'loading',
                priority: 'high',
                title: 'Improve Initial Load Performance',
                suggestions: [
                    'Implement code splitting to reduce initial bundle size',
                    'Use resource hints (preconnect, prefetch) for critical resources',
                    'Enable text compression (gzip/brotli)',
                    'Optimize server response time'
                ]
            });
        }

        if (analysis.scores.interactivity < 50) {
            recommendations.push({
                category: 'interactivity',
                priority: 'high',
                title: 'Enhance Interactivity',
                suggestions: [
                    'Break up long tasks using requestIdleCallback',
                    'Implement web workers for heavy computations',
                    'Defer non-critical JavaScript',
                    'Use passive event listeners'
                ]
            });
        }

        if (analysis.scores.stability < 50) {
            recommendations.push({
                category: 'stability',
                priority: 'high',
                title: 'Improve Visual Stability',
                suggestions: [
                    'Always include size attributes on images and videos',
                    'Reserve space for ad slots',
                    'Avoid inserting content above existing content',
                    'Use CSS transforms instead of layout properties for animations'
                ]
            });
        }

        // Based on specific issues
        analysis.issues.forEach(issue => {
            if (issue.metric === 'memory' && issue.type === 'leak') {
                recommendations.push({
                    category: 'memory',
                    priority: 'critical',
                    title: 'Fix Memory Leak',
                    suggestions: [
                        'Remove event listeners when components unmount',
                        'Clear timers and intervals',
                        'Avoid storing references to DOM elements',
                        'Use WeakMap/WeakSet for object references'
                    ]
                });
            }
        });

        return recommendations;
    }

    calculateGrade(scores) {
        const overall = scores.overall || 0;
        
        if (overall >= 90) return 'A';
        if (overall >= 80) return 'B';
        if (overall >= 70) return 'C';
        if (overall >= 60) return 'D';
        return 'F';
    }

    getImpactDescription(metric, severity) {
        const impacts = {
            FCP: {
                warning: 'Users perceive slow initial load',
                critical: 'Users likely to abandon due to slow load'
            },
            TBT: {
                warning: 'Page feels sluggish during load',
                critical: 'Page is unresponsive during load'
            },
            CLS: {
                warning: 'Content jumps are annoying users',
                critical: 'Severe layout shifts make page unusable'
            },
            FPS: {
                warning: 'Animations and scrolling feel janky',
                critical: 'Severe performance issues, unusable experience'
            }
        };

        return impacts[metric]?.[severity] || `${metric} is outside acceptable range`;
    }
}