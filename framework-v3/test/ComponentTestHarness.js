/**
 * BRUTAL V3 - Component Test Harness
 * Visual regression, performance benchmarks, and accessibility testing
 */

import { Component } from '../01-core/Component.js';
import { Registry } from '../01-core/Registry.js';

export class ComponentTestHarness {
    constructor() {
        // Test configuration
        this._config = {
            viewportSizes: [
                { width: 375, height: 667, name: 'mobile' },
                { width: 768, height: 1024, name: 'tablet' },
                { width: 1920, height: 1080, name: 'desktop' }
            ],
            themes: ['default', 'dark'],
            performanceBudget: {
                renderTime: 16, // 60fps
                memoryLimit: 50 * 1024 * 1024, // 50MB
                layoutShifts: 0.1
            }
        };
        
        // Test results
        this._results = {
            visual: [],
            performance: [],
            accessibility: [],
            functionality: []
        };
        
        // Test utilities
        this._testContainer = null;
        this._performanceObserver = null;
        this._mutationObserver = null;
        
        // Snapshot storage
        this._snapshots = new Map();
        
        // Initialize
        this._initialize();
    }
    
    /**
     * Initialize test harness
     */
    _initialize() {
        // Create test container
        this._testContainer = document.createElement('div');
        this._testContainer.id = 'brutal-test-container';
        this._testContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            z-index: 99999;
            display: none;
        `;
        document.body.appendChild(this._testContainer);
        
        // Setup performance observer
        if ('PerformanceObserver' in window) {
            this._setupPerformanceObserver();
        }
    }
    
    /**
     * Test component
     */
    async testComponent(ComponentClass, props = {}, options = {}) {
        const testId = `${ComponentClass.name}-${Date.now()}`;
        const results = {
            component: ComponentClass.name,
            timestamp: new Date().toISOString(),
            tests: []
        };
        
        try {
            // Show test container
            this._testContainer.style.display = 'block';
            
            // Visual regression tests
            if (options.visual !== false) {
                const visualResults = await this._testVisualRegression(ComponentClass, props);
                results.tests.push(...visualResults);
            }
            
            // Performance tests
            if (options.performance !== false) {
                const perfResults = await this._testPerformance(ComponentClass, props);
                results.tests.push(...perfResults);
            }
            
            // Accessibility tests
            if (options.accessibility !== false) {
                const a11yResults = await this._testAccessibility(ComponentClass, props);
                results.tests.push(...a11yResults);
            }
            
            // Functionality tests
            if (options.functionality !== false) {
                const funcResults = await this._testFunctionality(ComponentClass, props);
                results.tests.push(...funcResults);
            }
            
        } catch (error) {
            results.error = error.message;
            } finally {
            // Hide test container
            this._testContainer.style.display = 'none';
            this._testContainer.innerHTML = '';
        }
        
        // Store results
        this._results[ComponentClass.name] = results;
        
        return results;
    }
    
    /**
     * Visual regression testing
     */
    async _testVisualRegression(ComponentClass, props) {
        const results = [];
        
        for (const viewport of this._config.viewportSizes) {
            for (const theme of this._config.themes) {
                const testCase = `${viewport.name}-${theme}`;
                
                try {
                    // Set viewport
                    this._setViewport(viewport);
                    
                    // Apply theme
                    document.documentElement.setAttribute('data-theme', theme);
                    
                    // Create component
                    const component = this._createComponent(ComponentClass, props);
                    
                    // Wait for render
                    await this._waitForRender(component);
                    
                    // Take snapshot
                    const snapshot = await this._takeSnapshot(component);
                    
                    // Compare with baseline
                    const comparison = this._compareSnapshots(
                        ComponentClass.name,
                        testCase,
                        snapshot
                    );
                    
                    results.push({
                        type: 'visual',
                        name: `Visual regression - ${testCase}`,
                        passed: comparison.difference < 0.01,
                        details: comparison
                    });
                    
                    // Cleanup
                    component.remove();
                    
                } catch (error) {
                    results.push({
                        type: 'visual',
                        name: `Visual regression - ${testCase}`,
                        passed: false,
                        error: error.message
                    });
                }
            }
        }
        
        return results;
    }
    
    /**
     * Performance testing
     */
    async _testPerformance(ComponentClass, props) {
        const results = [];
        
        // Initial render performance
        const renderResult = await this._testRenderPerformance(ComponentClass, props);
        results.push(renderResult);
        
        // Update performance
        const updateResult = await this._testUpdatePerformance(ComponentClass, props);
        results.push(updateResult);
        
        // Memory usage
        const memoryResult = await this._testMemoryUsage(ComponentClass, props);
        results.push(memoryResult);
        
        // Layout stability
        const layoutResult = await this._testLayoutStability(ComponentClass, props);
        results.push(layoutResult);
        
        return results;
    }
    
    /**
     * Test render performance
     */
    async _testRenderPerformance(ComponentClass, props) {
        const iterations = 100;
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            
            const component = this._createComponent(ComponentClass, props);
            await this._waitForRender(component);
            
            const end = performance.now();
            times.push(end - start);
            
            component.remove();
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTime = Math.max(...times);
        
        return {
            type: 'performance',
            name: 'Render performance',
            passed: avgTime < this._config.performanceBudget.renderTime,
            details: {
                averageTime: avgTime.toFixed(2),
                maxTime: maxTime.toFixed(2),
                budget: this._config.performanceBudget.renderTime,
                samples: iterations
            }
        };
    }
    
    /**
     * Test update performance
     */
    async _testUpdatePerformance(ComponentClass, props) {
        const component = this._createComponent(ComponentClass, props);
        await this._waitForRender(component);
        
        const updates = 1000;
        const start = performance.now();
        
        // Perform rapid updates
        for (let i = 0; i < updates; i++) {
            if (component.state) {
                component.state.update(state => {
                    state.counter = i;
                });
            } else if (component.setAttribute) {
                component.setAttribute('data-test', i);
            }
        }
        
        const end = performance.now();
        const totalTime = end - start;
        const avgUpdateTime = totalTime / updates;
        
        component.remove();
        
        return {
            type: 'performance',
            name: 'Update performance',
            passed: avgUpdateTime < 1,
            details: {
                totalTime: totalTime.toFixed(2),
                averageUpdateTime: avgUpdateTime.toFixed(4),
                updatesPerSecond: Math.round(1000 / avgUpdateTime),
                updates
            }
        };
    }
    
    /**
     * Test memory usage
     */
    async _testMemoryUsage(ComponentClass, props) {
        if (!performance.memory) {
            return {
                type: 'performance',
                name: 'Memory usage',
                skipped: true,
                reason: 'performance.memory not available'
            };
        }
        
        // Force garbage collection if available
        if (window.gc) window.gc();
        
        const startMemory = performance.memory.usedJSHeapSize;
        const components = [];
        
        // Create many components
        for (let i = 0; i < 100; i++) {
            components.push(this._createComponent(ComponentClass, props));
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const peakMemory = performance.memory.usedJSHeapSize;
        
        // Remove all components
        components.forEach(c => c.remove());
        
        // Wait and measure again
        await new Promise(resolve => setTimeout(resolve, 100));
        if (window.gc) window.gc();
        
        const endMemory = performance.memory.usedJSHeapSize;
        const leaked = endMemory - startMemory;
        
        return {
            type: 'performance',
            name: 'Memory usage',
            passed: leaked < 1024 * 1024, // Less than 1MB leaked
            details: {
                startMemory: (startMemory / 1024 / 1024).toFixed(2) + 'MB',
                peakMemory: (peakMemory / 1024 / 1024).toFixed(2) + 'MB',
                endMemory: (endMemory / 1024 / 1024).toFixed(2) + 'MB',
                leaked: (leaked / 1024).toFixed(2) + 'KB'
            }
        };
    }
    
    /**
     * Test layout stability
     */
    async _testLayoutStability(ComponentClass, props) {
        const component = this._createComponent(ComponentClass, props);
        let cumulativeShift = 0;
        
        // Observe layout shifts
        const observer = new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    cumulativeShift += entry.value;
                }
            }
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
        
        // Trigger various interactions
        await this._waitForRender(component);
        
        // Simulate content loading
        if (component.setData) {
            component.setData({ loading: true });
            await new Promise(resolve => setTimeout(resolve, 100));
            component.setData({ loading: false, data: Array(10).fill({}) });
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        observer.disconnect();
        component.remove();
        
        return {
            type: 'performance',
            name: 'Layout stability',
            passed: cumulativeShift < this._config.performanceBudget.layoutShifts,
            details: {
                cumulativeLayoutShift: cumulativeShift.toFixed(4),
                budget: this._config.performanceBudget.layoutShifts
            }
        };
    }
    
    /**
     * Accessibility testing
     */
    async _testAccessibility(ComponentClass, props) {
        const results = [];
        const component = this._createComponent(ComponentClass, props);
        await this._waitForRender(component);
        
        // ARIA attributes
        const ariaResult = this._testARIA(component);
        results.push(ariaResult);
        
        // Keyboard navigation
        const keyboardResult = await this._testKeyboardNavigation(component);
        results.push(keyboardResult);
        
        // Color contrast
        const contrastResult = this._testColorContrast(component);
        results.push(contrastResult);
        
        // Focus management
        const focusResult = this._testFocusManagement(component);
        results.push(focusResult);
        
        component.remove();
        
        return results;
    }
    
    /**
     * Test ARIA attributes
     */
    _testARIA(component) {
        const issues = [];
        
        // Check for interactive elements without labels
        const interactiveElements = component.shadowRoot.querySelectorAll(
            'button, a, input, select, textarea'
        );
        
        interactiveElements.forEach(el => {
            if (!el.getAttribute('aria-label') && 
                !el.getAttribute('aria-labelledby') && 
                !el.textContent?.trim() &&
                el.tagName !== 'INPUT') {
                issues.push(`${el.tagName} missing accessible label`);
            }
        });
        
        // Check for proper roles
        const customElements = component.shadowRoot.querySelectorAll('[role]');
        customElements.forEach(el => {
            const role = el.getAttribute('role');
            if (!this._isValidRole(role)) {
                issues.push(`Invalid role: ${role}`);
            }
        });
        
        return {
            type: 'accessibility',
            name: 'ARIA compliance',
            passed: issues.length === 0,
            details: {
                issues,
                interactiveElements: interactiveElements.length,
                customRoles: customElements.length
            }
        };
    }
    
    /**
     * Test keyboard navigation
     */
    async _testKeyboardNavigation(component) {
        const focusableElements = component.shadowRoot.querySelectorAll(
            'button, a, input, select, textarea, [tabindex]'
        );
        
        let canNavigate = true;
        const navigationPath = [];
        
        for (const element of focusableElements) {
            element.focus();
            
            if (document.activeElement !== component && 
                component.shadowRoot.activeElement !== element) {
                canNavigate = false;
                break;
            }
            
            navigationPath.push(element.tagName);
            
            // Simulate tab key
            const event = new KeyboardEvent('keydown', {
                key: 'Tab',
                bubbles: true
            });
            element.dispatchEvent(event);
        }
        
        return {
            type: 'accessibility',
            name: 'Keyboard navigation',
            passed: canNavigate && focusableElements.length > 0,
            details: {
                focusableElements: focusableElements.length,
                navigationPath,
                canNavigate
            }
        };
    }
    
    /**
     * Test color contrast
     */
    _testColorContrast(component) {
        const issues = [];
        const textElements = component.shadowRoot.querySelectorAll('*');
        
        textElements.forEach(el => {
            if (el.textContent?.trim()) {
                const style = getComputedStyle(el);
                const bgColor = this._getBackgroundColor(el);
                const fgColor = style.color;
                
                if (bgColor && fgColor) {
                    const contrast = this._calculateContrast(bgColor, fgColor);
                    
                    if (contrast < 4.5) {
                        issues.push({
                            element: el.tagName,
                            contrast: contrast.toFixed(2),
                            required: 4.5
                        });
                    }
                }
            }
        });
        
        return {
            type: 'accessibility',
            name: 'Color contrast',
            passed: issues.length === 0,
            details: {
                issues,
                minimumContrast: 4.5
            }
        };
    }
    
    /**
     * Test focus management
     */
    _testFocusManagement(component) {
        const focusableElements = component.shadowRoot.querySelectorAll(
            'button, a, input, select, textarea, [tabindex]'
        );
        
        let hasVisibleFocus = true;
        const focusIssues = [];
        
        focusableElements.forEach(el => {
            // Check for focus styles
            el.focus();
            const beforeStyle = getComputedStyle(el);
            const beforeOutline = beforeStyle.outline;
            const beforeBoxShadow = beforeStyle.boxShadow;
            
            el.blur();
            const afterStyle = getComputedStyle(el);
            
            if (beforeOutline === afterStyle.outline && 
                beforeBoxShadow === afterStyle.boxShadow &&
                beforeOutline === 'none' && 
                beforeBoxShadow === 'none') {
                hasVisibleFocus = false;
                focusIssues.push(`${el.tagName} lacks visible focus indicator`);
            }
        });
        
        return {
            type: 'accessibility',
            name: 'Focus management',
            passed: hasVisibleFocus,
            details: {
                focusableElements: focusableElements.length,
                hasVisibleFocus,
                issues: focusIssues
            }
        };
    }
    
    /**
     * Functionality testing
     */
    async _testFunctionality(ComponentClass, props) {
        const results = [];
        
        // Test lifecycle methods
        const lifecycleResult = await this._testLifecycle(ComponentClass, props);
        results.push(lifecycleResult);
        
        // Test state management
        if (ComponentClass.prototype.state || props.state) {
            const stateResult = await this._testStateManagement(ComponentClass, props);
            results.push(stateResult);
        }
        
        // Test event handling
        const eventResult = await this._testEventHandling(ComponentClass, props);
        results.push(eventResult);
        
        return results;
    }
    
    /**
     * Test component lifecycle
     */
    async _testLifecycle(ComponentClass, props) {
        const lifecycle = [];
        
        // Override lifecycle methods
        const originalConnected = ComponentClass.prototype.connectedCallback;
        const originalDisconnected = ComponentClass.prototype.disconnectedCallback;
        
        ComponentClass.prototype.connectedCallback = function() {
            lifecycle.push('connected');
            if (originalConnected) originalConnected.call(this);
        };
        
        ComponentClass.prototype.disconnectedCallback = function() {
            lifecycle.push('disconnected');
            if (originalDisconnected) originalDisconnected.call(this);
        };
        
        // Test lifecycle
        const component = this._createComponent(ComponentClass, props);
        await this._waitForRender(component);
        component.remove();
        
        // Restore methods
        ComponentClass.prototype.connectedCallback = originalConnected;
        ComponentClass.prototype.disconnectedCallback = originalDisconnected;
        
        return {
            type: 'functionality',
            name: 'Lifecycle methods',
            passed: lifecycle.includes('connected') && lifecycle.includes('disconnected'),
            details: {
                lifecycle,
                expectedOrder: ['connected', 'disconnected']
            }
        };
    }
    
    /**
     * Test state management
     */
    async _testStateManagement(ComponentClass, props) {
        const component = this._createComponent(ComponentClass, props);
        await this._waitForRender(component);
        
        let stateWorks = false;
        let updateCount = 0;
        
        if (component.state) {
            // Subscribe to state changes
            const unsubscribe = component.state.subscribe(() => {
                updateCount++;
            });
            
            // Test state update
            const initialState = component.state.get();
            component.state.update(state => {
                state.testValue = 'test';
            });
            
            const updatedState = component.state.get();
            stateWorks = updatedState.testValue === 'test' && updateCount > 0;
            
            unsubscribe();
        }
        
        component.remove();
        
        return {
            type: 'functionality',
            name: 'State management',
            passed: stateWorks,
            details: {
                hasState: !!component.state,
                updateCount,
                stateWorks
            }
        };
    }
    
    /**
     * Test event handling
     */
    async _testEventHandling(ComponentClass, props) {
        const component = this._createComponent(ComponentClass, props);
        await this._waitForRender(component);
        
        const events = [];
        let customEventWorks = false;
        
        // Listen for custom events
        component.addEventListener('test-event', (e) => {
            events.push(e.type);
            customEventWorks = e.detail?.test === true;
        });
        
        // Dispatch test event
        component.dispatchEvent(new CustomEvent('test-event', {
            detail: { test: true }
        }));
        
        // Test click handling
        const clickable = component.shadowRoot.querySelector('button, a');
        if (clickable) {
            clickable.addEventListener('click', () => {
                events.push('click');
            });
            clickable.click();
        }
        
        component.remove();
        
        return {
            type: 'functionality',
            name: 'Event handling',
            passed: customEventWorks,
            details: {
                events,
                customEventWorks,
                hasClickable: !!clickable
            }
        };
    }
    
    /**
     * Create component instance
     */
    _createComponent(ComponentClass, props) {
        const component = new ComponentClass();
        
        // Apply props
        Object.entries(props).forEach(([key, value]) => {
            if (key === 'state' && component.state) {
                component.state.set(value);
            } else if (typeof value !== 'object') {
                component.setAttribute(key, value);
            } else {
                component[key] = value;
            }
        });
        
        this._testContainer.appendChild(component);
        return component;
    }
    
    /**
     * Wait for component render
     */
    async _waitForRender(component) {
        await new Promise(resolve => {
            if (component.updateComplete) {
                component.updateComplete.then(resolve);
            } else {
                requestAnimationFrame(() => {
                    requestAnimationFrame(resolve);
                });
            }
        });
    }
    
    /**
     * Set viewport size
     */
    _setViewport(viewport) {
        this._testContainer.style.width = `${viewport.width}px`;
        this._testContainer.style.height = `${viewport.height}px`;
    }
    
    /**
     * Take snapshot
     */
    async _takeSnapshot(component) {
        // For real implementation, would use html2canvas or similar
        // Here we'll create a simplified snapshot
        const bounds = component.getBoundingClientRect();
        const computedStyle = getComputedStyle(component);
        
        return {
            width: bounds.width,
            height: bounds.height,
            html: component.shadowRoot.innerHTML,
            styles: {
                backgroundColor: computedStyle.backgroundColor,
                color: computedStyle.color,
                fontSize: computedStyle.fontSize
            }
        };
    }
    
    /**
     * Compare snapshots
     */
    _compareSnapshots(componentName, testCase, snapshot) {
        const key = `${componentName}-${testCase}`;
        const baseline = this._snapshots.get(key);
        
        if (!baseline) {
            // Store as baseline
            this._snapshots.set(key, snapshot);
            return {
                difference: 0,
                isNew: true
            };
        }
        
        // Simple comparison
        let difference = 0;
        
        if (baseline.width !== snapshot.width || 
            baseline.height !== snapshot.height) {
            difference += 0.5;
        }
        
        if (baseline.html !== snapshot.html) {
            difference += 0.3;
        }
        
        Object.entries(baseline.styles).forEach(([key, value]) => {
            if (snapshot.styles[key] !== value) {
                difference += 0.1;
            }
        });
        
        return {
            difference,
            isNew: false,
            changes: difference > 0
        };
    }
    
    /**
     * Setup performance observer
     */
    _setupPerformanceObserver() {
        this._performanceObserver = new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
                // Store performance entries for analysis
                if (!this._performanceEntries) {
                    this._performanceEntries = [];
                }
                this._performanceEntries.push(entry);
            }
        });
        
        this._performanceObserver.observe({ 
            entryTypes: ['measure', 'navigation', 'resource'] 
        });
    }
    
    /**
     * Get background color
     */
    _getBackgroundColor(element) {
        let bgColor = getComputedStyle(element).backgroundColor;
        
        if (bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)') {
            const parent = element.parentElement;
            if (parent) {
                return this._getBackgroundColor(parent);
            }
        }
        
        return bgColor;
    }
    
    /**
     * Calculate color contrast
     */
    _calculateContrast(bg, fg) {
        // Simplified contrast calculation
        const getLuminance = (color) => {
            const rgb = color.match(/\d+/g);
            if (!rgb) return 0;
            
            const [r, g, b] = rgb.map(x => {
                const c = parseInt(x) / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        
        const bgLum = getLuminance(bg);
        const fgLum = getLuminance(fg);
        
        const lighter = Math.max(bgLum, fgLum);
        const darker = Math.min(bgLum, fgLum);
        
        return (lighter + 0.05) / (darker + 0.05);
    }
    
    /**
     * Check if role is valid
     */
    _isValidRole(role) {
        const validRoles = [
            'button', 'link', 'checkbox', 'radio', 'textbox',
            'navigation', 'main', 'banner', 'contentinfo',
            'menu', 'menuitem', 'tab', 'tabpanel', 'dialog',
            'alert', 'status', 'progressbar', 'slider'
        ];
        
        return validRoles.includes(role);
    }
    
    /**
     * Generate test report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0
            },
            components: {}
        };
        
        Object.entries(this._results).forEach(([component, results]) => {
            if (results.tests) {
                report.components[component] = {
                    total: results.tests.length,
                    passed: results.tests.filter(t => t.passed).length,
                    failed: results.tests.filter(t => !t.passed && !t.skipped).length,
                    skipped: results.tests.filter(t => t.skipped).length,
                    tests: results.tests
                };
                
                report.summary.total += results.tests.length;
                report.summary.passed += report.components[component].passed;
                report.summary.failed += report.components[component].failed;
                report.summary.skipped += report.components[component].skipped;
            }
        });
        
        report.summary.passRate = report.summary.total > 0 
            ? (report.summary.passed / report.summary.total * 100).toFixed(2) + '%'
            : '0%';
        
        return report;
    }
    
    /**
     * Export snapshots
     */
    exportSnapshots() {
        const snapshots = {};
        this._snapshots.forEach((snapshot, key) => {
            snapshots[key] = snapshot;
        });
        return JSON.stringify(snapshots, null, 2);
    }
    
    /**
     * Import snapshots
     */
    importSnapshots(json) {
        try {
            const snapshots = JSON.parse(json);
            Object.entries(snapshots).forEach(([key, snapshot]) => {
                this._snapshots.set(key, snapshot);
            });
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this._performanceObserver) {
            this._performanceObserver.disconnect();
        }
        
        if (this._testContainer) {
            this._testContainer.remove();
        }
        
        this._results = {};
        this._snapshots.clear();
    }
}

// Export singleton
export const testHarness = new ComponentTestHarness();