#!/usr/bin/env node

/**
 * BRUTAL V3 - Comprehensive Test All Pages
 * Tests EVERYTHING and generates learning insights
 */

import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

const testResults = {
    timestamp: new Date().toISOString(),
    pages: {},
    resources: new Set(),
    components: new Set(),
    coverage: {
        totalJS: 0,
        usedJS: 0,
        totalCSS: 0,
        usedCSS: 0
    },
    insights: {
        patterns: [],
        improvements: [],
        missing: []
    }
};

async function testEverything() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--enable-features=SharedArrayBuffer',
            '--enable-precise-memory-info'
        ]
    });
    
    try {
        // Get all HTML pages
        const files = await fs.readdir('.');
        const htmlFiles = files.filter(f => f.endsWith('.html'));
        // Test each page comprehensively
        for (const file of htmlFiles) {
            );
            
            const page = await browser.newPage();
            const client = await page.target().createCDPSession();
            
            // Enable all tracking
            await client.send('Runtime.enable');
            await client.send('Network.enable');
            await client.send('DOM.enable');
            
            // Track all resources
            const resources = new Set();
            const errors = [];
            const components = new Set();
            
            // Network tracking
            client.on('Network.requestWillBeSent', (params) => {
                const url = params.request.url;
                if (url.includes('.js') || url.includes('.css')) {
                    resources.add(url.replace(/^.*\//, ''));
                }
            });
            
            // Error tracking
            page.on('pageerror', error => {
                errors.push({
                    message: error.message,
                    stack: error.stack
                });
            });
            
            // Console tracking
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    errors.push({
                        type: 'console',
                        text: msg.text()
                    });
                }
            });
            
            // Start coverage
            await page.coverage.startJSCoverage();
            await page.coverage.startCSSCoverage();
            
            try {
                // Navigate
                await page.goto(`http://localhost:8080/${file}`, {
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });
                
                // Wait for framework
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Analyze page
                const analysis = await page.evaluate(() => {
                    const result = {
                        framework: {
                            loaded: !!window.__BRUTAL__,
                            version: window.__BRUTAL__?.version,
                            components: window.__BRUTAL__?.components?.getNames() || [],
                            states: window.__BRUTAL__?.state ? Array.from(window.__BRUTAL__.state.keys()) : []
                        },
                        dom: {
                            customElements: [],
                            shadowRoots: 0,
                            totalElements: document.querySelectorAll('*').length
                        },
                        performance: {
                            loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                            domElements: document.querySelectorAll('*').length,
                            memory: performance.memory || {}
                        },
                        features: {
                            hasRouter: !!document.querySelector('[data-route]'),
                            hasState: !!window.__BRUTAL__?.state?.size,
                            hasComponents: false,
                            hasGPU: !!document.querySelector('canvas')
                        }
                    };
                    
                    // Find custom elements
                    document.querySelectorAll('*').forEach(el => {
                        if (el.tagName.includes('-')) {
                            result.dom.customElements.push(el.tagName.toLowerCase());
                            if (el.shadowRoot) result.dom.shadowRoots++;
                        }
                    });
                    
                    result.features.hasComponents = result.dom.customElements.length > 0;
                    
                    return result;
                });
                
                // Test interactions
                const buttons = await page.$$('button');
                // Coverage
                const [jsCoverage, cssCoverage] = await Promise.all([
                    page.coverage.stopJSCoverage(),
                    page.coverage.stopCSSCoverage()
                ]);
                
                // Calculate coverage
                let jsTotal = 0, jsUsed = 0;
                jsCoverage.forEach(item => {
                    jsTotal += item.text.length;
                    item.ranges.forEach(range => {
                        jsUsed += range.end - range.start;
                    });
                });
                
                let cssTotal = 0, cssUsed = 0;
                cssCoverage.forEach(item => {
                    cssTotal += item.text.length;
                    item.ranges.forEach(range => {
                        cssUsed += range.end - range.start;
                    });
                });
                
                // Store results
                testResults.pages[file] = {
                    analysis,
                    errors: errors.length,
                    coverage: {
                        js: jsTotal > 0 ? (jsUsed / jsTotal * 100).toFixed(2) : 0,
                        css: cssTotal > 0 ? (cssUsed / cssTotal * 100).toFixed(2) : 0
                    },
                    resources: Array.from(resources)
                };
                
                // Update totals
                testResults.coverage.totalJS += jsTotal;
                testResults.coverage.usedJS += jsUsed;
                testResults.coverage.totalCSS += cssTotal;
                testResults.coverage.usedCSS += cssUsed;
                
                // Add to global sets
                resources.forEach(r => testResults.resources.add(r));
                analysis.dom.customElements.forEach(c => testResults.components.add(c));
                
                // Print summary
                || 'None'}`);
                } catch (error) {
                testResults.pages[file] = { error: error.message };
            } finally {
                await page.close();
            }
        }
        
        // Analyze patterns
        );
        
        // Resource usage
        const jsFiles = Array.from(testResults.resources).filter(r => r.endsWith('.js'));
        const cssFiles = Array.from(testResults.resources).filter(r => r.endsWith('.css'));
        // Component usage
        testResults.components.forEach(c => );
        
        // Coverage summary
        const totalCoverage = {
            js: testResults.coverage.totalJS > 0 ? 
                (testResults.coverage.usedJS / testResults.coverage.totalJS * 100).toFixed(2) : 0,
            css: testResults.coverage.totalCSS > 0 ? 
                (testResults.coverage.usedCSS / testResults.coverage.totalCSS * 100).toFixed(2) : 0
        };
        // Framework usage
        let frameworkPages = 0;
        let componentPages = 0;
        Object.values(testResults.pages).forEach(page => {
            if (page.analysis?.framework?.loaded) frameworkPages++;
            if (page.analysis?.features?.hasComponents) componentPages++;
        });
        
        // Insights
        // Pattern detection
        if (totalCoverage.js < 30) {
            testResults.insights.improvements.push('Remove unused code');
        }
        
        if (componentPages < frameworkPages / 2) {
            testResults.insights.improvements.push('Increase component usage');
        }
        
        // Missing features
        const hasTests = htmlFiles.some(f => f.includes('test'));
        if (!hasTests) {
            testResults.insights.missing.push('Dedicated test suite');
        }
        
        // Save comprehensive report
        await fs.writeFile(
            'comprehensive-test-report.json',
            JSON.stringify(testResults, null, 2)
        );
        
        } finally {
        await browser.close();
    }
}

// Check server
fetch('http://localhost:8080/')
    .then(() => {
        testEverything();
    })
    .catch(() => {
        process.exit(1);
    });