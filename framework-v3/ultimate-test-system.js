#!/usr/bin/env node

/**
 * BRUTAL V3 - Ultimate Test System
 * Captures EVERYTHING: console, errors, performance, GPU, memory, network, DOM, events, screenshots, videos, traces
 */

import puppeteer from 'puppeteer';
import { readdir } from 'fs/promises';
import { promises as fs } from 'fs';
import path from 'path';

// Create output directory
const outputDir = './test-output';
await fs.mkdir(outputDir, { recursive: true });

async function runUltimateTest(file, browser) {
    const testId = `${file.replace('.html', '')}-${Date.now()}`;
    const testDir = path.join(outputDir, testId);
    await fs.mkdir(testDir, { recursive: true });
    
    }`);
    );
    
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    
    // Enable all domains for maximum data collection
    const client = await page.target().createCDPSession();
    
    // 1. Enable Console API
    await client.send('Console.enable');
    
    // 2. Enable Runtime for exceptions
    await client.send('Runtime.enable');
    
    // 3. Enable Network domain
    await client.send('Network.enable');
    
    // 4. Enable Page domain
    await client.send('Page.enable');
    
    // 5. Enable DOM domain
    await client.send('DOM.enable');
    
    // 6. Enable CSS domain
    await client.send('CSS.enable');
    
    // 7. Enable Performance domain
    await client.send('Performance.enable');
    
    // 8. Enable HeapProfiler
    await client.send('HeapProfiler.enable');
    
    // 9. Enable Profiler for CPU
    await client.send('Profiler.enable');
    
    // 10. Enable Tracing
    await client.send('Tracing.start', {
        categories: 'devtools.timeline,v8.execute,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,disabled-by-default-devtools.timeline.stack,disabled-by-default-v8.cpu_profiler,disabled-by-default-v8.cpu_profiler.hires',
        options: 'sampling-frequency=10000'
    });
    
    // Data collectors
    const testData = {
        file,
        timestamp: new Date().toISOString(),
        console: [],
        errors: [],
        network: [],
        performance: {},
        memory: {},
        coverage: {},
        domMutations: [],
        eventListeners: [],
        userInteractions: [],
        gpuInfo: {},
        screenshots: [],
        video: null,
        trace: null,
        heapSnapshot: null
    };
    
    // Console message handler with full details
    client.on('Console.messageAdded', (params) => {
        testData.console.push({
            level: params.message.level,
            text: params.message.text,
            timestamp: new Date().toISOString(),
            source: params.message.source,
            url: params.message.url,
            line: params.message.line,
            column: params.message.column,
            stackTrace: params.message.stackTrace
        });
    });
    
    // Runtime exceptions
    client.on('Runtime.exceptionThrown', (params) => {
        testData.errors.push({
            timestamp: params.timestamp,
            exceptionDetails: params.exceptionDetails,
            stackTrace: params.exceptionDetails.stackTrace
        });
    });
    
    // Network events
    const networkRequests = new Map();
    
    client.on('Network.requestWillBeSent', (params) => {
        networkRequests.set(params.requestId, {
            requestId: params.requestId,
            url: params.request.url,
            method: params.request.method,
            timestamp: params.timestamp,
            type: params.type,
            initiator: params.initiator
        });
    });
    
    client.on('Network.responseReceived', (params) => {
        const request = networkRequests.get(params.requestId);
        if (request) {
            request.response = {
                status: params.response.status,
                statusText: params.response.statusText,
                headers: params.response.headers,
                mimeType: params.response.mimeType,
                timestamp: params.timestamp
            };
        }
    });
    
    client.on('Network.loadingFinished', (params) => {
        const request = networkRequests.get(params.requestId);
        if (request) {
            request.finished = {
                timestamp: params.timestamp,
                encodedDataLength: params.encodedDataLength
            };
            testData.network.push(request);
        }
    });
    
    client.on('Network.loadingFailed', (params) => {
        const request = networkRequests.get(params.requestId);
        if (request) {
            request.failed = {
                timestamp: params.timestamp,
                errorText: params.errorText,
                canceled: params.canceled
            };
            testData.network.push(request);
        }
    });
    
    // Page error handler
    page.on('pageerror', error => {
        testData.errors.push({
            type: 'pageerror',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    });
    
    // Request failed handler
    page.on('requestfailed', request => {
        testData.errors.push({
            type: 'requestfailed',
            url: request.url(),
            error: request.failure().errorText,
            timestamp: new Date().toISOString()
        });
    });
    
    // Start screencast (video alternative)
    let videoFrames = [];
    await client.send('Page.startScreencast', {
        format: 'png',
        quality: 80,
        everyNthFrame: 1
    });
    
    client.on('Page.screencastFrame', async (params) => {
        videoFrames.push(params.data);
        await client.send('Page.screencastFrameAck', { sessionId: params.sessionId });
    });
    
    try {
        // Navigate with full options
        const response = await page.goto(`http://localhost:8080/${file}`, {
            waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
            timeout: 30000
        });
        
        }`);
        
        // Wait for any async operations
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get performance metrics
        const perfMetrics = await page.metrics();
        const performanceTiming = await page.evaluate(() => JSON.parse(JSON.stringify(performance.timing)));
        const performanceEntries = await page.evaluate(() => 
            performance.getEntries().map(entry => ({
                name: entry.name,
                entryType: entry.entryType,
                startTime: entry.startTime,
                duration: entry.duration
            }))
        );
        
        testData.performance = {
            metrics: perfMetrics,
            timing: performanceTiming,
            entries: performanceEntries,
            calculated: {
                domContentLoaded: performanceTiming.domContentLoadedEventEnd - performanceTiming.navigationStart,
                load: performanceTiming.loadEventEnd - performanceTiming.navigationStart,
                firstPaint: performanceEntries.find(e => e.name === 'first-paint')?.startTime,
                firstContentfulPaint: performanceEntries.find(e => e.name === 'first-contentful-paint')?.startTime
            }
        };
        
        // Get memory info
        const memoryInfo = await page.evaluate(() => {
            if (performance.memory) {
                return {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
            }
            return null;
        });
        testData.memory.initial = memoryInfo;
        
        // Get GPU info
        const gpuInfo = await page.evaluate(() => {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                return {
                    vendor: gl.getParameter(gl.VENDOR),
                    renderer: gl.getParameter(gl.RENDERER),
                    vendorUnmasked: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null,
                    rendererUnmasked: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null,
                    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
                };
            }
            return null;
        });
        testData.gpuInfo = gpuInfo;
        
        // Check environment
        const environment = await page.evaluate(() => ({
            url: window.location.href,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio
            },
            features: {
                crossOriginIsolated: typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : false,
                sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
                webgl: !!document.createElement('canvas').getContext('webgl'),
                webgl2: !!document.createElement('canvas').getContext('webgl2'),
                gpu: 'gpu' in navigator,
                workers: typeof Worker !== 'undefined',
                serviceWorker: 'serviceWorker' in navigator
            },
            brutal: {
                loaded: typeof window.__BRUTAL__ !== 'undefined',
                debug: typeof window.__BRUTAL_DEBUG__ !== 'undefined',
                config: typeof window.__BRUTAL__ !== 'undefined' ? window.__BRUTAL__ : null
            }
        }));
        testData.environment = environment;
        
        // Inject DOM mutation observer
        await page.evaluate(() => {
            window.__domMutations = [];
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    window.__domMutations.push({
                        type: mutation.type,
                        target: mutation.target.nodeName,
                        timestamp: Date.now()
                    });
                });
            });
            observer.observe(document.body, {
                childList: true,
                attributes: true,
                subtree: true
            });
        });
        
        // Get all event listeners
        const eventListeners = await page.evaluate(() => {
            const allElements = document.querySelectorAll('*');
            const listeners = [];
            
            allElements.forEach(element => {
                const events = getEventListeners(element);
                if (events && Object.keys(events).length > 0) {
                    listeners.push({
                        element: element.tagName + (element.id ? '#' + element.id : '') + (element.className ? '.' + element.className : ''),
                        events: Object.keys(events)
                    });
                }
            });
            
            return listeners;
        }).catch(() => []); // getEventListeners might not be available
        testData.eventListeners = eventListeners;
        
        // Take initial screenshot
        const screenshotPath1 = path.join(testDir, 'screenshot-initial.png');
        await page.screenshot({
            path: screenshotPath1,
            fullPage: true
        });
        testData.screenshots.push('screenshot-initial.png');
        // Coverage start
        await Promise.all([
            page.coverage.startJSCoverage(),
            page.coverage.startCSSCoverage()
        ]);
        
        // Automated interactions
        // Click all buttons
        const buttons = await page.$$('button');
        for (let i = 0; i < buttons.length; i++) {
            try {
                const buttonInfo = await buttons[i].evaluate(el => ({
                    text: el.textContent,
                    id: el.id,
                    className: el.className
                }));
                
                await buttons[i].click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Capture state after click
                const afterClickScreenshot = path.join(testDir, `screenshot-after-button-${i}.png`);
                await page.screenshot({
                    path: afterClickScreenshot,
                    fullPage: true
                });
                testData.screenshots.push(`screenshot-after-button-${i}.png`);
                
                testData.userInteractions.push({
                    type: 'click',
                    target: buttonInfo,
                    timestamp: new Date().toISOString(),
                    success: true
                });
                
            } catch (clickError) {
                testData.userInteractions.push({
                    type: 'click',
                    target: `Button ${i}`,
                    timestamp: new Date().toISOString(),
                    success: false,
                    error: clickError.message
                });
            }
        }
        
        // Hover over all links
        const links = await page.$$('a');
        for (let i = 0; i < Math.min(links.length, 5); i++) { // Limit to 5 for performance
            try {
                await links[i].hover();
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (e) {
                // Ignore hover errors
            }
        }
        
        // Scroll test
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(resolve => setTimeout(resolve, 500));
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get DOM mutations that occurred
        const domMutations = await page.evaluate(() => window.__domMutations || []);
        testData.domMutations = domMutations;
        
        // Coverage end
        const [jsCoverage, cssCoverage] = await Promise.all([
            page.coverage.stopJSCoverage(),
            page.coverage.stopCSSCoverage()
        ]);
        
        // Calculate coverage percentages
        const calculateCoverage = (coverage) => {
            let totalBytes = 0;
            let usedBytes = 0;
            
            for (const entry of coverage) {
                totalBytes += entry.text.length;
                for (const range of entry.ranges) {
                    usedBytes += range.end - range.start;
                }
            }
            
            return {
                totalBytes,
                usedBytes,
                percentage: totalBytes > 0 ? (usedBytes / totalBytes * 100).toFixed(2) : 0
            };
        };
        
        testData.coverage = {
            js: calculateCoverage(jsCoverage),
            css: calculateCoverage(cssCoverage)
        };
        
        // Final memory snapshot
        const finalMemory = await page.evaluate(() => {
            if (performance.memory) {
                return {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
            }
            return null;
        });
        testData.memory.final = finalMemory;
        
        if (memoryInfo && finalMemory) {
            testData.memory.delta = {
                usedJSHeapSize: finalMemory.usedJSHeapSize - memoryInfo.usedJSHeapSize,
                totalJSHeapSize: finalMemory.totalJSHeapSize - memoryInfo.totalJSHeapSize
            };
        }
        
        // Take heap snapshot
        const heapSnapshotPath = path.join(testDir, 'heap-snapshot.json');
        await client.send('HeapProfiler.takeHeapSnapshot', {
            reportProgress: false,
            treatGlobalObjectsAsRoots: true
        });
        testData.heapSnapshot = 'heap-snapshot.json';
        
        // Stop tracing
        const traceData = await client.send('Tracing.end');
        const tracePath = path.join(testDir, 'trace.json');
        await fs.writeFile(tracePath, JSON.stringify(traceData));
        testData.trace = 'trace.json';
        
        // Final screenshot
        const finalScreenshotPath = path.join(testDir, 'screenshot-final.png');
        await page.screenshot({
            path: finalScreenshotPath,
            fullPage: true
        });
        testData.screenshots.push('screenshot-final.png');
        
        // Stop screencast
        await client.send('Page.stopScreencast');
        testData.video = videoFrames.length > 0 ? `${videoFrames.length} frames captured` : null;
        
        // Accessibility tree
        const accessibilityTree = await page.accessibility.snapshot();
        await fs.writeFile(
            path.join(testDir, 'accessibility-tree.json'),
            JSON.stringify(accessibilityTree, null, 2)
        );
        
        // Get all BRUTAL-specific data
        const brutalData = await page.evaluate(() => {
            if (typeof window.__BRUTAL__ !== 'undefined') {
                return {
                    components: Object.keys(window.__BRUTAL__.components || {}),
                    state: window.__BRUTAL__.state || {},
                    performance: window.__BRUTAL__.performance || {},
                    debug: window.__BRUTAL__.debug || false
                };
            }
            return null;
        });
        testData.brutalFramework = brutalData;
        
        // Summary
        const summary = {
            success: testData.errors.length === 0,
            errorCount: testData.errors.length,
            consoleErrors: testData.console.filter(c => c.level === 'error').length,
            consoleWarnings: testData.console.filter(c => c.level === 'warning').length,
            networkRequests: testData.network.length,
            networkFailures: testData.network.filter(r => r.failed).length,
            domMutations: testData.domMutations.length,
            coverage: {
                js: `${testData.coverage.js.percentage}%`,
                css: `${testData.coverage.css.percentage}%`
            },
            performance: {
                domContentLoaded: `${testData.performance.calculated.domContentLoaded}ms`,
                load: `${testData.performance.calculated.load}ms`,
                firstPaint: testData.performance.calculated.firstPaint ? `${testData.performance.calculated.firstPaint}ms` : 'N/A',
                firstContentfulPaint: testData.performance.calculated.firstContentfulPaint ? `${testData.performance.calculated.firstContentfulPaint}ms` : 'N/A'
            },
            memory: testData.memory.delta ? {
                heapGrowth: `${(testData.memory.delta.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`
            } : null
        };
        
        testData.summary = summary;
        
        // Save complete test data
        await fs.writeFile(
            path.join(testDir, 'test-results.json'),
            JSON.stringify(testData, null, 2)
        );
        
        // Print summary
        `);
        if (summary.memory) {
            }
        return testData;
        
    } catch (error) {
        testData.errors.push({
            type: 'test-failure',
            message: error.message,
            stack: error.stack
        });
        
        // Save error report
        await fs.writeFile(
            path.join(testDir, 'test-error.json'),
            JSON.stringify(testData, null, 2)
        );
        
        return testData;
        
    } finally {
        await page.close();
        await context.close();
    }
}

async function runAllTests() {
    // Start browser with all features enabled
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--enable-features=SharedArrayBuffer',
            '--enable-unsafe-webgpu',
            '--use-gl=swiftshader',
            '--enable-webgl',
            '--enable-webgl2',
            '--disable-web-security',
            '--disable-features=IsolateOrigins',
            '--disable-site-isolation-trials',
            '--enable-precise-memory-info',
            '--js-flags=--expose-gc'
        ]
    });
    
    try {
        // Find all HTML files
        const files = await readdir('.');
        const htmlFiles = files.filter(f => f.endsWith('.html'));
        const allResults = [];
        
        // Test each file
        for (const file of htmlFiles) {
            const result = await runUltimateTest(file, browser);
            allResults.push(result);
        }
        
        // Generate master report
        const masterReport = {
            timestamp: new Date().toISOString(),
            totalFiles: htmlFiles.length,
            summary: {
                passed: allResults.filter(r => r.summary?.success).length,
                failed: allResults.filter(r => !r.summary?.success).length,
                totalErrors: allResults.reduce((acc, r) => acc + (r.errors?.length || 0), 0),
                totalConsoleErrors: allResults.reduce((acc, r) => acc + (r.console?.filter(c => c.level === 'error').length || 0), 0),
                totalNetworkFailures: allResults.reduce((acc, r) => acc + (r.network?.filter(n => n.failed).length || 0), 0)
            },
            files: allResults.map(r => ({
                file: r.file,
                success: r.summary?.success,
                errors: r.errors?.length || 0,
                testDir: r.testId
            }))
        };
        
        await fs.writeFile(
            path.join(outputDir, 'master-report.json'),
            JSON.stringify(masterReport, null, 2)
        );
        
        // Generate HTML report
        const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>BRUTAL V3 Test Report</title>
    <style>
        body { font-family: system-ui; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #333; }
        .summary { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .file-result { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .passed { border-left: 4px solid #4caf50; }
        .failed { border-left: 4px solid #f44336; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .metric { background: #f0f0f0; padding: 10px; border-radius: 4px; }
        .metric-value { font-size: 24px; font-weight: bold; }
        .metric-label { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 BRUTAL V3 Ultimate Test Report</h1>
        <div class="summary">
            <h2>Summary</h2>
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value">${masterReport.summary.passed}/${masterReport.totalFiles}</div>
                    <div class="metric-label">Tests Passed</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${masterReport.summary.totalErrors}</div>
                    <div class="metric-label">Total Errors</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${masterReport.summary.totalConsoleErrors}</div>
                    <div class="metric-label">Console Errors</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${masterReport.summary.totalNetworkFailures}</div>
                    <div class="metric-label">Network Failures</div>
                </div>
            </div>
        </div>
        <h2>Individual Results</h2>
        ${masterReport.files.map(f => `
            <div class="file-result ${f.success ? 'passed' : 'failed'}">
                <h3>${f.file}</h3>
                <p>Status: ${f.success ? '✅ PASSED' : '❌ FAILED'}</p>
                <p>Errors: ${f.errors}</p>
                <p><a href="${f.testDir}/test-results.json">View Details</a></p>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
        
        await fs.writeFile(
            path.join(outputDir, 'report.html'),
            htmlReport
        );
        
        );
        );
        } finally {
        await browser.close();
    }
}

// Check if server is running
fetch('http://localhost:8080/')
    .then(() => {
        runAllTests();
    })
    .catch(() => {
        process.exit(1);
    });