/**
 * TestHelpers - Common testing utilities extracted from existing tests
 * 
 * Destilled from V3 tests and current V4 validation tests.
 * Provides reusable patterns for common testing scenarios.
 */

export const TestHelpers = {
    // Logger utility (from phase-1-validation.html)
    createTestLogger() {
        const logs = [];
        const startTime = performance.now();
        
        const logger = {
            log(message, type = 'info') {
                const entry = {
                    timestamp: performance.now() - startTime,
                    message,
                    type,
                    time: new Date().toISOString()
                };
                logs.push(entry);
                
                // Console output with styling
                const styles = {
                    info: 'color: #3498db',
                    success: 'color: #27ae60',
                    warning: 'color: #f39c12',
                    error: 'color: #e74c3c'
                };
                
                console.log(`%c[BRUTAL Test] ${message}`, styles[type] || '');
                return logger;
            },
            
            info(message) {
                return this.log(message, 'info');
            },
            
            success(message) {
                return this.log(message, 'success');
            },
            
            warning(message) {
                return this.log(message, 'warning');
            },
            
            error(message) {
                return this.log(message, 'error');
            },
            
            getLogs() {
                return logs;
            },
            
            getSummary() {
                return {
                    total: logs.length,
                    info: logs.filter(l => l.type === 'info').length,
                    success: logs.filter(l => l.type === 'success').length,
                    warning: logs.filter(l => l.type === 'warning').length,
                    error: logs.filter(l => l.type === 'error').length,
                    duration: performance.now() - startTime
                };
            },
            
            clear() {
                logs.length = 0;
                return logger;
            }
        };
        
        return logger;
    },
    
    // Performance measurement (from various tests)
    async measurePerformance(fn, options = {}) {
        const {
            iterations = 1,
            warmup = 0,
            collectGarbage = false
        } = options;
        
        const metrics = {
            times: [],
            memory: [],
            iterations
        };
        
        // Warmup runs
        for (let i = 0; i < warmup; i++) {
            await fn();
        }
        
        // Garbage collection if available
        if (collectGarbage && window.gc) {
            window.gc();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Actual measurements
        for (let i = 0; i < iterations; i++) {
            const memBefore = performance.memory?.usedJSHeapSize || 0;
            const start = performance.now();
            
            await fn();
            
            const end = performance.now();
            const memAfter = performance.memory?.usedJSHeapSize || 0;
            
            metrics.times.push(end - start);
            metrics.memory.push(memAfter - memBefore);
        }
        
        // Calculate statistics
        const stats = {
            time: {
                avg: metrics.times.reduce((a, b) => a + b, 0) / iterations,
                min: Math.min(...metrics.times),
                max: Math.max(...metrics.times),
                median: this.median(metrics.times),
                p95: this.percentile(metrics.times, 95),
                p99: this.percentile(metrics.times, 99)
            },
            memory: {
                avg: metrics.memory.reduce((a, b) => a + b, 0) / iterations,
                min: Math.min(...metrics.memory),
                max: Math.max(...metrics.memory),
                median: this.median(metrics.memory)
            },
            raw: metrics
        };
        
        return stats;
    },
    
    // Component validation (from comprehensive tests)
    validateComponent(component) {
        const checks = {
            isComponent: component instanceof HTMLElement,
            hasConstructor: typeof component.constructor === 'function',
            hasShadowRoot: component.shadowRoot !== null,
            hasState: component._state && typeof component._state.get === 'function',
            hasEvents: component._events || typeof component.emit === 'function',
            hasTemplate: typeof component.createTemplate === 'function',
            isConnected: component.isConnected,
            hasAttributes: component.hasAttributes(),
            hasChildNodes: component.shadowRoot?.hasChildNodes() || false
        };
        
        const issues = [];
        Object.entries(checks).forEach(([check, passed]) => {
            if (!passed) {
                issues.push(check);
            }
        });
        
        return {
            valid: issues.length === 0,
            checks,
            issues,
            summary: `${Object.values(checks).filter(v => v).length}/${Object.keys(checks).length} checks passed`
        };
    },
    
    // Wait utilities
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    async waitForFrame() {
        return new Promise(resolve => requestAnimationFrame(resolve));
    },
    
    async waitForFrames(count = 1) {
        for (let i = 0; i < count; i++) {
            await this.waitForFrame();
        }
    },
    
    async waitForCondition(condition, timeout = 5000, interval = 50) {
        const start = performance.now();
        
        while (performance.now() - start < timeout) {
            if (await condition()) {
                return true;
            }
            await this.wait(interval);
        }
        
        throw new Error(`Condition not met within ${timeout}ms`);
    },
    
    // DOM utilities
    async waitForElement(selector, parent = document, timeout = 5000) {
        return this.waitForCondition(
            () => parent.querySelector(selector) !== null,
            timeout
        );
    },
    
    async waitForElementRemoval(selector, parent = document, timeout = 5000) {
        return this.waitForCondition(
            () => parent.querySelector(selector) === null,
            timeout
        );
    },
    
    // Memory leak detection (from memory tests)
    async detectMemoryLeak(fn, options = {}) {
        const {
            iterations = 100,
            threshold = 1048576, // 1MB
            gcBefore = true,
            gcAfter = true
        } = options;
        
        // Initial GC
        if (gcBefore && window.gc) {
            window.gc();
            await this.wait(100);
        }
        
        const memBefore = performance.memory?.usedJSHeapSize || 0;
        
        // Run iterations
        for (let i = 0; i < iterations; i++) {
            await fn();
        }
        
        // Final GC
        if (gcAfter && window.gc) {
            window.gc();
            await this.wait(100);
        }
        
        const memAfter = performance.memory?.usedJSHeapSize || 0;
        const leaked = memAfter - memBefore;
        
        return {
            leaked,
            leakedMB: leaked / 1048576,
            hasLeak: leaked > threshold,
            before: memBefore,
            after: memAfter,
            threshold
        };
    },
    
    // Create test component
    createTestComponent(options = {}) {
        const {
            tag = 'test-component',
            template = '<div>Test</div>',
            state = {},
            methods = {}
        } = options;
        
        class TestComponent extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' });
                this._state = { ...state };
                
                // Add custom methods
                Object.assign(this, methods);
            }
            
            connectedCallback() {
                this.render();
            }
            
            render() {
                this.shadowRoot.innerHTML = typeof template === 'function' 
                    ? template(this._state) 
                    : template;
            }
            
            setState(newState) {
                this._state = { ...this._state, ...newState };
                this.render();
            }
        }
        
        // Register if not already registered
        if (!customElements.get(tag)) {
            customElements.define(tag, TestComponent);
        }
        
        return document.createElement(tag);
    },
    
    // Mock utilities
    createMock(name, methods = {}) {
        const calls = [];
        
        const mock = {
            [name]: function(...args) {
                calls.push({ method: name, args, timestamp: performance.now() });
                
                if (methods[name]) {
                    return methods[name](...args);
                }
            },
            
            getCalls() {
                return calls;
            },
            
            getCallCount() {
                return calls.length;
            },
            
            wasCalledWith(...args) {
                return calls.some(call => 
                    JSON.stringify(call.args) === JSON.stringify(args)
                );
            },
            
            reset() {
                calls.length = 0;
            }
        };
        
        return mock[name];
    },
    
    // Event utilities
    async captureEvents(target, eventName, fn) {
        const events = [];
        
        const handler = (event) => {
            events.push({
                type: event.type,
                target: event.target,
                detail: event.detail,
                timestamp: performance.now()
            });
        };
        
        target.addEventListener(eventName, handler);
        
        try {
            await fn();
        } finally {
            target.removeEventListener(eventName, handler);
        }
        
        return events;
    },
    
    // Statistical helpers
    median(numbers) {
        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        return sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
    },
    
    percentile(numbers, p) {
        const sorted = [...numbers].sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[index];
    },
    
    // Snapshot testing helper
    createSnapshot(data) {
        return {
            data: structuredClone ? structuredClone(data) : JSON.parse(JSON.stringify(data)),
            timestamp: Date.now(),
            compare(newData) {
                const newSnapshot = structuredClone ? structuredClone(newData) : JSON.parse(JSON.stringify(newData));
                return JSON.stringify(this.data) === JSON.stringify(newSnapshot);
            }
        };
    },
    
    // Module size checking (from validation tests)
    async checkModuleSize(modulePath, maxSize) {
        try {
            const response = await fetch(modulePath);
            const text = await response.text();
            const lines = text.split('\n').length;
            const size = text.length;
            
            return {
                path: modulePath,
                lines,
                size,
                sizeKB: size / 1024,
                withinLimit: lines <= maxSize,
                maxSize
            };
        } catch (error) {
            return {
                path: modulePath,
                error: error.message,
                withinLimit: false
            };
        }
    }
};