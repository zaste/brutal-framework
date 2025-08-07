/**
 * CommonPatterns - Reusable test patterns extracted from V4 tests
 * 
 * These patterns are destilled from the existing HTML tests and
 * provide ready-to-use test scenarios for common V4 features.
 */

import { TestHelpers } from './TestHelpers.js';

export const CommonPatterns = {
    // Render Scheduler validation (from test-render-scheduler.html)
    async validateRenderScheduler(renderScheduler) {
        const logger = TestHelpers.createTestLogger();
        
        // Reset stats
        renderScheduler._stats = {
            scheduled: 0,
            rendered: 0,
            batches: 0,
            currentBatch: []
        };
        
        // Create multiple components that request renders
        const components = Array(10).fill(null).map((_, i) => ({
            id: `component-${i}`,
            rendered: false,
            scheduleRender() {
                renderScheduler.schedule(this);
            },
            render() {
                this.rendered = true;
                logger.log(`Component ${this.id} rendered`);
            }
        }));
        
        // Schedule all renders
        logger.log('Scheduling 10 component renders');
        components.forEach(c => c.scheduleRender());
        
        // Wait for next frame
        await TestHelpers.waitForFrame();
        
        // Validate results
        const stats = renderScheduler.getStats();
        const allRendered = components.every(c => c.rendered);
        
        return {
            passed: allRendered && stats.batches === 1,
            stats,
            components,
            message: `Rendered ${stats.rendered} components in ${stats.batches} batches`
        };
    },
    
    // Memory safety check (from test-memory-safety.html)
    async checkMemorySafety(ComponentClass, options = {}) {
        const {
            iterations = 100,
            threshold = 1048576, // 1MB
            attributes = {},
            content = ''
        } = options;
        
        const logger = TestHelpers.createTestLogger();
        
        // Force GC if available
        if (window.gc) {
            window.gc();
            await TestHelpers.wait(100);
        }
        
        const memBefore = performance.memory?.usedJSHeapSize || 0;
        logger.log(`Memory before: ${(memBefore / 1048576).toFixed(2)}MB`);
        
        // Create and destroy components
        let components = [];
        
        for (let i = 0; i < iterations; i++) {
            const component = new ComponentClass();
            
            // Set attributes
            Object.entries(attributes).forEach(([key, value]) => {
                component.setAttribute(key, value);
            });
            
            // Add to DOM
            document.body.appendChild(component);
            components.push(component);
        }
        
        // Remove all components
        logger.log(`Removing ${iterations} components`);
        components.forEach(c => c.remove());
        components = null;
        
        // Force GC again
        if (window.gc) {
            window.gc();
            await TestHelpers.wait(100);
        }
        
        const memAfter = performance.memory?.usedJSHeapSize || 0;
        const leaked = memAfter - memBefore;
        
        logger.log(`Memory after: ${(memAfter / 1048576).toFixed(2)}MB`);
        logger.log(`Leaked: ${(leaked / 1048576).toFixed(2)}MB`);
        
        return {
            passed: leaked < threshold,
            memBefore,
            memAfter,
            leaked,
            leakedMB: leaked / 1048576,
            threshold,
            message: `Memory leak check: ${leaked < threshold ? 'PASSED' : 'FAILED'}`
        };
    },
    
    // Module validation (from test-template-modules.html)
    async validateModuleStructure(modules) {
        const results = [];
        const logger = TestHelpers.createTestLogger();
        
        for (const [category, config] of Object.entries(modules)) {
            logger.log(`Validating ${category} modules`);
            
            const categoryResults = {
                category,
                modules: [],
                passed: true
            };
            
            for (const modulePath of config.paths) {
                const result = await TestHelpers.checkModuleSize(
                    modulePath, 
                    config.maxSize
                );
                
                categoryResults.modules.push(result);
                
                if (!result.withinLimit) {
                    categoryResults.passed = false;
                    logger.error(`Module ${modulePath} exceeds size limit`);
                }
            }
            
            results.push(categoryResults);
        }
        
        return {
            passed: results.every(r => r.passed),
            results,
            summary: results.map(r => ({
                category: r.category,
                passed: r.passed,
                count: r.modules.length
            }))
        };
    },
    
    // Component lifecycle validation
    async validateComponentLifecycle(ComponentClass) {
        const events = [];
        const logger = TestHelpers.createTestLogger();
        
        // Create component with lifecycle tracking
        const component = new ComponentClass();
        
        // Track lifecycle methods
        const originalMethods = {
            connectedCallback: component.connectedCallback?.bind(component),
            disconnectedCallback: component.disconnectedCallback?.bind(component),
            attributeChangedCallback: component.attributeChangedCallback?.bind(component),
            adoptedCallback: component.adoptedCallback?.bind(component)
        };
        
        // Override lifecycle methods
        component.connectedCallback = function() {
            events.push({ method: 'connectedCallback', timestamp: performance.now() });
            logger.log('connectedCallback fired');
            return originalMethods.connectedCallback?.();
        };
        
        component.disconnectedCallback = function() {
            events.push({ method: 'disconnectedCallback', timestamp: performance.now() });
            logger.log('disconnectedCallback fired');
            return originalMethods.disconnectedCallback?.();
        };
        
        component.attributeChangedCallback = function(name, oldValue, newValue) {
            events.push({ 
                method: 'attributeChangedCallback', 
                args: { name, oldValue, newValue },
                timestamp: performance.now() 
            });
            logger.log(`attributeChangedCallback: ${name} = ${newValue}`);
            return originalMethods.attributeChangedCallback?.(name, oldValue, newValue);
        };
        
        // Test lifecycle
        logger.log('Adding component to DOM');
        document.body.appendChild(component);
        
        await TestHelpers.waitForFrame();
        
        logger.log('Setting attribute');
        component.setAttribute('test', 'value');
        
        await TestHelpers.waitForFrame();
        
        logger.log('Removing component from DOM');
        component.remove();
        
        await TestHelpers.waitForFrame();
        
        // Validate
        const hasConnected = events.some(e => e.method === 'connectedCallback');
        const hasDisconnected = events.some(e => e.method === 'disconnectedCallback');
        
        return {
            passed: hasConnected && hasDisconnected,
            events,
            lifecycle: {
                connected: hasConnected,
                disconnected: hasDisconnected,
                attributeChanged: events.filter(e => e.method === 'attributeChangedCallback').length
            }
        };
    },
    
    // State reactivity validation
    async validateStateReactivity(component) {
        const logger = TestHelpers.createTestLogger();
        const updates = [];
        
        // Track state changes
        let renderCount = 0;
        const originalRender = component.render?.bind(component);
        component.render = function() {
            renderCount++;
            updates.push({
                type: 'render',
                count: renderCount,
                timestamp: performance.now()
            });
            return originalRender?.();
        };
        
        // Test state changes
        logger.log('Testing state reactivity');
        
        const initialState = component._state?.getAll() || {};
        logger.log('Initial state:', initialState);
        
        // Make state changes
        component._state?.set({ testValue: 1 });
        await TestHelpers.waitForFrame();
        
        component._state?.set({ testValue: 2 });
        await TestHelpers.waitForFrame();
        
        component._state?.set({ nested: { value: 3 } });
        await TestHelpers.waitForFrame();
        
        // Validate
        const finalState = component._state?.getAll() || {};
        const hasReactivity = renderCount >= 3;
        
        return {
            passed: hasReactivity,
            renderCount,
            updates,
            initialState,
            finalState,
            message: `Component re-rendered ${renderCount} times on state changes`
        };
    },
    
    // Performance budget validation
    async validatePerformanceBudget(component, budgets) {
        const logger = TestHelpers.createTestLogger();
        const metrics = {};
        
        // Measure initialization time
        logger.log('Measuring initialization performance');
        const initStart = performance.now();
        const instance = new component();
        const initTime = performance.now() - initStart;
        metrics.initTime = initTime;
        
        // Measure render time
        logger.log('Measuring render performance');
        document.body.appendChild(instance);
        
        const renderMetrics = await TestHelpers.measurePerformance(
            () => instance.render(),
            { iterations: 10, warmup: 2 }
        );
        metrics.renderTime = renderMetrics.time.avg;
        
        // Measure memory footprint
        const memoryResult = await CommonPatterns.checkMemorySafety(
            component,
            { iterations: 10 }
        );
        metrics.memoryPerInstance = memoryResult.leaked / 10;
        
        // Clean up
        instance.remove();
        
        // Validate against budgets
        const violations = [];
        
        Object.entries(budgets).forEach(([metric, limit]) => {
            if (metrics[metric] > limit) {
                violations.push({
                    metric,
                    limit,
                    actual: metrics[metric],
                    exceeded: ((metrics[metric] / limit - 1) * 100).toFixed(1) + '%'
                });
            }
        });
        
        return {
            passed: violations.length === 0,
            metrics,
            budgets,
            violations,
            message: violations.length === 0 
                ? 'All performance budgets met' 
                : `${violations.length} budget violations`
        };
    },
    
    // Feature detection patterns
    validateFeatureSupport(features) {
        const results = {};
        const logger = TestHelpers.createTestLogger();
        
        features.forEach(feature => {
            logger.log(`Checking support for: ${feature}`);
            
            switch (feature) {
                case 'shadowDOM':
                    results[feature] = 'attachShadow' in Element.prototype;
                    break;
                case 'customElements':
                    results[feature] = 'customElements' in window;
                    break;
                case 'modules':
                    results[feature] = 'noModule' in HTMLScriptElement.prototype;
                    break;
                case 'constructableStyleSheets':
                    results[feature] = 'adoptedStyleSheets' in Document.prototype;
                    break;
                case 'elementInternals':
                    results[feature] = 'attachInternals' in HTMLElement.prototype;
                    break;
                case 'sharedArrayBuffer':
                    results[feature] = 'SharedArrayBuffer' in window;
                    break;
                case 'webGPU':
                    results[feature] = 'gpu' in navigator;
                    break;
                default:
                    results[feature] = false;
            }
        });
        
        const allSupported = Object.values(results).every(v => v);
        
        return {
            passed: allSupported,
            results,
            supported: Object.entries(results).filter(([_, v]) => v).map(([k]) => k),
            unsupported: Object.entries(results).filter(([_, v]) => !v).map(([k]) => k)
        };
    }
};