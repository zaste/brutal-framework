/**
 * BRUTAL Framework Alignment Validator
 * Ensures bidirectional validation between framework and tests
 */

export class FrameworkAlignmentValidator {
    constructor() {
        this.validationRules = {
            componentStructure: [
                {
                    name: 'Has render method',
                    check: (cls) => typeof cls.prototype.render === 'function'
                },
                {
                    name: 'Has connectedCallback',
                    check: (cls) => typeof cls.prototype.connectedCallback === 'function'
                },
                {
                    name: 'Has disconnectedCallback', 
                    check: (cls) => typeof cls.prototype.disconnectedCallback === 'function'
                },
                {
                    name: 'Extends proper base class',
                    check: (cls) => cls.prototype instanceof HTMLElement
                }
            ],
            bindingValidation: [
                {
                    name: 'All bound methods exist',
                    check: (instance) => {
                        const issues = [];
                        Object.entries(instance).forEach(([key, value]) => {
                            if (key.includes('_bound') && typeof value === 'function') {
                                const methodName = key.replace(/^_?bound/, '_').replace(/^__/, '_');
                                if (methodName !== key && typeof instance[methodName] !== 'function') {
                                    issues.push(`Missing method ${methodName} for binding ${key}`);
                                }
                            }
                        });
                        return issues.length === 0 ? true : issues;
                    }
                }
            ],
            observedAttributes: [
                {
                    name: 'Valid observed attributes',
                    check: (cls) => {
                        const attrs = cls.observedAttributes || [];
                        return attrs.every(attr => typeof attr === 'string');
                    }
                }
            ]
        };
    }
    
    validateComponent(ComponentClass) {
        const results = {
            component: ComponentClass.name,
            passed: [],
            failed: [],
            warnings: []
        };
        
        // Validate class structure
        this.validationRules.componentStructure.forEach(rule => {
            try {
                if (rule.check(ComponentClass)) {
                    results.passed.push(rule.name);
                } else {
                    results.failed.push({ rule: rule.name, reason: 'Check failed' });
                }
            } catch (error) {
                results.failed.push({ rule: rule.name, reason: error.message });
            }
        });
        
        // Validate instance
        try {
            const instance = new ComponentClass();
            
            // Binding validation
            this.validationRules.bindingValidation.forEach(rule => {
                const result = rule.check(instance);
                if (result === true) {
                    results.passed.push(rule.name);
                } else if (Array.isArray(result)) {
                    results.failed.push({ rule: rule.name, issues: result });
                }
            });
            
        } catch (error) {
            results.warnings.push(`Cannot instantiate component: ${error.message}`);
        }
        
        // Validate static properties
        this.validationRules.observedAttributes.forEach(rule => {
            try {
                if (rule.check(ComponentClass)) {
                    results.passed.push(rule.name);
                } else {
                    results.failed.push({ rule: rule.name, reason: 'Invalid attributes' });
                }
            } catch (error) {
                results.failed.push({ rule: rule.name, reason: error.message });
            }
        });
        
        return results;
    }
    
    generateReport(results) {
        const report = {
            summary: {
                total: results.length,
                passed: results.filter(r => r.failed.length === 0).length,
                failed: results.filter(r => r.failed.length > 0).length,
                warnings: results.reduce((sum, r) => sum + r.warnings.length, 0)
            },
            details: results
        };
        
        return report;
    }
}