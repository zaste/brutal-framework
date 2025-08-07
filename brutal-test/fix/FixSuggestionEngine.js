/**
 * Fix Suggestion Engine - Generates intelligent fix suggestions
 */

export class FixSuggestionEngine {
    constructor() {
        this.fixTemplates = {
            sharedArrayBuffer: {
                title: 'Enable Cross-Origin Isolation',
                description: 'SharedArrayBuffer requires specific headers for security',
                fixes: [
                    {
                        type: 'server_config',
                        file: 'server.js',
                        code: `// Add these headers to your server
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    next();
});`,
                        priority: 'critical'
                    },
                    {
                        type: 'code',
                        file: 'index.js',
                        code: `// BRUTAL: SharedArrayBuffer MUST be available
if (typeof SharedArrayBuffer === 'undefined') {
    throw new Error('BRUTAL: SharedArrayBuffer NOT AVAILABLE - THIS IS UNACCEPTABLE!');
}`,
                        priority: 'high'
                    }
                ]
            },
            
            nullReference: {
                title: 'Fix Null Reference Errors',
                description: 'Add defensive programming practices',
                fixes: [
                    {
                        type: 'code',
                        pattern: /Cannot read .* of (null|undefined)/,
                        suggestion: 'Use optional chaining (?.)',
                        example: `// Instead of:
obj.property.method()

// Use:
obj?.property?.method()`,
                        priority: 'high'
                    },
                    {
                        type: 'code',
                        suggestion: 'Add null checks',
                        example: `// Add defensive check:
if (obj && obj.property) {
    obj.property.method();
}`,
                        priority: 'medium'
                    }
                ]
            },
            
            memoryLeak: {
                title: 'Fix Memory Leaks',
                description: 'Prevent memory from growing unbounded',
                fixes: [
                    {
                        type: 'code',
                        suggestion: 'Remove event listeners on cleanup',
                        example: `// In component cleanup:
componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    clearInterval(this.intervalId);
    clearTimeout(this.timeoutId);
}`,
                        priority: 'critical'
                    },
                    {
                        type: 'code',
                        suggestion: 'Use WeakMap for object references',
                        example: `// Instead of Map:
const cache = new WeakMap();

// This allows garbage collection when key is removed`,
                        priority: 'high'
                    }
                ]
            },
            
            performance: {
                title: 'Optimize Performance',
                description: 'Improve loading and runtime performance',
                fixes: [
                    {
                        type: 'bundling',
                        suggestion: 'Implement code splitting',
                        example: `// Dynamic imports for code splitting:
const HeavyComponent = lazy(() => import('./HeavyComponent'));`,
                        priority: 'high'
                    },
                    {
                        type: 'optimization',
                        suggestion: 'Defer non-critical JavaScript',
                        example: `<script src="non-critical.js" defer></script>`,
                        priority: 'medium'
                    }
                ]
            },
            
            networkError: {
                title: 'Fix Network Issues',
                description: 'Network failures are UNACCEPTABLE',
                fixes: [
                    {
                        type: 'code',
                        suggestion: 'Add retry logic',
                        example: `async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fetch(url);
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
        }
    }
}`,
                        priority: 'high'
                    },
                    {
                        type: 'cors',
                        suggestion: 'Configure CORS properly',
                        example: `// Server-side CORS configuration:
app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
}));`,
                        priority: 'high'
                    }
                ]
            }
        };
    }

    async generate(analysis) {
        const suggestions = [];
        
        // Generate based on errors
        if (analysis.errors) {
            const errorSuggestions = this.generateErrorSuggestions(analysis.errors);
            suggestions.push(...errorSuggestions);
        }
        
        // Generate based on performance
        if (analysis.performance) {
            const perfSuggestions = this.generatePerformanceSuggestions(analysis.performance);
            suggestions.push(...perfSuggestions);
        }
        
        // Generate based on root causes
        if (analysis.rootCauses) {
            const rootCauseSuggestions = this.generateRootCauseSuggestions(analysis.rootCauses);
            suggestions.push(...rootCauseSuggestions);
        }
        
        // Deduplicate and prioritize
        return this.prioritizeSuggestions(suggestions);
    }

    generateErrorSuggestions(errors) {
        const suggestions = [];
        const errorPatterns = {};
        
        // Group errors by pattern
        Object.values(errors).forEach(errorGroup => {
            Object.entries(errorGroup).forEach(([pattern, count]) => {
                errorPatterns[pattern] = (errorPatterns[pattern] || 0) + count;
            });
        });
        
        // Generate suggestions for each pattern
        Object.entries(errorPatterns).forEach(([pattern, count]) => {
            const template = this.findMatchingTemplate(pattern);
            if (template) {
                suggestions.push({
                    ...template,
                    occurrences: count,
                    impact: this.calculateImpact(pattern, count)
                });
            }
        });
        
        return suggestions;
    }

    generatePerformanceSuggestions(performance) {
        const suggestions = [];
        
        // FCP too slow
        if (performance.firstContentfulPaint > 1800) {
            suggestions.push({
                title: 'Improve First Contentful Paint',
                description: `FCP is ${performance.firstContentfulPaint}ms (target: <1800ms)`,
                priority: 'high',
                fixes: [
                    {
                        type: 'optimization',
                        suggestion: 'Inline critical CSS',
                        example: `<style>
/* Critical CSS inline */
.above-fold { display: block; }
</style>`,
                        impact: 'high'
                    },
                    {
                        type: 'resource',
                        suggestion: 'Preload key resources',
                        example: `<link rel="preload" href="font.woff2" as="font" crossorigin>`,
                        impact: 'medium'
                    }
                ]
            });
        }
        
        // TBT too high
        if (performance.totalBlockingTime > 300) {
            suggestions.push({
                title: 'Reduce Total Blocking Time',
                description: `TBT is ${performance.totalBlockingTime}ms (target: <300ms)`,
                priority: 'critical',
                fixes: [
                    {
                        type: 'code',
                        suggestion: 'Break up long tasks',
                        example: `// Use requestIdleCallback for non-critical work
requestIdleCallback(() => {
    performExpensiveOperation();
});`,
                        impact: 'high'
                    },
                    {
                        type: 'workers',
                        suggestion: 'Move heavy computation to Web Workers',
                        example: `const worker = new Worker('heavy-computation.js');
worker.postMessage({ cmd: 'process', data });`,
                        impact: 'high'
                    }
                ]
            });
        }
        
        // CLS too high
        if (performance.cumulativeLayoutShift > 0.1) {
            suggestions.push({
                title: 'Fix Layout Shifts',
                description: `CLS is ${performance.cumulativeLayoutShift} (target: <0.1)`,
                priority: 'high',
                fixes: [
                    {
                        type: 'css',
                        suggestion: 'Reserve space for dynamic content',
                        example: `/* Set explicit dimensions */
.image-container {
    aspect-ratio: 16 / 9;
    width: 100%;
}`,
                        impact: 'high'
                    },
                    {
                        type: 'loading',
                        suggestion: 'Add size attributes to images',
                        example: `<img src="image.jpg" width="800" height="600" alt="...">`,
                        impact: 'medium'
                    }
                ]
            });
        }
        
        return suggestions;
    }

    generateRootCauseSuggestions(rootCauses) {
        const suggestions = [];
        
        if (rootCauses.fixPlan) {
            rootCauses.fixPlan.forEach(step => {
                const template = this.findTemplateForCategory(step.category);
                if (template) {
                    suggestions.push({
                        title: step.action,
                        description: step.reason,
                        priority: step.priority,
                        fixes: template.fixes || [],
                        automated: this.canAutomate(step)
                    });
                }
            });
        }
        
        return suggestions;
    }

    findMatchingTemplate(pattern) {
        // Check each template for pattern match
        for (const [key, template] of Object.entries(this.fixTemplates)) {
            if (pattern.toLowerCase().includes(key.toLowerCase())) {
                return template;
            }
            
            // Check against template patterns
            if (template.fixes) {
                for (const fix of template.fixes) {
                    if (fix.pattern && fix.pattern.test(pattern)) {
                        return template;
                    }
                }
            }
        }
        
        return null;
    }

    findTemplateForCategory(category) {
        const categoryMap = {
            configuration: this.fixTemplates.sharedArrayBuffer,
            timing: this.fixTemplates.nullReference,
            performance: this.fixTemplates.performance,
            network: this.fixTemplates.networkError,
            memory: this.fixTemplates.memoryLeak
        };
        
        return categoryMap[category] || null;
    }

    calculateImpact(pattern, count) {
        // Critical patterns
        if (pattern.includes('SharedArrayBuffer') || pattern.includes('memory')) {
            return 'critical';
        }
        
        // High impact if many occurrences
        if (count > 10) return 'high';
        if (count > 5) return 'medium';
        
        return 'low';
    }

    canAutomate(step) {
        const automatable = [
            'Enable COOP/COEP headers',
            'Add null checks',
            'Add error handling',
            'Format code'
        ];
        
        return automatable.some(task => step.action.includes(task));
    }

    prioritizeSuggestions(suggestions) {
        // Remove duplicates
        const unique = new Map();
        suggestions.forEach(s => {
            const key = s.title;
            if (!unique.has(key) || this.getPriorityValue(s.priority) > this.getPriorityValue(unique.get(key).priority)) {
                unique.set(key, s);
            }
        });
        
        // Sort by priority
        return Array.from(unique.values()).sort((a, b) => 
            this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority)
        );
    }

    getPriorityValue(priority) {
        const values = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1
        };
        return values[priority] || 0;
    }
}