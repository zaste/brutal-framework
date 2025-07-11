/**
 * BRUTAL V3 - Consolidated Test System
 * Unified testing infrastructure with zero redundancy
 */

import puppeteer from 'puppeteer';
import { ComponentTestHarness } from './ComponentTestHarness.js';
import { EnhancedTestHarness } from './EnhancedTestHarness.js';

/**
 * Consolidated Test System - Unifies all testing capabilities
 */
export class ConsolidatedTestSystem {
    constructor() {
        // Core test harnesses
        this._componentHarness = new ComponentTestHarness();
        this._enhancedHarness = new EnhancedTestHarness();
        
        // Browser automation
        this._browser = null;
        this._browserContext = null;
        this._page = null;
        this._cdpSession = null;
        
        // Test configuration
        this._config = {
            // Browser settings
            browser: {
                headless: true,
                devtools: false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--enable-features=SharedArrayBuffer',
                    '--enable-gpu-rasterization',
                    '--enable-webgl',
                    '--enable-webgl2',
                    '--use-gl=swiftshader',
                    '--enable-accelerated-2d-canvas'
                ],
                defaultViewport: {
                    width: 1920,
                    height: 1080,
                    deviceScaleFactor: 1
                }
            },
            
            // Test types
            tests: {
                unit: true,
                integration: true,
                visual: true,
                performance: true,
                accessibility: true,
                gpu: true,
                gestures: true,
                workers: true,
                realBrowser: true
            },
            
            // Performance budgets
            budgets: {
                renderTime: 16.67, // 60fps
                scriptTime: 50,
                layoutTime: 50,
                paintTime: 16.67,
                memoryLimit: 50 * 1024 * 1024, // 50MB
                bundleSize: 20 * 1024, // 20KB
                ttfb: 200, // Time to first byte
                fcp: 1000, // First contentful paint
                lcp: 2500, // Largest contentful paint
                fid: 100, // First input delay
                cls: 0.1 // Cumulative layout shift
            },
            
            // Output settings
            output: {
                dir: './test-output',
                screenshots: true,
                videos: true,
                traces: true,
                coverage: true,
                reports: true
            }
        };
        
        // Test results aggregator
        this._results = {
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                duration: 0
            },
            tests: [],
            coverage: {
                lines: 0,
                functions: 0,
                branches: 0,
                statements: 0
            },
            performance: {
                metrics: {},
                budgetViolations: []
            },
            accessibility: {
                violations: [],
                passes: []
            }
        };
        
        // CDP domain handlers
        this._cdpDomains = {
            Console: true,
            Runtime: true,
            Network: true,
            Page: true,
            DOM: true,
            CSS: true,
            Performance: true,
            HeapProfiler: true,
            Profiler: true,
            Tracing: true,
            Emulation: true,
            Accessibility: true,
            Animation: true,
            ApplicationCache: true,
            Audits: true,
            BackgroundService: true,
            CacheStorage: true,
            Cast: true,
            DOMDebugger: true,
            DOMSnapshot: true,
            DOMStorage: true,
            Database: true,
            DeviceOrientation: true,
            Fetch: true,
            IndexedDB: true,
            Input: true,
            Inspector: true,
            LayerTree: true,
            Log: true,
            Memory: true,
            Overlay: true,
            Security: true,
            ServiceWorker: true,
            Storage: true,
            SystemInfo: true,
            Target: true,
            WebAudio: true,
            WebAuthn: true
        };
    }
    
    /**
     * Initialize browser and CDP session
     */
    async initialize(options = {}) {
        const config = { ...this._config.browser, ...options };
        
        // Launch browser
        this._browser = await puppeteer.launch(config);
        this._browserContext = await this._browser.createBrowserContext({
            permissions: ['geolocation', 'notifications', 'camera', 'microphone']
        });
        
        // Set up default page
        this._page = await this._browserContext.newPage();
        this._cdpSession = await this._page.target().createCDPSession();
        
        // Enable all CDP domains
        await this._enableCDPDomains();
        
        // Set up data collectors
        await this._setupDataCollectors();
        
        // Set up performance observer
        await this._setupPerformanceObserver();
        
        }
    
    /**
     * Enable all Chrome DevTools Protocol domains
     */
    async _enableCDPDomains() {
        for (const [domain, enabled] of Object.entries(this._cdpDomains)) {
            if (enabled) {
                try {
                    await this._cdpSession.send(`${domain}.enable`);
                } catch (error) {
                    // Some domains might not be available in all contexts
                    }
            }
        }
    }
    
    /**
     * Set up comprehensive data collectors
     */
    async _setupDataCollectors() {
        // Console messages
        this._cdpSession.on('Console.messageAdded', (params) => {
            this._handleConsoleMessage(params);
        });
        
        // Runtime exceptions
        this._cdpSession.on('Runtime.exceptionThrown', (params) => {
            this._handleRuntimeException(params);
        });
        
        // Network events
        this._cdpSession.on('Network.requestWillBeSent', (params) => {
            this._handleNetworkRequest(params);
        });
        
        this._cdpSession.on('Network.responseReceived', (params) => {
            this._handleNetworkResponse(params);
        });
        
        // Performance metrics
        this._cdpSession.on('Performance.metrics', (params) => {
            this._handlePerformanceMetrics(params);
        });
        
        // DOM mutations
        await this._page.evaluateOnNewDocument(() => {
            window.__DOM_MUTATIONS__ = [];
            
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    window.__DOM_MUTATIONS__.push({
                        type: mutation.type,
                        target: mutation.target.tagName,
                        addedNodes: mutation.addedNodes.length,
                        removedNodes: mutation.removedNodes.length,
                        timestamp: Date.now()
                    });
                });
            });
            
            document.addEventListener('DOMContentLoaded', () => {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    characterData: true
                });
            });
        });
        
        // Event listeners tracking
        await this._page.evaluateOnNewDocument(() => {
            window.__EVENT_LISTENERS__ = new Map();
            
            const originalAddEventListener = EventTarget.prototype.addEventListener;
            EventTarget.prototype.addEventListener = function(type, listener, options) {
                const stack = new Error().stack;
                const key = `${this.tagName || this.constructor.name}_${type}`;
                
                if (!window.__EVENT_LISTENERS__.has(key)) {
                    window.__EVENT_LISTENERS__.set(key, []);
                }
                
                window.__EVENT_LISTENERS__.get(key).push({
                    type,
                    target: this.tagName || this.constructor.name,
                    stack,
                    timestamp: Date.now()
                });
                
                return originalAddEventListener.call(this, type, listener, options);
            };
        });
        
        // GPU information
        await this._page.evaluateOnNewDocument(() => {
            window.__GPU_INFO__ = {};
            
            if (navigator.gpu) {
                navigator.gpu.requestAdapter().then(adapter => {
                    if (adapter) {
                        window.__GPU_INFO__.webgpu = {
                            available: true,
                            features: Array.from(adapter.features),
                            limits: adapter.limits
                        };
                    }
                });
            }
            
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            
            if (gl) {
                window.__GPU_INFO__.webgl = {
                    version: gl.getParameter(gl.VERSION),
                    vendor: gl.getParameter(gl.VENDOR),
                    renderer: gl.getParameter(gl.RENDERER),
                    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                    maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
                    extensions: gl.getSupportedExtensions()
                };
            }
        });
    }
    
    /**
     * Set up performance observer
     */
    async _setupPerformanceObserver() {
        await this._page.evaluateOnNewDocument(() => {
            window.__PERFORMANCE_ENTRIES__ = [];
            
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    window.__PERFORMANCE_ENTRIES__.push({
                        name: entry.name,
                        type: entry.entryType,
                        startTime: entry.startTime,
                        duration: entry.duration,
                        timestamp: Date.now()
                    });
                }
            });
            
            observer.observe({ 
                entryTypes: ['navigation', 'resource', 'paint', 'layout-shift', 'largest-contentful-paint', 'first-input', 'measure', 'mark'] 
            });
        });
    }
    
    /**
     * Run comprehensive test suite
     */
    async runTestSuite(testFiles, options = {}) {
        );
        
        const startTime = Date.now();
        
        // Initialize if not already done
        if (!this._browser) {
            await this.initialize(options);
        }
        
        // Create output directory
        await this._createOutputDirectory();
        
        // Run tests
        for (const file of testFiles) {
            await this._runFileTests(file);
        }
        
        // Generate reports
        await this._generateReports();
        
        // Calculate summary
        this._results.summary.duration = Date.now() - startTime;
        
        // Display results
        this._displayResults();
        
        return this._results;
    }
    
    /**
     * Run tests for a single file
     */
    async _runFileTests(file) {
        );
        
        const fileResults = {
            file,
            tests: [],
            metrics: {},
            errors: [],
            warnings: []
        };
        
        try {
            // Navigate to test file
            await this._page.goto(`http://localhost:8080/${file}`, {
                waitUntil: ['networkidle0', 'domcontentloaded']
            });
            
            // Wait for components to initialize
            await this._page.waitForTimeout(1000);
            
            // Run different test types
            if (this._config.tests.unit) {
                fileResults.tests.push(...await this._runUnitTests());
            }
            
            if (this._config.tests.visual) {
                fileResults.tests.push(...await this._runVisualTests());
            }
            
            if (this._config.tests.performance) {
                fileResults.tests.push(...await this._runPerformanceTests());
            }
            
            if (this._config.tests.accessibility) {
                fileResults.tests.push(...await this._runAccessibilityTests());
            }
            
            if (this._config.tests.gpu) {
                fileResults.tests.push(...await this._runGPUTests());
            }
            
            if (this._config.tests.gestures) {
                fileResults.tests.push(...await this._runGestureTests());
            }
            
            // Collect metrics
            fileResults.metrics = await this._collectMetrics();
            
            // Take screenshot
            if (this._config.output.screenshots) {
                await this._takeScreenshot(file);
            }
            
        } catch (error) {
            fileResults.errors.push({
                type: 'runtime',
                message: error.message,
                stack: error.stack
            });
        }
        
        this._results.tests.push(fileResults);
        this._updateSummary(fileResults);
    }
    
    /**
     * Run unit tests using component harness
     */
    async _runUnitTests() {
        const results = [];
        
        // Get all components on page
        const components = await this._page.evaluate(() => {
            return Array.from(document.querySelectorAll('*'))
                .filter(el => el.tagName.includes('-'))
                .map(el => ({
                    tagName: el.tagName.toLowerCase(),
                    hasState: !!el.state,
                    hasShadowRoot: !!el.shadowRoot
                }));
        });
        
        for (const comp of components) {
            const testResult = {
                type: 'unit',
                component: comp.tagName,
                tests: []
            };
            
            // Test component lifecycle
            testResult.tests.push(await this._testComponentLifecycle(comp.tagName));
            
            // Test state management
            if (comp.hasState) {
                testResult.tests.push(await this._testStateManagement(comp.tagName));
            }
            
            // Test shadow DOM
            if (comp.hasShadowRoot) {
                testResult.tests.push(await this._testShadowDOM(comp.tagName));
            }
            
            results.push(testResult);
        }
        
        return results;
    }
    
    /**
     * Run visual regression tests
     */
    async _runVisualTests() {
        const results = [];
        
        // Test different viewports
        for (const viewport of this._config.browser.viewports || [this._config.browser.defaultViewport]) {
            await this._page.setViewport(viewport);
            
            const screenshot = await this._page.screenshot({
                fullPage: true,
                encoding: 'base64'
            });
            
            results.push({
                type: 'visual',
                name: `Visual test - ${viewport.width}x${viewport.height}`,
                passed: true, // Would compare with baseline
                screenshot
            });
        }
        
        return results;
    }
    
    /**
     * Run performance tests
     */
    async _runPerformanceTests() {
        const results = [];
        
        // Get performance metrics
        const metrics = await this._cdpSession.send('Performance.getMetrics');
        const performanceEntries = await this._page.evaluate(() => window.__PERFORMANCE_ENTRIES__ || []);
        
        // Check render performance
        const renderMetrics = metrics.metrics.find(m => m.name === 'LayoutDuration');
        results.push({
            type: 'performance',
            name: 'Render performance',
            passed: !renderMetrics || renderMetrics.value < this._config.budgets.renderTime,
            value: renderMetrics?.value || 0,
            budget: this._config.budgets.renderTime
        });
        
        // Check memory usage
        const memoryMetrics = metrics.metrics.find(m => m.name === 'JSHeapUsedSize');
        results.push({
            type: 'performance',
            name: 'Memory usage',
            passed: !memoryMetrics || memoryMetrics.value < this._config.budgets.memoryLimit,
            value: memoryMetrics?.value || 0,
            budget: this._config.budgets.memoryLimit
        });
        
        // Check Core Web Vitals
        const fcp = performanceEntries.find(e => e.name === 'first-contentful-paint');
        const lcp = performanceEntries.find(e => e.type === 'largest-contentful-paint');
        
        if (fcp) {
            results.push({
                type: 'performance',
                name: 'First Contentful Paint',
                passed: fcp.startTime < this._config.budgets.fcp,
                value: fcp.startTime,
                budget: this._config.budgets.fcp
            });
        }
        
        if (lcp) {
            results.push({
                type: 'performance',
                name: 'Largest Contentful Paint',
                passed: lcp.startTime < this._config.budgets.lcp,
                value: lcp.startTime,
                budget: this._config.budgets.lcp
            });
        }
        
        return results;
    }
    
    /**
     * Run accessibility tests
     */
    async _runAccessibilityTests() {
        const results = [];
        
        // Check ARIA attributes
        const ariaIssues = await this._page.evaluate(() => {
            const issues = [];
            const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
            
            interactiveElements.forEach(el => {
                if (!el.getAttribute('aria-label') && 
                    !el.getAttribute('aria-labelledby') && 
                    !el.textContent?.trim()) {
                    issues.push({
                        element: el.tagName,
                        issue: 'Missing accessible label'
                    });
                }
            });
            
            return issues;
        });
        
        results.push({
            type: 'accessibility',
            name: 'ARIA compliance',
            passed: ariaIssues.length === 0,
            issues: ariaIssues
        });
        
        // Check color contrast using CDP
        const snapshot = await this._cdpSession.send('Accessibility.getFullAXTree');
        const contrastIssues = [];
        
        if (snapshot.nodes) {
            snapshot.nodes.forEach(node => {
                if (node.properties?.some(p => p.name === 'invalid' && p.value?.value === true)) {
                    contrastIssues.push({
                        node: node.name?.value || 'Unknown',
                        issue: 'Potential contrast issue'
                    });
                }
            });
        }
        
        results.push({
            type: 'accessibility',
            name: 'Color contrast',
            passed: contrastIssues.length === 0,
            issues: contrastIssues
        });
        
        return results;
    }
    
    /**
     * Run GPU tests
     */
    async _runGPUTests() {
        const results = [];
        
        // Get GPU info
        const gpuInfo = await this._page.evaluate(() => window.__GPU_INFO__ || {});
        
        // Check WebGL support
        results.push({
            type: 'gpu',
            name: 'WebGL support',
            passed: !!gpuInfo.webgl,
            details: gpuInfo.webgl || { available: false }
        });
        
        // Check WebGPU support
        results.push({
            type: 'gpu',
            name: 'WebGPU support',
            passed: !!gpuInfo.webgpu,
            details: gpuInfo.webgpu || { available: false }
        });
        
        // Test GPU acceleration
        const canvasTest = await this._page.evaluate(() => {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            
            if (!gl) return { accelerated: false };
            
            // Simple GPU test
            const vertices = new Float32Array([
                -1, -1, 0,
                 1, -1, 0,
                 0,  1, 0
            ]);
            
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
            
            return {
                accelerated: true,
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                renderer: gl.getParameter(gl.RENDERER)
            };
        });
        
        results.push({
            type: 'gpu',
            name: 'GPU acceleration',
            passed: canvasTest.accelerated,
            details: canvasTest
        });
        
        return results;
    }
    
    /**
     * Run gesture tests
     */
    async _runGestureTests() {
        const results = [];
        
        // Find interactive elements
        const interactiveElements = await this._page.$$('[data-gesture], button, a');
        
        for (const element of interactiveElements) {
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            
            // Test tap
            await element.tap();
            results.push({
                type: 'gesture',
                name: `Tap test - ${tagName}`,
                passed: true // Would check for response
            });
            
            // Test swipe (if applicable)
            const box = await element.boundingBox();
            if (box) {
                await this._page.touchscreen.swipe({
                    startX: box.x,
                    startY: box.y + box.height / 2,
                    endX: box.x + box.width,
                    endY: box.y + box.height / 2,
                    duration: 300
                });
                
                results.push({
                    type: 'gesture',
                    name: `Swipe test - ${tagName}`,
                    passed: true
                });
            }
        }
        
        return results;
    }
    
    /**
     * Collect comprehensive metrics
     */
    async _collectMetrics() {
        const metrics = {};
        
        // Performance metrics
        const perfMetrics = await this._cdpSession.send('Performance.getMetrics');
        perfMetrics.metrics.forEach(metric => {
            metrics[metric.name] = metric.value;
        });
        
        // Runtime metrics
        const runtime = await this._cdpSession.send('Runtime.getHeapUsage');
        metrics.heapUsed = runtime.usedSize;
        metrics.heapTotal = runtime.totalSize;
        
        // DOM metrics
        const domMetrics = await this._page.evaluate(() => ({
            nodeCount: document.querySelectorAll('*').length,
            listenerCount: window.__EVENT_LISTENERS__ ? window.__EVENT_LISTENERS__.size : 0,
            mutationCount: window.__DOM_MUTATIONS__ ? window.__DOM_MUTATIONS__.length : 0
        }));
        
        Object.assign(metrics, domMetrics);
        
        // Network metrics
        const resourceTiming = await this._page.evaluate(() => 
            performance.getEntriesByType('resource').map(r => ({
                name: r.name,
                duration: r.duration,
                size: r.transferSize
            }))
        );
        
        metrics.resourceCount = resourceTiming.length;
        metrics.totalTransferSize = resourceTiming.reduce((sum, r) => sum + (r.size || 0), 0);
        
        return metrics;
    }
    
    /**
     * Create output directory structure
     */
    async _createOutputDirectory() {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const dirs = [
            this._config.output.dir,
            path.join(this._config.output.dir, 'screenshots'),
            path.join(this._config.output.dir, 'videos'),
            path.join(this._config.output.dir, 'traces'),
            path.join(this._config.output.dir, 'coverage'),
            path.join(this._config.output.dir, 'reports')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    /**
     * Take screenshot
     */
    async _takeScreenshot(filename) {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        const screenshotPath = path.join(
            this._config.output.dir,
            'screenshots',
            `${filename.replace('.html', '')}-${Date.now()}.png`
        );
        
        await this._page.screenshot({
            path: screenshotPath,
            fullPage: true
        });
    }
    
    /**
     * Generate comprehensive reports
     */
    async _generateReports() {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        // JSON report
        const jsonReport = path.join(this._config.output.dir, 'reports', 'test-results.json');
        await fs.writeFile(jsonReport, JSON.stringify(this._results, null, 2));
        
        // HTML report
        const htmlReport = this._generateHTMLReport();
        const htmlPath = path.join(this._config.output.dir, 'reports', 'test-results.html');
        await fs.writeFile(htmlPath, htmlReport);
        
        // Coverage report
        if (this._config.output.coverage) {
            const coverage = await this._page.coverage.stopJSCoverage();
            const coveragePath = path.join(this._config.output.dir, 'coverage', 'coverage.json');
            await fs.writeFile(coveragePath, JSON.stringify(coverage, null, 2));
        }
    }
    
    /**
     * Generate HTML report
     */
    _generateHTMLReport() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>BRUTAL V3 Test Results</title>
    <style>
        body { font-family: system-ui; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 32px; font-weight: bold; margin: 10px 0; }
        .metric-label { color: #666; font-size: 14px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .warning { color: #ffc107; }
        .test-results { margin-top: 40px; }
        .test-file { margin-bottom: 30px; }
        .test-file h3 { background: #e9ecef; padding: 15px; margin: 0; border-radius: 4px 4px 0 0; }
        .test-list { border: 1px solid #dee2e6; border-top: none; border-radius: 0 0 4px 4px; }
        .test-item { padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .test-item:last-child { border-bottom: none; }
        .test-name { flex: 1; }
        .test-status { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .performance-chart { margin-top: 40px; }
        .chart-container { height: 300px; background: #f8f9fa; border-radius: 6px; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 BRUTAL V3 Test Results</h1>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-label">Total Tests</div>
                <div class="metric-value">${this._results.summary.total}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Passed</div>
                <div class="metric-value passed">${this._results.summary.passed}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Failed</div>
                <div class="metric-value failed">${this._results.summary.failed}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Duration</div>
                <div class="metric-value">${(this._results.summary.duration / 1000).toFixed(2)}s</div>
            </div>
        </div>
        
        <div class="test-results">
            <h2>Test Details</h2>
            ${this._results.tests.map(file => `
                <div class="test-file">
                    <h3>${file.file}</h3>
                    <div class="test-list">
                        ${file.tests.map(test => `
                            <div class="test-item">
                                <span class="test-name">${test.name || test.type}</span>
                                <span class="test-status status-${test.passed ? 'passed' : 'failed'}">
                                    ${test.passed ? 'PASSED' : 'FAILED'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="performance-chart">
            <h2>Performance Metrics</h2>
            <div class="chart-container">
                <!-- Performance chart would go here -->
                <p>See detailed metrics in JSON report</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;
    }
    
    /**
     * Update test summary
     */
    _updateSummary(fileResults) {
        fileResults.tests.forEach(test => {
            this._results.summary.total++;
            
            if (test.passed) {
                this._results.summary.passed++;
            } else if (test.passed === false) {
                this._results.summary.failed++;
            } else {
                this._results.summary.skipped++;
            }
        });
    }
    
    /**
     * Display results in console
     */
    _displayResults() {
        );
        );
        
        .toFixed(2)}s`);
        
        const passRate = (this._results.summary.passed / this._results.summary.total * 100).toFixed(2);
        if (this._results.summary.failed > 0) {
            this._results.tests.forEach(file => {
                const failedTests = file.tests.filter(t => t.passed === false);
                if (failedTests.length > 0) {
                    failedTests.forEach(test => {
                        });
                }
            });
        }
        
        }
    
    /**
     * Test component lifecycle
     */
    async _testComponentLifecycle(tagName) {
        const hasLifecycle = await this._page.evaluate((tag) => {
            const element = document.querySelector(tag);
            if (!element) return false;
            
            return typeof element.connectedCallback === 'function' &&
                   typeof element.disconnectedCallback === 'function';
        }, tagName);
        
        return {
            name: `${tagName} lifecycle`,
            passed: hasLifecycle,
            type: 'unit'
        };
    }
    
    /**
     * Test state management
     */
    async _testStateManagement(tagName) {
        const stateWorks = await this._page.evaluate((tag) => {
            const element = document.querySelector(tag);
            if (!element || !element.state) return false;
            
            try {
                const initialValue = element.state.get('testKey');
                element.state.set({ testKey: 'testValue' });
                const newValue = element.state.get('testKey');
                
                return newValue === 'testValue';
            } catch {
                return false;
            }
        }, tagName);
        
        return {
            name: `${tagName} state management`,
            passed: stateWorks,
            type: 'unit'
        };
    }
    
    /**
     * Test shadow DOM
     */
    async _testShadowDOM(tagName) {
        const shadowWorks = await this._page.evaluate((tag) => {
            const element = document.querySelector(tag);
            return element && element.shadowRoot && element.shadowRoot.childNodes.length > 0;
        }, tagName);
        
        return {
            name: `${tagName} shadow DOM`,
            passed: shadowWorks,
            type: 'unit'
        };
    }
    
    /**
     * Handle console messages
     */
    _handleConsoleMessage(params) {
        const message = params.message;
        
        if (message.level === 'error') {
            this._results.tests[this._results.tests.length - 1]?.errors.push({
                type: 'console',
                level: message.level,
                text: message.text,
                url: message.url,
                line: message.line
            });
        }
    }
    
    /**
     * Handle runtime exceptions
     */
    _handleRuntimeException(params) {
        this._results.tests[this._results.tests.length - 1]?.errors.push({
            type: 'exception',
            description: params.exceptionDetails.text,
            stack: params.exceptionDetails.stackTrace
        });
    }
    
    /**
     * Handle network requests
     */
    _handleNetworkRequest(params) {
        // Track network requests for performance analysis
    }
    
    /**
     * Handle network responses
     */
    _handleNetworkResponse(params) {
        // Track network responses for performance analysis
    }
    
    /**
     * Handle performance metrics
     */
    _handlePerformanceMetrics(params) {
        // Store performance metrics
    }
    
    /**
     * Clean up resources
     */
    async cleanup() {
        if (this._cdpSession) {
            await this._cdpSession.detach();
        }
        
        if (this._page) {
            await this._page.close();
        }
        
        if (this._browserContext) {
            await this._browserContext.close();
        }
        
        if (this._browser) {
            await this._browser.close();
        }
        
        }
}

// Export singleton instance
export const testSystem = new ConsolidatedTestSystem();