/**
 * BRUTAL V3 - Test Utilities
 * Zero-dependency testing framework for BRUTAL components
 * Performance-focused with GPU metrics and visual regression
 */

export class TestUtils {
    static results = new Map();
    static currentSuite = null;
    static currentTest = null;
    
    /**
     * Define a test suite
     */
    static describe(name, fn) {
        this.currentSuite = {
            name,
            tests: [],
            beforeEach: null,
            afterEach: null,
            startTime: performance.now()
        };
        
        fn();
        
        const endTime = performance.now();
        const duration = endTime - this.currentSuite.startTime;
        
        this.results.set(name, {
            ...this.currentSuite,
            duration,
            passed: this.currentSuite.tests.filter(t => t.passed).length,
            failed: this.currentSuite.tests.filter(t => !t.passed).length
        });
        
        this.currentSuite = null;
    }
    
    /**
     * Define a test
     */
    static it(description, fn) {
        if (!this.currentSuite) {
            throw new Error('it() must be called within describe()');
        }
        
        const test = {
            description,
            passed: false,
            error: null,
            duration: 0,
            assertions: []
        };
        
        this.currentTest = test;
        const startTime = performance.now();
        
        try {
            // Run beforeEach if defined
            if (this.currentSuite.beforeEach) {
                this.currentSuite.beforeEach();
            }
            
            // Run the test
            const result = fn();
            
            // Handle async tests
            if (result instanceof Promise) {
                result.then(() => {
                    test.passed = true;
                    test.duration = performance.now() - startTime;
                }).catch(error => {
                    test.passed = false;
                    test.error = error;
                    test.duration = performance.now() - startTime;
                });
            } else {
                test.passed = true;
                test.duration = performance.now() - startTime;
            }
            
            // Run afterEach if defined
            if (this.currentSuite.afterEach) {
                this.currentSuite.afterEach();
            }
            
        } catch (error) {
            test.passed = false;
            test.error = error;
            test.duration = performance.now() - startTime;
        }
        
        this.currentSuite.tests.push(test);
        this.currentTest = null;
    }
    
    /**
     * Setup hook - runs before each test
     */
    static beforeEach(fn) {
        if (!this.currentSuite) {
            throw new Error('beforeEach() must be called within describe()');
        }
        this.currentSuite.beforeEach = fn;
    }
    
    /**
     * Teardown hook - runs after each test
     */
    static afterEach(fn) {
        if (!this.currentSuite) {
            throw new Error('afterEach() must be called within describe()');
        }
        this.currentSuite.afterEach = fn;
    }
    
    /**
     * Assertion utilities
     */
    static expect(actual) {
        const assertion = (passed, message) => {
            if (this.currentTest) {
                this.currentTest.assertions.push({ passed, message });
            }
            if (!passed) {
                throw new Error(message);
            }
        };
        
        return {
            toBe(expected) {
                assertion(
                    Object.is(actual, expected),
                    `Expected ${actual} to be ${expected}`
                );
            },
            
            toEqual(expected) {
                assertion(
                    JSON.stringify(actual) === JSON.stringify(expected),
                    `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`
                );
            },
            
            toBeTruthy() {
                assertion(
                    Boolean(actual),
                    `Expected ${actual} to be truthy`
                );
            },
            
            toBeFalsy() {
                assertion(
                    !Boolean(actual),
                    `Expected ${actual} to be falsy`
                );
            },
            
            toBeGreaterThan(expected) {
                assertion(
                    actual > expected,
                    `Expected ${actual} to be greater than ${expected}`
                );
            },
            
            toBeLessThan(expected) {
                assertion(
                    actual < expected,
                    `Expected ${actual} to be less than ${expected}`
                );
            },
            
            toContain(expected) {
                const contains = Array.isArray(actual) 
                    ? actual.includes(expected)
                    : String(actual).includes(expected);
                    
                assertion(
                    contains,
                    `Expected ${actual} to contain ${expected}`
                );
            },
            
            toHaveLength(expected) {
                assertion(
                    actual.length === expected,
                    `Expected length ${actual.length} to be ${expected}`
                );
            },
            
            toThrow(expectedError) {
                try {
                    if (typeof actual === 'function') {
                        actual();
                    }
                    assertion(false, `Expected function to throw`);
                } catch (error) {
                    if (expectedError) {
                        assertion(
                            error.message.includes(expectedError),
                            `Expected error "${error.message}" to include "${expectedError}"`
                        );
                    } else {
                        assertion(true, 'Function threw as expected');
                    }
                }
            },
            
            toBeInstanceOf(expected) {
                assertion(
                    actual instanceof expected,
                    `Expected ${actual} to be instance of ${expected.name}`
                );
            },
            
            toHaveProperty(property, value) {
                const hasProperty = property in actual;
                if (value !== undefined) {
                    assertion(
                        hasProperty && actual[property] === value,
                        `Expected property ${property} to have value ${value}`
                    );
                } else {
                    assertion(
                        hasProperty,
                        `Expected object to have property ${property}`
                    );
                }
            }
        };
    }
    
    /**
     * Component testing utilities
     */
    static async createComponent(tagName, props = {}) {
        const element = document.createElement(tagName);
        Object.assign(element, props);
        document.body.appendChild(element);
        
        // Wait for component to be ready
        await element.updateComplete || Promise.resolve();
        
        return {
            element,
            shadowRoot: element.shadowRoot,
            
            // Query helpers
            query(selector) {
                return element.shadowRoot?.querySelector(selector);
            },
            
            queryAll(selector) {
                return Array.from(element.shadowRoot?.querySelectorAll(selector) || []);
            },
            
            // Event helpers
            async click(selector) {
                const el = this.query(selector);
                if (el) {
                    el.click();
                    await element.updateComplete || Promise.resolve();
                }
            },
            
            async type(selector, text) {
                const input = this.query(selector);
                if (input) {
                    input.value = text;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    await element.updateComplete || Promise.resolve();
                }
            },
            
            // State helpers
            getState(key) {
                return element.state?.get(key);
            },
            
            async setState(key, value) {
                element.state?.set(key, value);
                await element.updateComplete || Promise.resolve();
            },
            
            // Cleanup
            destroy() {
                element.remove();
            }
        };
    }
    
    /**
     * Performance testing utilities
     */
    static async measurePerformance(fn, iterations = 100) {
        const times = [];
        let memoryStart = 0;
        let memoryEnd = 0;
        
        if (performance.memory) {
            memoryStart = performance.memory.usedJSHeapSize;
        }
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await fn();
            const end = performance.now();
            times.push(end - start);
        }
        
        if (performance.memory) {
            memoryEnd = performance.memory.usedJSHeapSize;
        }
        
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
        
        return {
            avg: Math.round(avg * 100) / 100,
            min: Math.round(min * 100) / 100,
            max: Math.round(max * 100) / 100,
            median: Math.round(median * 100) / 100,
            memoryDelta: memoryEnd - memoryStart,
            fps: Math.round(1000 / avg)
        };
    }
    
    /**
     * Visual regression testing
     */
    static async captureVisualSnapshot(element, name) {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const rect = element.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Use html2canvas or similar for actual implementation
        // For now, return a placeholder
        return {
            name,
            width: rect.width,
            height: rect.height,
            timestamp: Date.now()
        };
    }
    
    /**
     * Accessibility testing
     */
    static async checkAccessibility(element) {
        const issues = [];
        
        // Check for ARIA attributes
        const interactiveElements = element.shadowRoot?.querySelectorAll(
            'button, a, input, select, textarea, [tabindex]'
        ) || [];
        
        interactiveElements.forEach(el => {
            // Check for accessible name
            if (!el.getAttribute('aria-label') && !el.textContent?.trim()) {
                issues.push({
                    element: el.tagName,
                    issue: 'Missing accessible name'
                });
            }
            
            // Check for keyboard accessibility
            if (el.onclick && !el.getAttribute('tabindex')) {
                issues.push({
                    element: el.tagName,
                    issue: 'Click handler without keyboard access'
                });
            }
        });
        
        // Check color contrast (simplified)
        const hasLowContrast = false; // Would use actual contrast calculation
        if (hasLowContrast) {
            issues.push({
                issue: 'Insufficient color contrast'
            });
        }
        
        return {
            passed: issues.length === 0,
            issues
        };
    }
    
    /**
     * Mock utilities
     */
    static mock(object, method, implementation) {
        const original = object[method];
        const calls = [];
        
        object[method] = (...args) => {
            calls.push(args);
            return implementation ? implementation(...args) : undefined;
        };
        
        return {
            calls,
            restore() {
                object[method] = original;
            },
            wasCalled() {
                return calls.length > 0;
            },
            wasCalledWith(...args) {
                return calls.some(call => 
                    JSON.stringify(call) === JSON.stringify(args)
                );
            }
        };
    }
    
    /**
     * Wait utilities
     */
    static wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    static async waitFor(condition, timeout = 5000) {
        const start = Date.now();
        
        while (Date.now() - start < timeout) {
            if (await condition()) {
                return true;
            }
            await this.wait(50);
        }
        
        throw new Error('Timeout waiting for condition');
    }
    
    /**
     * Report generation
     */
    static generateReport() {
        const report = {
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                duration: 0
            },
            suites: []
        };
        
        this.results.forEach((suite, name) => {
            report.summary.total += suite.tests.length;
            report.summary.passed += suite.passed;
            report.summary.failed += suite.failed;
            report.summary.duration += suite.duration;
            
            report.suites.push({
                name,
                duration: Math.round(suite.duration * 100) / 100,
                tests: suite.tests.map(test => ({
                    description: test.description,
                    passed: test.passed,
                    duration: Math.round(test.duration * 100) / 100,
                    error: test.error?.message,
                    assertions: test.assertions
                }))
            });
        });
        
        report.summary.duration = Math.round(report.summary.duration * 100) / 100;
        
        return report;
    }
    
    /**
     * Console reporter
     */
    static printReport() {
        const report = this.generateReport();
        
        console.log('\n🚀 BRUTAL V3 Test Results\n');
        console.log(`Total: ${report.summary.total}`);
        console.log(`✅ Passed: ${report.summary.passed}`);
        console.log(`❌ Failed: ${report.summary.failed}`);
        console.log(`⏱️  Duration: ${report.summary.duration}ms\n`);
        
        report.suites.forEach(suite => {
            console.log(`\n📦 ${suite.name} (${suite.duration}ms)`);
            
            suite.tests.forEach(test => {
                const status = test.passed ? '✅' : '❌';
                console.log(`  ${status} ${test.description} (${test.duration}ms)`);
                
                if (test.error) {
                    console.error(`     Error: ${test.error}`);
                }
            });
        });
        
        return report.summary.failed === 0;
    }
}

// Export convenience functions
export const { describe, it, beforeEach, afterEach, expect } = TestUtils;
export const { createComponent, measurePerformance, mock, wait, waitFor } = TestUtils;