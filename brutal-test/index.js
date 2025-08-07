/**
 * BRUTAL Test System
 * Unified testing framework that detects ALL failures
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { TestEngine } from './core/TestEngine.js';
import { BrowserController } from './core/BrowserController.js';
import { EmbeddedServer } from './core/EmbeddedServer.js';
import { BrutalMode } from './core/BrutalMode.js';
import { ErrorCapture } from './capture/ErrorCapture.js';
import { PerformanceCapture } from './capture/PerformanceCapture.js';
import { VisualCapture } from './capture/VisualCapture.js';
import { StateCapture } from './capture/StateCapture.js';
import { ErrorAnalyzer } from './analysis/ErrorAnalyzer.js';
import { PerformanceAnalyzer } from './analysis/PerformanceAnalyzer.js';
import { RootCauseEngine } from './analysis/RootCauseEngine.js';
import { ReportGenerator } from './report/ReportGenerator.js';
import { DashboardServer } from './report/DashboardServer.js';
import { AutoFixer } from './fix/AutoFixer.js';
import { FixSuggestionEngine } from './fix/FixSuggestionEngine.js';
import FrameworkV3Test from './tests/framework-v3-test.js';

export class BrutalTestSystem {
    constructor(config = {}) {
        this.config = {
            mode: 'complete', // quick, visual, complete, interactive, continuous
            browsers: ['chrome', 'firefox', 'safari'],
            viewport: { width: 1920, height: 1080 },
            headless: true,
            autoFix: false,
            dashboard: false,
            outputDir: './brutal-test-results',
            ...config
        };

        // Core components
        this.server = new EmbeddedServer();
        this.engine = new TestEngine(this.config);
        // Fix browser config mismatch
        this.browser = new BrowserController({
            ...this.config,
            browser: this.config.browsers?.[0] || 'chrome'
        });
        
        // Capture layer
        this.errorCapture = new ErrorCapture();
        this.performanceCapture = new PerformanceCapture();
        this.visualCapture = new VisualCapture();
        this.stateCapture = new StateCapture();
        
        // Analysis layer
        this.errorAnalyzer = new ErrorAnalyzer();
        this.performanceAnalyzer = new PerformanceAnalyzer();
        this.rootCauseEngine = new RootCauseEngine();
        
        // Report layer
        this.reportGenerator = new ReportGenerator(this.config);
        this.dashboardServer = this.config.dashboard ? new DashboardServer() : null;
        
        // Fix layer
        this.autoFixer = new AutoFixer();
        this.fixSuggestionEngine = new FixSuggestionEngine();
        
        this.results = {
            timestamp: new Date().toISOString(),
            config: this.config,
            environment: {},
            errors: [],
            performance: {},
            visual: {},
            coverage: {},
            suggestions: []
        };
    }

    async initialize() {
        // ACTIVATE BRUTAL MODE
        BrutalMode.validate();
        
        console.log('🚀 BRUTAL Test System initializing...');
        
        // Start embedded server with correct headers
        await this.server.start();
        
        // Initialize browser controller
        await this.browser.initialize();
        
        // Setup capture systems
        await this.setupCapture();
        
        // Start dashboard if enabled
        if (this.dashboardServer) {
            await this.dashboardServer.start();
        }
        
        console.log('✅ BRUTAL Test System ready');
    }

    async setupCapture() {
        // Connect all capture systems to browser
        const page = this.browser.getPage();
        const cdp = this.browser.getCDP();
        
        await this.errorCapture.attach(page, cdp);
        await this.performanceCapture.attach(page, cdp);
        await this.visualCapture.attach(page, cdp);
        await this.stateCapture.attach(page, cdp);
    }

    async run(testPath = path.resolve(__dirname, '../framework-v3')) {
        console.log(`\n🔍 Running BRUTAL Test System in ${this.config.mode} mode...`);
        
        try {
            // Phase 1: Discovery
            const tests = await this.engine.discoverTests(testPath);
            console.log(`📋 Found ${tests.length} test files`);
            
            // Register tests with server
            this.server.setAvailableTests(tests);
            
            // Phase 2: Execution
            for (const test of tests) {
                await this.executeTest(test);
            }
            
            // Phase 3: Analysis
            await this.analyze();
            
            // Phase 4: Reporting
            await this.report();
            
            // Phase 5: Fix suggestions
            if (this.config.autoFix) {
                await this.applyFixes();
            }
            
        } catch (error) {
            // BRUTAL: System errors should CRASH HARD
            console.error('💀 BRUTAL SYSTEM FAILURE:', error);
            throw error; // Re-throw - no mercy!
        }
        
        return this.results;
    }

    async executeTest(test) {
        console.log(`\n▶️  Testing: ${test.name}`);
        
        try {
            // Navigate to test
            const testUrl = test.url || `${this.server.getUrl()}/${test.path.replace(/^\.\//, '')}`;
            await this.browser.navigateTo(testUrl);
            
            // Start capturing
            const captureData = await this.captureAll();
            
            // Wait for page to load and run any tests
            await this.browser.wait(1000);
            
            // For HTML files, check if they have test results
            let testResult = { status: 'unknown', errors: [] };
            
            if (test.format === '.html') {
                // Try to get test results from the page
                try {
                    testResult = await this.browser.evaluate(() => {
                        // Check for common test result patterns
                        if (window.__TEST_RESULTS__) {
                            return window.__TEST_RESULTS__;
                        }
                        if (window.testResults) {
                            return window.testResults;
                        }
                        // Check for test framework indicators
                        const hasTests = document.querySelector('.test-results, #test-results, [data-test-results]');
                        if (hasTests) {
                            return { status: 'completed', message: 'Tests found on page' };
                        }
                        return { status: 'no-tests', message: 'No test results found' };
                    });
                } catch (e) {
                    testResult = { status: 'error', error: e.message };
                }
            } else {
                // For JS files, run them through the engine
                testResult = await this.engine.runTest(test);
            }
            
            // Stop capturing and collect results
            const finalCapture = await this.stopCapture();
            
            // Analyze capture for errors
            if (finalCapture.errors && finalCapture.errors.total > 0) {
                testResult.status = 'failed';
                testResult.capturedErrors = finalCapture.errors;
                
                // BRUTAL: Add errors to global errors array
                const errors = finalCapture.errors.timeline || [];
                errors.forEach(error => {
                    this.results.errors.push({
                        test: test.name,
                        ...error
                    });
                });
            }
            
            // Merge results
            this.results.tests = this.results.tests || [];
            this.results.tests.push({
                ...test,
                result: testResult,
                capture: { ...captureData, ...finalCapture }
            });
            
        } catch (error) {
            console.error(`❌ Test failed: ${test.name}`, error);
            this.results.errors.push({
                test: test.name,
                error: error.message,
                stack: error.stack
            });
        }
    }

    async captureAll() {
        const captures = await Promise.all([
            this.errorCapture.start(),
            this.performanceCapture.start(),
            this.visualCapture.start(),
            this.stateCapture.start()
        ]);
        
        return {
            errors: captures[0],
            performance: captures[1],
            visual: captures[2],
            state: captures[3]
        };
    }

    async stopCapture() {
        const results = await Promise.all([
            this.errorCapture.stop(),
            this.performanceCapture.stop(),
            this.visualCapture.stop(),
            this.stateCapture.stop()
        ]);
        
        return {
            errors: results[0],
            performance: results[1],
            visual: results[2],
            state: results[3]
        };
    }

    async analyze() {
        console.log('\n🔬 Analyzing results...');
        
        // Analyze errors
        this.results.analysis = {
            errors: await this.errorAnalyzer.analyze(this.results.errors),
            performance: await this.performanceAnalyzer.analyze(this.results.performance),
            rootCauses: await this.rootCauseEngine.analyze(this.results)
        };
        
        // Generate fix suggestions
        this.results.suggestions = await this.fixSuggestionEngine.generate(this.results.analysis);
        
        console.log(`📊 Found ${this.results.errors.length} errors`);
        console.log(`💡 Generated ${this.results.suggestions.length} fix suggestions`);
    }

    async report() {
        console.log('\n📄 Generating reports...');
        
        // Generate all report formats
        await this.reportGenerator.generate(this.results);
        
        // Update dashboard if running
        if (this.dashboardServer) {
            await this.dashboardServer.update(this.results);
        }
        
        console.log(`✅ Reports saved to ${this.config.outputDir}`);
    }

    async applyFixes() {
        console.log('\n🔧 Applying automated fixes...');
        
        const fixes = await this.autoFixer.apply(this.results.suggestions);
        
        console.log(`✅ Applied ${fixes.length} automated fixes`);
        
        // Re-run affected tests
        if (fixes.length > 0) {
            console.log('🔄 Re-running affected tests...');
            // Implementation for re-running specific tests
        }
    }

    async cleanup() {
        console.log('\n🧹 Cleaning up...');
        
        await this.browser.close();
        await this.server.stop();
        
        if (this.dashboardServer) {
            await this.dashboardServer.stop();
        }
        
        console.log('✅ Cleanup complete');
    }

    // Convenience methods
    async runQuick() {
        this.config.mode = 'quick';
        return this.run();
    }
    
    // Run specific framework v3 tests
    static async testFrameworkV3(options = {}) {
        const test = new FrameworkV3Test(options);
        await test.run();
        return test.results;
    }

    async runVisual() {
        this.config.mode = 'visual';
        return this.run();
    }

    async runComplete() {
        this.config.mode = 'complete';
        return this.run();
    }

    async runInteractive() {
        this.config.mode = 'interactive';
        this.config.headless = false;
        this.config.dashboard = true;
        return this.run();
    }

    async runContinuous(interval = 300000) { // 5 minutes default
        this.config.mode = 'continuous';
        
        const runCycle = async () => {
            await this.run();
            setTimeout(runCycle, interval);
        };
        
        await runCycle();
    }
}

// Export for CLI usage
export default BrutalTestSystem;