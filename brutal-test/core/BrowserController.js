/**
 * Browser Controller - Multi-browser automation with CDP support
 */

import puppeteer from 'puppeteer';
import playwright from 'playwright';

export class BrowserController {
    constructor(config) {
        this.config = config;
        this.browser = null;
        this.page = null;
        this.context = null;
        this.cdp = null;
        this.browserType = config.browser || 'chrome';
        this.engine = config.engine || 'puppeteer'; // puppeteer or playwright
    }

    async initialize() {
        console.log(`🌐 Initializing ${this.browserType} with ${this.engine}...`);
        
        if (this.engine === 'playwright') {
            await this.initializePlaywright();
        } else {
            await this.initializePuppeteer();
        }
        
        // Setup common configurations
        await this.setupPage();
        
        // Enable CDP if supported
        if (this.browserType === 'chrome' || this.browserType === 'chromium') {
            await this.enableCDP();
        }
    }

    async initializePuppeteer() {
        const options = {
            headless: this.config.headless ? 'new' : false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=IsolateOrigins',
                '--disable-site-isolation-trials',
                // Enable features
                '--enable-features=SharedArrayBuffer',
                '--enable-experimental-web-platform-features'
            ]
        };

        if (this.config.executablePath) {
            options.executablePath = this.config.executablePath;
        }

        this.browser = await puppeteer.launch(options);
        this.page = await this.browser.newPage();
    }

    async initializePlaywright() {
        const browserTypes = {
            chrome: 'chromium',
            firefox: 'firefox',
            safari: 'webkit'
        };

        const browserType = playwright[browserTypes[this.browserType] || 'chromium'];
        
        this.browser = await browserType.launch({
            headless: this.config.headless,
            args: this.browserType === 'chrome' ? [
                '--enable-features=SharedArrayBuffer',
                '--disable-web-security'
            ] : []
        });

        this.context = await this.browser.newContext({
            viewport: this.config.viewport,
            ignoreHTTPSErrors: true
        });

        this.page = await this.context.newPage();
    }

    async setupPage() {
        // Set viewport
        await this.page.setViewport(this.config.viewport);

        // Setup console message collection
        this.page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            
            // Store console messages for analysis
            if (!this.consoleMessages) this.consoleMessages = [];
            this.consoleMessages.push({ type, text, timestamp: Date.now() });
            
            // Log important messages
            if (type === 'error' || type === 'warning') {
                console.log(`[${type.toUpperCase()}]`, text);
            }
        });

        // Setup error handling
        this.page.on('pageerror', error => {
            if (!this.pageErrors) this.pageErrors = [];
            this.pageErrors.push({
                message: error.message,
                stack: error.stack,
                timestamp: Date.now()
            });
        });

        // Setup request interception for monitoring
        if (this.engine === 'puppeteer') {
            await this.page.setRequestInterception(true);
            
            this.page.on('request', request => {
                // Log network requests
                if (!this.networkRequests) this.networkRequests = [];
                this.networkRequests.push({
                    url: request.url(),
                    method: request.method(),
                    timestamp: Date.now()
                });
                
                // BRUTAL: Log the request but don't interfere
                request.continue();
            });
        }

        // Setup response monitoring
        this.page.on('response', response => {
            if (!this.networkResponses) this.networkResponses = [];
            this.networkResponses.push({
                url: response.url(),
                status: response.status(),
                timestamp: Date.now()
            });
        });
    }

    async enableCDP() {
        try {
            if (this.engine === 'puppeteer') {
                this.cdp = await this.page.target().createCDPSession();
            } else if (this.engine === 'playwright') {
                this.cdp = await this.page.context().newCDPSession(this.page);
            }

            console.log('✅ Chrome DevTools Protocol enabled');

            // Enable domains
            await this.cdp.send('Runtime.enable');
            await this.cdp.send('Performance.enable');
            await this.cdp.send('Network.enable');
            await this.cdp.send('DOM.enable');
            await this.cdp.send('CSS.enable');
            
            // Enable performance metrics
            // BRUTAL: Skip setTimeDomain - it's not critical for operation
            
        } catch (error) {
            // BRUTAL: CDP errors are FATAL
            throw new Error(`BRUTAL: CDP initialization failed - ${error.message}`);
        }
    }

    async navigateTo(url) {
        console.log(`📍 Navigating to: ${url}`);
        
        try {
            const response = await this.page.goto(url, {
                waitUntil: ['load', 'networkidle0'],
                timeout: 30000
            });

            // Check response status
            if (!response.ok()) {
                throw new Error(`Navigation failed with status: ${response.status()}`);
            }

            // Wait a bit for dynamic content
            await this.wait(1000);
            
            return response;
        } catch (error) {
            console.error('❌ Navigation error:', error);
            throw error;
        }
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async evaluate(fn, ...args) {
        return this.page.evaluate(fn, ...args);
    }

    async evaluateAsync(fn, ...args) {
        return this.page.evaluate(async (fn, ...args) => {
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const asyncFn = new AsyncFunction('return (' + fn.toString() + ')(...arguments)');
            return asyncFn(...args);
        }, fn, ...args);
    }

    async screenshot(options = {}) {
        const defaultOptions = {
            path: `screenshots/screenshot-${Date.now()}.png`,
            fullPage: true
        };
        
        return this.page.screenshot({ ...defaultOptions, ...options });
    }

    async getMetrics() {
        const metrics = {};

        // Get performance metrics
        if (this.cdp) {
            try {
                const perfMetrics = await this.cdp.send('Performance.getMetrics');
                metrics.performance = perfMetrics.metrics.reduce((acc, metric) => {
                    acc[metric.name] = metric.value;
                    return acc;
                }, {});
            } catch (error) {
                // BRUTAL: Performance metrics failure is FATAL
                throw new Error(`BRUTAL: Failed to get performance metrics - ${error.message}`);
            }
        }

        // Get memory info
        metrics.memory = await this.evaluate(() => {
            if (performance.memory) {
                return {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
            }
            return null;
        });

        // Get collected data
        metrics.console = this.consoleMessages || [];
        metrics.errors = this.pageErrors || [];
        metrics.network = {
            requests: this.networkRequests || [],
            responses: this.networkResponses || []
        };

        return metrics;
    }

    async injectScript(scriptPath) {
        await this.page.addScriptTag({ path: scriptPath });
    }

    async injectStyle(stylePath) {
        await this.page.addStyleTag({ path: stylePath });
    }

    async setCookie(cookie) {
        await this.page.setCookie(cookie);
    }

    async clearCookies() {
        if (this.engine === 'puppeteer') {
            const cookies = await this.page.cookies();
            await this.page.deleteCookie(...cookies);
        } else {
            await this.context.clearCookies();
        }
    }

    async emulateDevice(device) {
        if (this.engine === 'puppeteer') {
            const devices = puppeteer.devices;
            const deviceConfig = devices[device];
            if (deviceConfig) {
                await this.page.emulate(deviceConfig);
            }
        }
    }

    async startTracing(options = {}) {
        if (this.engine === 'puppeteer') {
            await this.page.tracing.start({
                screenshots: true,
                path: options.path || `traces/trace-${Date.now()}.json`
            });
        }
    }

    async stopTracing() {
        if (this.engine === 'puppeteer') {
            return await this.page.tracing.stop();
        }
    }

    async getCoverage() {
        if (this.engine === 'puppeteer') {
            const [jsCoverage, cssCoverage] = await Promise.all([
                this.page.coverage.stopJSCoverage(),
                this.page.coverage.stopCSSCoverage()
            ]);
            
            return { js: jsCoverage, css: cssCoverage };
        }
        return null;
    }

    getPage() {
        return this.page;
    }

    getCDP() {
        return this.cdp;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🛑 Browser closed');
        }
    }
}