/**
 * URLRoutingTest - Self-Diagnostic Test for URL Routing Issues
 * 
 * This test demonstrates the error detection capabilities by
 * capturing its own routing errors - "para que pueda ver estos errores por si mismo"
 */

import { BrutalTest } from '../../core/BrutalTest.js';
import { html } from '../../../core/templates/index.js';

export class URLRoutingTest extends BrutalTest {
    constructor() {
        super();
        
        this._testState.set({
            name: 'URL Routing Diagnostic Test',
            description: 'Detects and reports URL routing issues in real-time',
            modulesToTest: [
                './components/BrutalTestDashboard.js',
                './components/BrutalTestRunner.js',
                './components/BrutalErrorPanel.js',
                './tests/core/RenderSchedulerTest.js',
                './tests/core/MemorySafetyTest.js'
            ],
            loadResults: [],
            customElementIssues: []
        });
    }
    
    async setup() {
        // Enable comprehensive error capture
        this._errorCapture.init();
        
        // Listen for specific error patterns
        this._errorCapture.on('error', (errorData) => {
            const { type, error } = errorData;
            
            // Detect 404 errors
            if (error.message?.includes('404') || 
                error.status === 404 ||
                error.message?.includes('Failed to fetch')) {
                this.recordRoutingError(error);
            }
            
            // Detect module loading errors
            if (type === 'module' || error.message?.includes('import')) {
                this.recordModuleError(error);
            }
            
            // Detect custom element issues
            if (type === 'custom-element') {
                this.recordCustomElementIssue(error);
            }
        });
    }
    
    async execute() {
        this.assert(true, 'Error detection initialized');
        
        // Test 1: Check for undefined custom elements
        await this.checkCustomElements();
        
        // Test 2: Attempt to load modules and capture errors
        await this.testModuleLoading();
        
        // Test 3: Monitor network requests
        await this.monitorNetworkRequests();
        
        // Test 4: Check current page for routing issues
        await this.analyzeCurrentPage();
        
        // Generate diagnostic report
        this.generateReport();
    }
    
    async checkCustomElements() {
        const undefinedElements = document.querySelectorAll(':not(:defined)');
        const customElements = Array.from(undefinedElements).filter(el => 
            el.tagName.toLowerCase().includes('-')
        );
        
        if (customElements.length > 0) {
            customElements.forEach(el => {
                const issue = {
                    tagName: el.tagName.toLowerCase(),
                    innerHTML: el.innerHTML.substring(0, 100),
                    hasChildren: el.children.length > 0,
                    timestamp: Date.now()
                };
                
                const issues = this._testState.get('customElementIssues');
                issues.push(issue);
                this._testState.set({ customElementIssues: issues });
            });
            
            this.assert(false, `Found ${customElements.length} undefined custom elements`);
        } else {
            this.assert(true, 'All custom elements are defined');
        }
    }
    
    async testModuleLoading() {
        const modules = this._testState.get('modulesToTest');
        const results = [];
        
        for (const modulePath of modules) {
            const result = await this.tryLoadModule(modulePath);
            results.push(result);
            
            this.assert(
                result.success, 
                `Module ${modulePath}: ${result.success ? 'loaded' : result.error}`
            );
        }
        
        this._testState.set({ loadResults: results });
    }
    
    async tryLoadModule(path) {
        const startTime = performance.now();
        
        try {
            // Attempt dynamic import
            const module = await import(path);
            
            return {
                path,
                success: true,
                duration: performance.now() - startTime,
                exports: Object.keys(module)
            };
        } catch (error) {
            return {
                path,
                success: false,
                duration: performance.now() - startTime,
                error: error.message,
                stack: error.stack
            };
        }
    }
    
    async monitorNetworkRequests() {
        // Get performance entries for resources
        const entries = performance.getEntriesByType('resource');
        const failedRequests = entries.filter(entry => 
            entry.responseStatus === 404 || 
            entry.responseStatus === 0 ||
            entry.transferSize === 0
        );
        
        if (failedRequests.length > 0) {
            this.assert(false, `Found ${failedRequests.length} failed network requests`);
            
            failedRequests.forEach(req => {
                this.recordRoutingError({
                    url: req.name,
                    status: req.responseStatus,
                    type: 'resource',
                    duration: req.duration
                });
            });
        } else {
            this.assert(true, 'No failed network requests detected');
        }
    }
    
    async analyzeCurrentPage() {
        // Check if we're on the demo page
        const isDemoPage = window.location.pathname.includes('demo.html');
        
        if (isDemoPage) {
            // Check for script errors in the page
            const scripts = document.querySelectorAll('script[type="module"]');
            this.assert(scripts.length > 0, `Found ${scripts.length} module scripts`);
            
            // Check console for errors
            const capturedErrors = this._errorCapture.getAllErrors();
            const criticalErrors = capturedErrors.filter(e => 
                e.category === 'runtime' || e.category === 'module'
            );
            
            if (criticalErrors.length > 0) {
                this.assert(false, `Found ${criticalErrors.length} critical errors`);
            }
        }
    }
    
    recordRoutingError(error) {
        const errors = this._testState.get('errors');
        errors.push({
            ...error,
            category: 'routing',
            diagnosis: this.diagnoseRoutingError(error)
        });
        this._testState.set({ errors });
    }
    
    recordModuleError(error) {
        const errors = this._testState.get('errors');
        errors.push({
            ...error,
            category: 'module',
            diagnosis: this.diagnoseModuleError(error)
        });
        this._testState.set({ errors });
    }
    
    recordCustomElementIssue(error) {
        const issues = this._testState.get('customElementIssues');
        if (!issues.some(i => i.tagName === error.tagName)) {
            issues.push(error);
            this._testState.set({ customElementIssues: issues });
        }
    }
    
    diagnoseRoutingError(error) {
        const url = error.url || error.filename || '';
        
        // Pattern 1: Custom element auto-loading
        if (url.includes('/brutal-') && url.endsWith('.js')) {
            return 'Browser attempting to auto-load custom element definition';
        }
        
        // Pattern 2: Incorrect base path
        if (url.includes('/components/') && !url.includes('/testing/')) {
            return 'Missing /testing/ prefix in component path';
        }
        
        // Pattern 3: Module resolution
        if (error.message?.includes('Failed to resolve module')) {
            return 'Module import path resolution failed';
        }
        
        return 'Unknown routing issue';
    }
    
    diagnoseModuleError(error) {
        if (error.message?.includes('Unexpected token')) {
            return 'Syntax error in module - check for parse errors';
        }
        
        if (error.message?.includes('Cannot find module')) {
            return 'Module path is incorrect or file does not exist';
        }
        
        if (error.message?.includes('MIME type')) {
            return 'Server not sending correct Content-Type for modules';
        }
        
        return 'General module loading error';
    }
    
    generateReport() {
        const state = this._testState.getAll();
        const report = {
            summary: {
                customElementIssues: state.customElementIssues.length,
                failedModules: state.loadResults.filter(r => !r.success).length,
                routingErrors: state.errors.filter(e => e.category === 'routing').length,
                totalErrors: this._errorCapture.getSummary().total
            },
            diagnosis: this.generateDiagnosis(),
            recommendations: this.generateRecommendations()
        };
        
        this._testState.set({ report });
        console.log('URL Routing Diagnostic Report:', report);
    }
    
    generateDiagnosis() {
        const issues = this._testState.get('customElementIssues');
        const errors = this._testState.get('errors');
        
        if (issues.length > 0 && errors.some(e => e.url?.includes('/brutal-'))) {
            return 'Custom elements are being parsed before module imports complete. Browser is attempting to auto-load component definitions.';
        }
        
        if (errors.some(e => e.diagnosis?.includes('Missing /testing/ prefix'))) {
            return 'Import paths are not correctly prefixed with the testing directory.';
        }
        
        return 'No specific routing pattern detected.';
    }
    
    generateRecommendations() {
        const recommendations = [];
        const issues = this._testState.get('customElementIssues');
        
        if (issues.length > 0) {
            recommendations.push({
                issue: 'Undefined custom elements',
                solution: 'Import all components before adding them to DOM',
                example: 'Use demo-fixed.html pattern: import first, then createElement'
            });
        }
        
        const failedModules = this._testState.get('loadResults').filter(r => !r.success);
        if (failedModules.length > 0) {
            recommendations.push({
                issue: 'Module loading failures',
                solution: 'Check import paths and ensure all files exist',
                modules: failedModules.map(m => m.path)
            });
        }
        
        return recommendations;
    }
    
    createTemplate() {
        const state = this._testState.getAll();
        const baseTemplate = super.createTemplate();
        
        // Extend the base template with diagnostic info
        return html`
            ${baseTemplate}
            
            ${state.report ? html`
                <style>
                    .diagnostic-report {
                        margin-top: 20px;
                        padding: 16px;
                        background: #0a0a0a;
                        border-radius: 8px;
                        border: 2px solid #f39c12;
                    }
                    
                    .report-section {
                        margin-bottom: 16px;
                    }
                    
                    .report-title {
                        color: #f39c12;
                        font-weight: bold;
                        margin-bottom: 8px;
                    }
                    
                    .diagnosis {
                        color: #e74c3c;
                        padding: 8px;
                        background: #1a0a0a;
                        border-radius: 4px;
                        margin-bottom: 12px;
                    }
                    
                    .recommendation {
                        margin-bottom: 8px;
                        padding: 8px;
                        background: #1a1a1a;
                        border-radius: 4px;
                        border-left: 3px solid #27ae60;
                    }
                    
                    .issue-tag {
                        color: #f39c12;
                        font-weight: bold;
                    }
                    
                    .undefined-elements {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                        margin-top: 8px;
                    }
                    
                    .element-tag {
                        background: #e74c3c;
                        color: #000;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: bold;
                    }
                </style>
                
                <div class="diagnostic-report">
                    <div class="report-section">
                        <div class="report-title">🔍 Diagnostic Report</div>
                        <div class="diagnosis">${state.report.diagnosis}</div>
                    </div>
                    
                    ${state.customElementIssues.length > 0 ? html`
                        <div class="report-section">
                            <div class="report-title">Undefined Custom Elements:</div>
                            <div class="undefined-elements">
                                ${state.customElementIssues.map(issue => html`
                                    <span class="element-tag">&lt;${issue.tagName}&gt;</span>
                                `)}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${state.report.recommendations.length > 0 ? html`
                        <div class="report-section">
                            <div class="report-title">💡 Recommendations:</div>
                            ${state.report.recommendations.map(rec => html`
                                <div class="recommendation">
                                    <span class="issue-tag">Issue:</span> ${rec.issue}<br>
                                    <span class="issue-tag">Solution:</span> ${rec.solution}
                                    ${rec.example ? html`<br><span class="issue-tag">Example:</span> ${rec.example}` : ''}
                                </div>
                            `)}
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        `;
    }
}

// Register the test
customElements.define('brutal-test-url-routing', URLRoutingTest);