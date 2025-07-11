/**
 * @fileoverview BRUTAL V3 - Automated Visual Tester
 * Ensures everything is working correctly without human intervention
 * @version 3.0.0
 */

import { ComponentMonitor } from './ComponentMonitor.js';

/**
 * Automated Visual Tester - Continuous visual verification
 */
export class AutomatedVisualTester {
    constructor(options = {}) {
        this.enabled = options.enabled ?? true;
        this.puppeteerEnabled = options.puppeteer ?? false;
        
        // Test configuration
        this.config = {
            screenshotInterval: options.screenshotInterval || 5000, // 5 seconds
            performanceThresholds: {
                fps: 30,
                renderTime: 16, // 1 frame
                memoryGrowth: 10, // MB per minute
                errorRate: 0.01 // 1% error rate
            },
            visualChecks: {
                componentRendering: true,
                stateFlowActive: true,
                noVisualGlitches: true,
                particlesWorking: true
            }
        };
        
        // Test results
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            history: [],
            lastCheck: null
        };
        
        // Automated logs
        this.logs = [];
        this.maxLogs = 1000;
        
        // Performance baseline
        this.baseline = null;
        this.anomalies = [];
        
        // Visual regression
        this.screenshots = new Map();
        this.visualDiffs = [];
        
        // Puppeteer instance (if available)
        this.browser = null;
        this.page = null;
        
        // V8 optimization
        this._boundRunTests = this._runAutomatedTests.bind(this);
        this._testInterval = null;
    }
    
    /**
     * Initialize automated testing
     */
    async init() {
        if (!this.enabled) return;
        
        // Establish baseline
        await this._establishBaseline();
        
        // Initialize Puppeteer if requested
        if (this.puppeteerEnabled) {
            await this._initPuppeteer();
        }
        
        // Start automated testing
        this._startAutomatedTesting();
        
        // Hook into system events
        this._attachEventListeners();
        
        // Expose API
        window.__BRUTAL_VISUAL_TESTER__ = this;
    }
    
    /**
     * Initialize Puppeteer for headless testing
     */
    async _initPuppeteer() {
        try {
            // Dynamic import to avoid dependency if not needed
            const puppeteer = await import('puppeteer');
            
            this.browser = await puppeteer.default.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--enable-features=SharedArrayBuffer'
                ]
            });
            
            this.page = await this.browser.newPage();
            
            // Set viewport
            await this.page.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1
            });
            
            // Enable console logging
            this.page.on('console', msg => {
                this._log('browser-console', msg.text(), msg.type());
            });
            
            // Capture errors
            this.page.on('pageerror', error => {
                this._log('browser-error', error.message, 'error');
                this._recordAnomaly('browser-error', error);
            });
            
            } catch (error) {
            this.puppeteerEnabled = false;
        }
    }
    
    /**
     * Establish performance baseline
     */
    async _establishBaseline() {
        this._log('baseline', 'Establishing performance baseline...');
        
        // Wait for stable state
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Collect baseline metrics
        const metrics = await this._collectMetrics();
        
        this.baseline = {
            timestamp: Date.now(),
            fps: metrics.fps,
            memory: metrics.memory,
            renderTime: metrics.renderTime,
            componentCount: metrics.componentCount,
            errorRate: 0
        };
        
        this._log('baseline', `Baseline established: ${JSON.stringify(this.baseline)}`);
    }
    
    /**
     * Start automated testing loop
     */
    _startAutomatedTesting() {
        // Run tests immediately
        this._runAutomatedTests();
        
        // Schedule regular tests
        this._testInterval = setInterval(this._boundRunTests, this.config.screenshotInterval);
    }
    
    /**
     * Run automated tests
     */
    async _runAutomatedTests() {
        const testRun = {
            timestamp: Date.now(),
            tests: [],
            passed: 0,
            failed: 0,
            warnings: 0
        };
        
        try {
            // 1. Performance Tests
            const perfTests = await this._runPerformanceTests();
            testRun.tests.push(...perfTests);
            
            // 2. Visual Tests
            const visualTests = await this._runVisualTests();
            testRun.tests.push(...visualTests);
            
            // 3. Component Tests
            const componentTests = await this._runComponentTests();
            testRun.tests.push(...componentTests);
            
            // 4. Memory Tests
            const memoryTests = await this._runMemoryTests();
            testRun.tests.push(...memoryTests);
            
            // 5. Error Rate Tests
            const errorTests = await this._runErrorTests();
            testRun.tests.push(...errorTests);
            
            // Count results
            for (const test of testRun.tests) {
                if (test.status === 'passed') testRun.passed++;
                else if (test.status === 'failed') testRun.failed++;
                else if (test.status === 'warning') testRun.warnings++;
            }
            
            // Update totals
            this.results.passed += testRun.passed;
            this.results.failed += testRun.failed;
            this.results.warnings += testRun.warnings;
            this.results.lastCheck = testRun;
            
            // Store in history
            this.results.history.push(testRun);
            if (this.results.history.length > 100) {
                this.results.history.shift();
            }
            
            // Take screenshot if needed
            if (this.puppeteerEnabled && (testRun.failed > 0 || testRun.warnings > 0)) {
                await this._captureScreenshot('test-failure');
            }
            
            // Log summary
            this._log('test-run', 
                `Tests completed: ${testRun.passed} passed, ${testRun.failed} failed, ${testRun.warnings} warnings`
            );
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('brutal:visual-test-complete', {
                detail: testRun
            }));
            
        } catch (error) {
            this._log('test-error', `Test run failed: ${error.message}`, 'error');
            this._recordAnomaly('test-failure', error);
        }
    }
    
    /**
     * Run performance tests
     */
    async _runPerformanceTests() {
        const tests = [];
        const metrics = await this._collectMetrics();
        
        // FPS Test
        tests.push({
            name: 'FPS Check',
            expected: `>= ${this.config.performanceThresholds.fps}`,
            actual: metrics.fps,
            status: metrics.fps >= this.config.performanceThresholds.fps ? 'passed' : 'failed'
        });
        
        // Render Time Test
        tests.push({
            name: 'Render Time',
            expected: `<= ${this.config.performanceThresholds.renderTime}ms`,
            actual: `${metrics.renderTime.toFixed(2)}ms`,
            status: metrics.renderTime <= this.config.performanceThresholds.renderTime ? 'passed' : 'warning'
        });
        
        // Performance Degradation Test
        if (this.baseline) {
            const degradation = ((this.baseline.fps - metrics.fps) / this.baseline.fps) * 100;
            tests.push({
                name: 'Performance Degradation',
                expected: '< 10%',
                actual: `${degradation.toFixed(1)}%`,
                status: degradation < 10 ? 'passed' : 'warning'
            });
        }
        
        return tests;
    }
    
    /**
     * Run visual tests
     */
    async _runVisualTests() {
        const tests = [];
        
        // Component Rendering Test
        const componentsVisible = await this._checkComponentsVisible();
        tests.push({
            name: 'Components Rendering',
            expected: 'All visible',
            actual: componentsVisible ? 'All visible' : 'Some hidden',
            status: componentsVisible ? 'passed' : 'failed'
        });
        
        // Particle System Test
        const particlesActive = await this._checkParticlesActive();
        tests.push({
            name: 'Particle Effects',
            expected: 'Active',
            actual: particlesActive ? 'Active' : 'Inactive',
            status: particlesActive ? 'passed' : 'warning'
        });
        
        // Visual Regression Test (if Puppeteer available)
        if (this.puppeteerEnabled) {
            const regressionResult = await this._checkVisualRegression();
            tests.push({
                name: 'Visual Regression',
                expected: 'No changes',
                actual: regressionResult.changes ? `${regressionResult.changes} changes` : 'No changes',
                status: regressionResult.changes === 0 ? 'passed' : 'warning'
            });
        }
        
        return tests;
    }
    
    /**
     * Run component tests
     */
    async _runComponentTests() {
        const tests = [];
        const monitor = window.__BRUTAL_DEBUG__?.componentMonitor;
        
        if (!monitor) {
            tests.push({
                name: 'Component Monitor',
                expected: 'Available',
                actual: 'Not found',
                status: 'warning'
            });
            return tests;
        }
        
        const report = monitor.getReport();
        
        // Active Components Test
        tests.push({
            name: 'Active Components',
            expected: '> 0',
            actual: report.summary.activeComponents,
            status: report.summary.activeComponents > 0 ? 'passed' : 'warning'
        });
        
        // Component Errors Test
        const errorRate = report.summary.totalErrors / Math.max(report.summary.totalRenders, 1);
        tests.push({
            name: 'Component Error Rate',
            expected: `< ${this.config.performanceThresholds.errorRate * 100}%`,
            actual: `${(errorRate * 100).toFixed(2)}%`,
            status: errorRate < this.config.performanceThresholds.errorRate ? 'passed' : 'failed'
        });
        
        return tests;
    }
    
    /**
     * Run memory tests
     */
    async _runMemoryTests() {
        const tests = [];
        
        if (!performance.memory) {
            tests.push({
                name: 'Memory Monitoring',
                expected: 'Available',
                actual: 'Not supported',
                status: 'warning'
            });
            return tests;
        }
        
        const currentMemory = performance.memory.usedJSHeapSize / 1024 / 1024;
        
        // Memory Usage Test
        const memoryLimit = performance.memory.jsHeapSizeLimit / 1024 / 1024;
        const memoryUsage = (currentMemory / memoryLimit) * 100;
        tests.push({
            name: 'Memory Usage',
            expected: '< 80%',
            actual: `${memoryUsage.toFixed(1)}%`,
            status: memoryUsage < 80 ? 'passed' : 'warning'
        });
        
        // Memory Leak Test
        if (this.baseline) {
            const timeDiff = (Date.now() - this.baseline.timestamp) / 60000; // minutes
            const memoryGrowth = (currentMemory - this.baseline.memory) / Math.max(timeDiff, 1);
            
            tests.push({
                name: 'Memory Growth Rate',
                expected: `< ${this.config.performanceThresholds.memoryGrowth}MB/min`,
                actual: `${memoryGrowth.toFixed(2)}MB/min`,
                status: memoryGrowth < this.config.performanceThresholds.memoryGrowth ? 'passed' : 'failed'
            });
        }
        
        return tests;
    }
    
    /**
     * Run error tests
     */
    async _runErrorTests() {
        const tests = [];
        
        // Console Errors Test
        const recentErrors = this.logs.filter(log => 
            log.level === 'error' && 
            Date.now() - log.timestamp < 60000 // Last minute
        );
        
        tests.push({
            name: 'Console Errors (1min)',
            expected: '0',
            actual: recentErrors.length,
            status: recentErrors.length === 0 ? 'passed' : 'warning'
        });
        
        // Anomalies Test
        const recentAnomalies = this.anomalies.filter(a => 
            Date.now() - a.timestamp < 300000 // Last 5 minutes
        );
        
        tests.push({
            name: 'System Anomalies (5min)',
            expected: '0',
            actual: recentAnomalies.length,
            status: recentAnomalies.length === 0 ? 'passed' : 'failed'
        });
        
        return tests;
    }
    
    /**
     * Collect current metrics
     */
    async _collectMetrics() {
        const perfHUD = window.__BRUTAL_DEBUG__?.performanceHUD;
        const monitor = window.__BRUTAL_DEBUG__?.componentMonitor;
        
        return {
            fps: perfHUD?.fps || 0,
            memory: performance.memory?.usedJSHeapSize / 1024 / 1024 || 0,
            renderTime: perfHUD?.frameTime || 0,
            componentCount: monitor?.metrics.activeComponents || 0,
            timestamp: Date.now()
        };
    }
    
    /**
     * Check if components are visible
     */
    async _checkComponentsVisible() {
        const components = document.querySelectorAll('*');
        let visibleCount = 0;
        let customElementCount = 0;
        
        for (const component of components) {
            if (component.tagName.includes('-')) {
                customElementCount++;
                const rect = component.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    visibleCount++;
                }
            }
        }
        
        return customElementCount > 0 && visibleCount === customElementCount;
    }
    
    /**
     * Check if particles are active
     */
    async _checkParticlesActive() {
        const particleEngine = window.__BRUTAL_DEBUG__?.particleEngine;
        return particleEngine && particleEngine.particles?.length > 0;
    }
    
    /**
     * Check visual regression
     */
    async _checkVisualRegression() {
        if (!this.puppeteerEnabled) {
            return { changes: 0 };
        }
        
        try {
            // Take screenshot
            const screenshot = await this.page.screenshot({ fullPage: true });
            
            // Compare with baseline
            // (In production, use proper image diff library)
            const currentHash = this._hashBuffer(screenshot);
            const baselineHash = this.screenshots.get('baseline');
            
            if (!baselineHash) {
                this.screenshots.set('baseline', currentHash);
                return { changes: 0 };
            }
            
            const hasChanges = currentHash !== baselineHash;
            
            if (hasChanges) {
                this.visualDiffs.push({
                    timestamp: Date.now(),
                    baseline: baselineHash,
                    current: currentHash
                });
            }
            
            return { changes: hasChanges ? 1 : 0 };
            
        } catch (error) {
            this._log('visual-regression', `Failed: ${error.message}`, 'error');
            return { changes: -1 };
        }
    }
    
    /**
     * Capture screenshot
     */
    async _captureScreenshot(reason) {
        if (!this.puppeteerEnabled) return;
        
        try {
            const filename = `brutal-screenshot-${Date.now()}-${reason}.png`;
            await this.page.screenshot({ 
                path: filename,
                fullPage: true 
            });
            
            this._log('screenshot', `Captured: ${filename}`);
            
        } catch (error) {
            this._log('screenshot', `Failed: ${error.message}`, 'error');
        }
    }
    
    /**
     * Attach event listeners
     */
    _attachEventListeners() {
        // Override console methods to capture logs
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        
        console.log = (...args) => {
            this._log('console', args.join(' '), 'info');
            originalLog.apply(console, args);
        };
        
        console.warn = (...args) => {
            this._log('console', args.join(' '), 'warning');
            originalWarn.apply(console, args);
        };
        
        console.error = (...args) => {
            this._log('console', args.join(' '), 'error');
            this._recordAnomaly('console-error', { message: args.join(' ') });
            originalError.apply(console, args);
        };
        
        // Listen for framework events
        window.addEventListener('brutal:error', (event) => {
            this._recordAnomaly('component-error', event.detail);
        });
        
        window.addEventListener('brutal:slow-render', (event) => {
            this._recordAnomaly('slow-render', event.detail);
        });
        
        window.addEventListener('brutal:memory-pressure', (event) => {
            this._recordAnomaly('memory-pressure', event.detail);
        });
    }
    
    /**
     * Log message
     */
    _log(source, message, level = 'info') {
        const log = {
            timestamp: Date.now(),
            source,
            message,
            level
        };
        
        this.logs.push(log);
        
        // Trim logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
    }
    
    /**
     * Record anomaly
     */
    _recordAnomaly(type, details) {
        const anomaly = {
            timestamp: Date.now(),
            type,
            details
        };
        
        this.anomalies.push(anomaly);
        
        // Keep last 100 anomalies
        if (this.anomalies.length > 100) {
            this.anomalies.shift();
        }
        
        // Take screenshot of anomaly
        if (this.puppeteerEnabled) {
            this._captureScreenshot(`anomaly-${type}`);
        }
    }
    
    /**
     * Simple hash function for buffers
     */
    _hashBuffer(buffer) {
        let hash = 0;
        for (let i = 0; i < buffer.length; i++) {
            hash = ((hash << 5) - hash) + buffer[i];
            hash |= 0; // Convert to 32bit integer
        }
        return hash.toString(16);
    }
    
    /**
     * Get test report
     */
    getReport() {
        const report = {
            summary: {
                totalTests: this.results.passed + this.results.failed + this.results.warnings,
                passed: this.results.passed,
                failed: this.results.failed,
                warnings: this.results.warnings,
                successRate: (this.results.passed / Math.max(this.results.passed + this.results.failed, 1) * 100).toFixed(1) + '%'
            },
            lastCheck: this.results.lastCheck,
            recentAnomalies: this.anomalies.slice(-10),
            recentLogs: this.logs.filter(log => log.level === 'error').slice(-10),
            performanceBaseline: this.baseline,
            visualDiffs: this.visualDiffs.length
        };
        
        return report;
    }
    
    /**
     * Export full logs
     */
    exportLogs() {
        const data = {
            version: '3.0.0',
            timestamp: Date.now(),
            results: this.results,
            logs: this.logs,
            anomalies: this.anomalies,
            baseline: this.baseline,
            config: this.config
        };
        
        // Download as JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brutal-visual-test-${Date.now()}.json`;
        a.click();
        
        this._log('export', 'Logs exported successfully');
    }
    
    /**
     * Destroy the tester
     */
    async destroy() {
        // Stop testing
        if (this._testInterval) {
            clearInterval(this._testInterval);
            this._testInterval = null;
        }
        
        // Close Puppeteer
        if (this.browser) {
            await this.browser.close();
        }
        
        // Clean up
        delete window.__BRUTAL_VISUAL_TESTER__;
    }
}

// Auto-initialize if debug mode is enabled
if (window.__BRUTAL__ && window.__BRUTAL__.debug && window.__BRUTAL__.autoTest) {
    const tester = new AutomatedVisualTester({
        puppeteer: window.__BRUTAL__.puppeteer || false
    });
    tester.init().catch(console.error);
}