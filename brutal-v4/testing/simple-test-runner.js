/**
 * Simple Test Runner - A pragmatic approach to testing
 * 
 * Tests are just functions that return { pass: boolean, message: string }
 * No magic, no components, just reliable testing.
 */

export class SimpleTestRunner {
    constructor() {
        this.tests = new Map();
        this.results = [];
    }
    
    // Register a test
    test(name, fn) {
        this.tests.set(name, fn);
    }
    
    // Run all tests
    async runAll() {
        this.results = [];
        const startTime = performance.now();
        
        for (const [name, fn] of this.tests) {
            const testStart = performance.now();
            
            try {
                const result = await fn();
                const duration = performance.now() - testStart;
                
                this.results.push({
                    name,
                    pass: result.pass !== false,
                    message: result.message || 'OK',
                    duration,
                    error: null
                });
            } catch (error) {
                const duration = performance.now() - testStart;
                
                this.results.push({
                    name,
                    pass: false,
                    message: error.message,
                    duration,
                    error: error.stack
                });
            }
        }
        
        const totalDuration = performance.now() - startTime;
        return {
            results: this.results,
            passed: this.results.filter(r => r.pass).length,
            failed: this.results.filter(r => !r.pass).length,
            total: this.results.length,
            duration: totalDuration
        };
    }
    
    // Get a simple text report
    getReport() {
        const lines = ['Test Results:', '============='];
        
        for (const result of this.results) {
            const status = result.pass ? '✅ PASS' : '❌ FAIL';
            const time = `(${result.duration.toFixed(2)}ms)`;
            lines.push(`${status} ${result.name} ${time}`);
            
            if (!result.pass) {
                lines.push(`  Message: ${result.message}`);
                if (result.error) {
                    lines.push(`  Stack: ${result.error}`);
                }
            }
        }
        
        const passed = this.results.filter(r => r.pass).length;
        const failed = this.results.filter(r => !r.pass).length;
        
        lines.push('');
        lines.push(`Total: ${this.results.length} | Passed: ${passed} | Failed: ${failed}`);
        
        return lines.join('\n');
    }
}

// Helper assertions
export const assert = {
    equal(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected} but got ${actual}`);
        }
    },
    
    notEqual(actual, expected, message) {
        if (actual === expected) {
            throw new Error(message || `Expected ${actual} to not equal ${expected}`);
        }
    },
    
    true(value, message) {
        if (value !== true) {
            throw new Error(message || `Expected true but got ${value}`);
        }
    },
    
    false(value, message) {
        if (value !== false) {
            throw new Error(message || `Expected false but got ${value}`);
        }
    },
    
    throws(fn, message) {
        try {
            fn();
            throw new Error(message || 'Expected function to throw');
        } catch (e) {
            // Expected
        }
    },
    
    async throwsAsync(fn, message) {
        try {
            await fn();
            throw new Error(message || 'Expected async function to throw');
        } catch (e) {
            // Expected
        }
    }
};

// Example usage:
/*
const runner = new SimpleTestRunner();

runner.test('basic math', () => {
    assert.equal(2 + 2, 4);
    return { pass: true };
});

runner.test('async test', async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.true(true);
    return { pass: true };
});

const results = await runner.runAll();
console.log(runner.getReport());
*/