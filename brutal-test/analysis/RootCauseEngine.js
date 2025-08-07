/**
 * Root Cause Engine - Intelligent root cause analysis
 */

export class RootCauseEngine {
    constructor() {
        this.patterns = {
            sharedArrayBuffer: {
                symptoms: [
                    /SharedArrayBuffer is not defined/i,
                    /SharedArrayBuffer.* not available/i,
                    /require-corp/i
                ],
                rootCause: 'Cross-Origin Isolation not enabled',
                category: 'configuration',
                fixes: ['Enable COOP/COEP headers', 'Add crossOriginIsolated check']
            },
            
            nullReference: {
                symptoms: [
                    /Cannot read .* of null/i,
                    /Cannot read .* of undefined/i,
                    /is not defined/i
                ],
                rootCause: 'Component or data accessed before initialization',
                category: 'timing',
                fixes: ['Add null checks', 'Ensure proper initialization order', 'Use optional chaining']
            },
            
            memoryLeak: {
                symptoms: [
                    /memory/i,
                    /heap size/i,
                    /out of memory/i
                ],
                indicators: ['increasing memory usage', 'performance degradation over time'],
                rootCause: 'References not being garbage collected',
                category: 'performance',
                fixes: ['Remove event listeners', 'Clear intervals/timeouts', 'Avoid closure leaks']
            },
            
            networkFailure: {
                symptoms: [
                    /Failed to fetch/i,
                    /NetworkError/i,
                    /ERR_NETWORK/i,
                    /CORS/i
                ],
                rootCause: 'Network resource unavailable or blocked',
                category: 'network',
                fixes: ['Check resource URLs', 'Configure CORS', 'Add error handling']
            },
            
            renderingIssue: {
                symptoms: [
                    /paint/i,
                    /layout shift/i,
                    /reflow/i,
                    /WebGL.*lost/i
                ],
                rootCause: 'Inefficient rendering or GPU issues',
                category: 'rendering',
                fixes: ['Optimize render cycles', 'Use CSS containment', 'Handle context loss']
            },
            
            asyncTiming: {
                symptoms: [
                    /Promise.*rejected/i,
                    /async.*error/i,
                    /timeout/i
                ],
                rootCause: 'Asynchronous operation timing issues',
                category: 'async',
                fixes: ['Add proper error handling', 'Increase timeouts', 'Use retry logic']
            },
            
            workerIssue: {
                symptoms: [
                    /Worker.*failed/i,
                    /Worker.*error/i,
                    /postMessage/i
                ],
                rootCause: 'Web Worker communication or initialization failure',
                category: 'worker',
                fixes: ['Check worker file path', 'Validate message data', 'Add worker error handling']
            }
        };
        
        this.correlations = {
            'sharedArrayBuffer + worker': {
                rootCause: 'Workers require SharedArrayBuffer which needs cross-origin isolation',
                priority: 'critical'
            },
            'memory + performance': {
                rootCause: 'Memory leak causing performance degradation',
                priority: 'high'
            },
            'network + timeout': {
                rootCause: 'Slow network causing timeouts',
                priority: 'medium'
            }
        };
    }

    async analyze(testResults) {
        const analysis = {
            rootCauses: [],
            correlations: [],
            timeline: [],
            primaryCause: null,
            affectedAreas: new Set(),
            fixPlan: []
        };

        // Collect all errors and issues
        const allIssues = this.collectAllIssues(testResults);
        
        // Identify root causes for each issue
        for (const issue of allIssues) {
            const rootCause = this.identifyRootCause(issue);
            if (rootCause) {
                analysis.rootCauses.push(rootCause);
                analysis.affectedAreas.add(rootCause.category);
            }
        }

        // Find correlations between issues
        analysis.correlations = this.findCorrelations(analysis.rootCauses);
        
        // Build timeline of events
        analysis.timeline = this.buildTimeline(allIssues);
        
        // Determine primary root cause
        analysis.primaryCause = this.determinePrimaryCause(analysis);
        
        // Generate fix plan
        analysis.fixPlan = this.generateFixPlan(analysis);
        
        return analysis;
    }

    collectAllIssues(testResults) {
        const issues = [];
        
        // Collect errors
        if (testResults.errors) {
            const errors = Array.isArray(testResults.errors) ? testResults.errors : [testResults.errors];
            errors.forEach(error => {
                issues.push({
                    type: 'error',
                    message: error.message || error.text || String(error),
                    source: error.source || 'unknown',
                    timestamp: error.timestamp || Date.now(),
                    data: error
                });
            });
        }
        
        // Collect performance issues
        if (testResults.analysis?.performance?.issues) {
            testResults.analysis.performance.issues.forEach(issue => {
                issues.push({
                    type: 'performance',
                    message: issue.impact,
                    source: 'performance',
                    timestamp: Date.now(),
                    data: issue
                });
            });
        }
        
        // Collect from test results
        if (testResults.tests) {
            testResults.tests.forEach(test => {
                if (test.result?.errors) {
                    test.result.errors.forEach(error => {
                        issues.push({
                            type: 'test',
                            message: error.message,
                            source: test.name,
                            timestamp: error.timestamp || Date.now(),
                            data: error
                        });
                    });
                }
            });
        }
        
        return issues;
    }

    identifyRootCause(issue) {
        const message = issue.message || '';
        
        // Check against known patterns
        for (const [patternName, pattern] of Object.entries(this.patterns)) {
            const matches = pattern.symptoms.some(symptom => symptom.test(message));
            
            if (matches) {
                return {
                    issue: issue.message,
                    pattern: patternName,
                    rootCause: pattern.rootCause,
                    category: pattern.category,
                    fixes: pattern.fixes,
                    confidence: this.calculateConfidence(issue, pattern),
                    timestamp: issue.timestamp,
                    source: issue.source
                };
            }
        }
        
        // If no pattern matches, try to infer
        return this.inferRootCause(issue);
    }

    calculateConfidence(issue, pattern) {
        let confidence = 0.5; // Base confidence
        
        // Multiple symptom matches increase confidence
        const matchCount = pattern.symptoms.filter(s => s.test(issue.message)).length;
        confidence += matchCount * 0.1;
        
        // Recent issues have higher confidence
        const age = Date.now() - (issue.timestamp || 0);
        if (age < 60000) confidence += 0.2; // Less than 1 minute old
        
        // Known sources have higher confidence
        if (issue.source && issue.source !== 'unknown') confidence += 0.1;
        
        return Math.min(confidence, 1.0);
    }

    inferRootCause(issue) {
        // Basic inference rules
        const message = issue.message.toLowerCase();
        
        if (message.includes('null') || message.includes('undefined')) {
            return {
                issue: issue.message,
                pattern: 'inferred',
                rootCause: 'Null reference or uninitialized variable',
                category: 'code',
                fixes: ['Add defensive checks', 'Initialize variables'],
                confidence: 0.3,
                timestamp: issue.timestamp,
                source: issue.source
            };
        }
        
        if (message.includes('timeout') || message.includes('slow')) {
            return {
                issue: issue.message,
                pattern: 'inferred',
                rootCause: 'Performance or timing issue',
                category: 'performance',
                fixes: ['Optimize code', 'Increase timeouts', 'Add loading states'],
                confidence: 0.3,
                timestamp: issue.timestamp,
                source: issue.source
            };
        }
        
        return null;
    }

    findCorrelations(rootCauses) {
        const correlations = [];
        const categories = {};
        
        // Group by category
        rootCauses.forEach(rc => {
            if (!categories[rc.category]) {
                categories[rc.category] = [];
            }
            categories[rc.category].push(rc);
        });
        
        // Check known correlations
        for (const [pattern, correlation] of Object.entries(this.correlations)) {
            const parts = pattern.split(' + ');
            const matches = parts.every(part => 
                rootCauses.some(rc => rc.pattern === part || rc.category === part)
            );
            
            if (matches) {
                correlations.push({
                    pattern,
                    ...correlation,
                    evidence: rootCauses.filter(rc => 
                        parts.includes(rc.pattern) || parts.includes(rc.category)
                    )
                });
            }
        }
        
        // Find temporal correlations
        const timeWindow = 5000; // 5 seconds
        rootCauses.forEach((rc1, i) => {
            rootCauses.slice(i + 1).forEach(rc2 => {
                if (Math.abs(rc1.timestamp - rc2.timestamp) < timeWindow) {
                    correlations.push({
                        type: 'temporal',
                        causes: [rc1, rc2],
                        timeDiff: Math.abs(rc1.timestamp - rc2.timestamp),
                        priority: 'medium'
                    });
                }
            });
        });
        
        return correlations;
    }

    buildTimeline(issues) {
        // Sort by timestamp
        const sorted = issues
            .filter(i => i.timestamp)
            .sort((a, b) => a.timestamp - b.timestamp);
        
        if (sorted.length === 0) return [];
        
        const timeline = [];
        const startTime = sorted[0].timestamp;
        
        sorted.forEach(issue => {
            timeline.push({
                time: issue.timestamp - startTime,
                type: issue.type,
                message: issue.message,
                source: issue.source
            });
        });
        
        return timeline;
    }

    determinePrimaryCause(analysis) {
        if (analysis.rootCauses.length === 0) return null;
        
        // Priority rules
        const priorityMap = {
            configuration: 10,
            critical: 9,
            timing: 8,
            performance: 7,
            network: 6,
            async: 5,
            rendering: 4,
            worker: 3,
            code: 2
        };
        
        // Score each root cause
        const scored = analysis.rootCauses.map(rc => ({
            ...rc,
            score: (priorityMap[rc.category] || 0) * rc.confidence +
                   (analysis.correlations.filter(c => 
                       c.evidence?.includes(rc)).length * 2)
        }));
        
        // Return highest scoring
        return scored.sort((a, b) => b.score - a.score)[0];
    }

    generateFixPlan(analysis) {
        const plan = [];
        const addedFixes = new Set();
        
        // Start with primary cause
        if (analysis.primaryCause) {
            analysis.primaryCause.fixes.forEach(fix => {
                if (!addedFixes.has(fix)) {
                    plan.push({
                        step: plan.length + 1,
                        action: fix,
                        reason: `Fixes primary issue: ${analysis.primaryCause.rootCause}`,
                        priority: 'critical',
                        category: analysis.primaryCause.category
                    });
                    addedFixes.add(fix);
                }
            });
        }
        
        // Add correlated fixes
        analysis.correlations.forEach(correlation => {
            if (correlation.priority === 'critical' || correlation.priority === 'high') {
                const fix = `Address correlated issues: ${correlation.pattern || 'temporal correlation'}`;
                if (!addedFixes.has(fix)) {
                    plan.push({
                        step: plan.length + 1,
                        action: fix,
                        reason: correlation.rootCause || 'Issues are occurring together',
                        priority: correlation.priority,
                        category: 'correlation'
                    });
                    addedFixes.add(fix);
                }
            }
        });
        
        // Add remaining fixes by category priority
        const categoryOrder = ['configuration', 'timing', 'performance', 'network', 'code'];
        
        categoryOrder.forEach(category => {
            const categoryFixes = analysis.rootCauses
                .filter(rc => rc.category === category && rc !== analysis.primaryCause)
                .flatMap(rc => rc.fixes);
            
            categoryFixes.forEach(fix => {
                if (!addedFixes.has(fix)) {
                    plan.push({
                        step: plan.length + 1,
                        action: fix,
                        reason: `Addresses ${category} issues`,
                        priority: 'medium',
                        category
                    });
                    addedFixes.add(fix);
                }
            });
        });
        
        return plan;
    }
}