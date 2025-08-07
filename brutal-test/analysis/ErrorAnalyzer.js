/**
 * Error Analyzer - Analyzes and classifies errors
 */

export class ErrorAnalyzer {
    constructor() {
        this.patterns = {
            nullReference: /Cannot read prop.* of (null|undefined)/i,
            typeError: /is not a function|is not defined/i,
            syntaxError: /Unexpected token|Invalid or unexpected token/i,
            networkError: /Failed to fetch|NetworkError|ERR_/i,
            securityError: /Blocked by CORS|Content Security Policy/i,
            memoryError: /out of memory|Maximum call stack/i,
            sharedArrayBuffer: /SharedArrayBuffer|not defined|require-corp/i,
            workerError: /Worker|failed to load/i,
            gpuError: /WebGL|WebGPU|context lost/i
        };
        
        this.severityLevels = {
            critical: ['nullReference', 'typeError', 'syntaxError', 'memoryError'],
            high: ['networkError', 'securityError', 'sharedArrayBuffer'],
            medium: ['workerError', 'gpuError'],
            low: []
        };
    }

    async analyze(errors) {
        const analysis = {
            total: errors.length,
            byType: {},
            bySeverity: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            },
            patterns: {},
            recommendations: []
        };
        
        // Flatten errors if nested
        const flatErrors = this.flattenErrors(errors);
        
        // Analyze each error
        for (const error of flatErrors) {
            const classification = this.classifyError(error);
            
            // Count by type
            analysis.byType[classification.type] = (analysis.byType[classification.type] || 0) + 1;
            
            // Count by severity
            analysis.bySeverity[classification.severity]++;
            
            // Pattern matching
            if (classification.pattern) {
                analysis.patterns[classification.pattern] = 
                    (analysis.patterns[classification.pattern] || 0) + 1;
            }
        }
        
        // Generate recommendations
        analysis.recommendations = this.generateRecommendations(analysis);
        
        // Find root causes
        analysis.rootCauses = this.identifyRootCauses(flatErrors);
        
        return analysis;
    }

    flattenErrors(errors) {
        const flat = [];
        
        const flatten = (obj, source = '') => {
            if (Array.isArray(obj)) {
                obj.forEach(item => flatten(item, source));
            } else if (obj && typeof obj === 'object') {
                if (obj.message || obj.error || obj.text) {
                    flat.push({
                        ...obj,
                        source: source || obj.source || 'unknown'
                    });
                } else {
                    Object.entries(obj).forEach(([key, value]) => {
                        flatten(value, key);
                    });
                }
            }
        };
        
        flatten(errors);
        return flat;
    }

    classifyError(error) {
        const classification = {
            type: 'unknown',
            severity: 'low',
            pattern: null,
            category: 'general'
        };
        
        const errorText = error.message || error.text || error.error || '';
        
        // Check against patterns
        for (const [pattern, regex] of Object.entries(this.patterns)) {
            if (regex.test(errorText)) {
                classification.pattern = pattern;
                break;
            }
        }
        
        // Determine severity
        for (const [severity, patterns] of Object.entries(this.severityLevels)) {
            if (patterns.includes(classification.pattern)) {
                classification.severity = severity;
                break;
            }
        }
        
        // Determine type
        if (error.type) {
            classification.type = error.type;
        } else if (classification.pattern) {
            classification.type = classification.pattern;
        } else if (errorText.includes('Error')) {
            classification.type = 'error';
        } else if (errorText.includes('Warning')) {
            classification.type = 'warning';
        }
        
        // Categorize
        if (classification.pattern === 'networkError') {
            classification.category = 'network';
        } else if (classification.pattern === 'securityError') {
            classification.category = 'security';
        } else if (['nullReference', 'typeError', 'syntaxError'].includes(classification.pattern)) {
            classification.category = 'code';
        } else if (['sharedArrayBuffer', 'workerError', 'gpuError'].includes(classification.pattern)) {
            classification.category = 'feature';
        }
        
        return classification;
    }

    generateRecommendations(analysis) {
        const recommendations = [];
        
        // SharedArrayBuffer issues
        if (analysis.patterns.sharedArrayBuffer > 0) {
            recommendations.push({
                title: 'Enable Cross-Origin Isolation',
                description: 'SharedArrayBuffer requires COOP and COEP headers',
                priority: 'high',
                fix: {
                    type: 'server_config',
                    headers: {
                        'Cross-Origin-Opener-Policy': 'same-origin',
                        'Cross-Origin-Embedder-Policy': 'require-corp'
                    }
                }
            });
        }
        
        // Null reference errors
        if (analysis.patterns.nullReference > 5) {
            recommendations.push({
                title: 'Add Null Checks',
                description: 'Multiple null reference errors detected',
                priority: 'critical',
                fix: {
                    type: 'code',
                    suggestion: 'Add optional chaining (?.) and nullish coalescing (??)'
                }
            });
        }
        
        // Network errors
        if (analysis.patterns.networkError > 0) {
            recommendations.push({
                title: 'Check Network Resources',
                description: 'Failed network requests detected',
                priority: 'high',
                fix: {
                    type: 'network',
                    suggestion: 'Verify resource URLs and CORS configuration'
                }
            });
        }
        
        // Memory issues
        if (analysis.patterns.memoryError > 0) {
            recommendations.push({
                title: 'Optimize Memory Usage',
                description: 'Memory errors detected',
                priority: 'critical',
                fix: {
                    type: 'performance',
                    suggestion: 'Check for memory leaks and infinite loops'
                }
            });
        }
        
        return recommendations;
    }

    identifyRootCauses(errors) {
        const rootCauses = [];
        
        // Group errors by similarity
        const groups = this.groupSimilarErrors(errors);
        
        // Analyze each group
        for (const group of groups) {
            if (group.errors.length > 3) {
                const rootCause = {
                    pattern: group.pattern,
                    count: group.errors.length,
                    firstOccurrence: Math.min(...group.errors.map(e => e.timestamp || 0)),
                    locations: [...new Set(group.errors.map(e => e.filename || e.url || 'unknown'))],
                    likelyCase: this.determineLikelyCause(group)
                };
                
                rootCauses.push(rootCause);
            }
        }
        
        return rootCauses.sort((a, b) => b.count - a.count);
    }

    groupSimilarErrors(errors) {
        const groups = new Map();
        
        for (const error of errors) {
            const key = this.getErrorSignature(error);
            
            if (!groups.has(key)) {
                groups.set(key, {
                    pattern: key,
                    errors: []
                });
            }
            
            groups.get(key).errors.push(error);
        }
        
        return Array.from(groups.values());
    }

    getErrorSignature(error) {
        const message = error.message || error.text || '';
        
        // Remove variable parts like line numbers, URLs
        return message
            .replace(/:\d+:\d+/g, '')
            .replace(/https?:\/\/[^\s]+/g, '[URL]')
            .replace(/\d+/g, 'N')
            .trim();
    }

    determineLikelyCause(group) {
        const pattern = group.pattern;
        
        if (pattern.includes('SharedArrayBuffer')) {
            return 'Missing COOP/COEP headers for cross-origin isolation';
        }
        
        if (pattern.includes('null') || pattern.includes('undefined')) {
            return 'Component or data not initialized before use';
        }
        
        if (pattern.includes('fetch') || pattern.includes('Failed to load')) {
            return 'Network resource unavailable or CORS blocked';
        }
        
        if (pattern.includes('memory')) {
            return 'Memory leak or excessive memory usage';
        }
        
        return 'Unknown - requires manual investigation';
    }
}