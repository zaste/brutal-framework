/**
 * Error Capture - Captures ALL errors from every possible source
 */

export class ErrorCapture {
    constructor() {
        this.errors = [];
        this.page = null;
        this.isCapturing = false;
        
        this.errorSources = {
            runtime: [],
            console: [],
            network: [],
            promise: [],
            syntax: [],
            resource: [],
            security: [],
            type: []
        };
    }

    async attach(page, cdp) {
        this.page = page;
        this.cdp = cdp;
        
        // Inject comprehensive error capture script
        await this.injectErrorCapture();
        
        // Setup page-level error handlers
        this.setupPageHandlers();
        
        // Setup CDP error capture if available
        if (this.cdp) {
            await this.setupCDPCapture();
        }
    }

    async injectErrorCapture() {
        await this.page.evaluateOnNewDocument(() => {
            window.__BRUTAL_ERRORS__ = {
                runtime: [],
                console: [],
                promise: [],
                syntax: [],
                resource: [],
                security: [],
                type: []
            };

            // Capture runtime errors
            window.addEventListener('error', (event) => {
                window.__BRUTAL_ERRORS__.runtime.push({
                    type: 'runtime',
                    message: event.message,
                    filename: event.filename,
                    line: event.lineno,
                    column: event.colno,
                    stack: event.error?.stack,
                    timestamp: Date.now()
                });
            }, true);

            // Capture unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                window.__BRUTAL_ERRORS__.promise.push({
                    type: 'promise',
                    reason: event.reason,
                    promise: event.promise,
                    timestamp: Date.now()
                });
            }, true);

            // Override console methods
            const originalConsole = {
                error: console.error,
                warn: console.warn,
                assert: console.assert
            };

            console.error = function(...args) {
                window.__BRUTAL_ERRORS__.console.push({
                    type: 'console.error',
                    args: args.map(arg => {
                        try {
                            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                        } catch (e) {
                            return '[Unserializable]';
                        }
                    }),
                    stack: new Error().stack,
                    timestamp: Date.now()
                });
                originalConsole.error.apply(console, args);
            };

            console.warn = function(...args) {
                window.__BRUTAL_ERRORS__.console.push({
                    type: 'console.warn',
                    args: args.map(arg => {
                        try {
                            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                        } catch (e) {
                            return '[Unserializable]';
                        }
                    }),
                    timestamp: Date.now()
                });
                originalConsole.warn.apply(console, args);
            };

            console.assert = function(condition, ...args) {
                if (!condition) {
                    window.__BRUTAL_ERRORS__.console.push({
                        type: 'console.assert',
                        condition: false,
                        args: args,
                        stack: new Error().stack,
                        timestamp: Date.now()
                    });
                }
                originalConsole.assert.apply(console, [condition, ...args]);
            };

            // Capture resource loading errors
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.responseStatus >= 400 || entry.responseStatus === 0) {
                        window.__BRUTAL_ERRORS__.resource.push({
                            type: 'resource',
                            name: entry.name,
                            status: entry.responseStatus,
                            duration: entry.duration,
                            timestamp: entry.startTime
                        });
                    }
                }
            });
            
            observer.observe({ entryTypes: ['resource'] });

            // Capture CSP violations
            document.addEventListener('securitypolicyviolation', (event) => {
                window.__BRUTAL_ERRORS__.security.push({
                    type: 'csp',
                    violatedDirective: event.violatedDirective,
                    blockedURI: event.blockedURI,
                    originalPolicy: event.originalPolicy,
                    timestamp: Date.now()
                });
            });

            // Type error detection for common issues
            const checkType = (obj, path = '') => {
                if (obj === null || obj === undefined) {
                    window.__BRUTAL_ERRORS__.type.push({
                        type: 'null_reference',
                        path: path,
                        timestamp: Date.now()
                    });
                }
            };

            // Override common DOM methods to catch errors
            const originalQuerySelector = document.querySelector;
            document.querySelector = function(selector) {
                try {
                    const result = originalQuerySelector.call(this, selector);
                    if (!result && selector) {
                        window.__BRUTAL_ERRORS__.type.push({
                            type: 'selector_not_found',
                            selector: selector,
                            timestamp: Date.now()
                        });
                    }
                    return result;
                } catch (e) {
                    window.__BRUTAL_ERRORS__.syntax.push({
                        type: 'invalid_selector',
                        selector: selector,
                        error: e.message,
                        timestamp: Date.now()
                    });
                    throw e;
                }
            };
        });
    }

    setupPageHandlers() {
        // Page crash detection
        this.page.on('error', error => {
            this.errorSources.runtime.push({
                type: 'page_crash',
                message: error.message,
                stack: error.stack,
                timestamp: Date.now()
            });
        });

        // Console message capture
        this.page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                this.errorSources.console.push({
                    type: msg.type(),
                    text: msg.text(),
                    location: msg.location(),
                    timestamp: Date.now()
                });
            }
        });

        // Page error events
        this.page.on('pageerror', error => {
            this.errorSources.runtime.push({
                type: 'pageerror',
                message: error.message,
                stack: error.stack,
                timestamp: Date.now()
            });
        });

        // Request failures
        this.page.on('requestfailed', request => {
            this.errorSources.network.push({
                type: 'request_failed',
                url: request.url(),
                method: request.method(),
                failure: request.failure(),
                timestamp: Date.now()
            });
        });

        // Response errors
        this.page.on('response', response => {
            if (response.status() >= 400) {
                this.errorSources.network.push({
                    type: 'response_error',
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText(),
                    timestamp: Date.now()
                });
            }
        });
    }

    async setupCDPCapture() {
        if (!this.cdp) {
            throw new Error('BRUTAL: CDP is required for error capture');
        }

        try {
            // Enable Runtime domain for deeper error capture
            await this.cdp.send('Runtime.enable');
            
            // Capture exceptions
            this.cdp.on('Runtime.exceptionThrown', event => {
                this.errorSources.runtime.push({
                    type: 'cdp_exception',
                    description: event.exceptionDetails.text,
                    stackTrace: event.exceptionDetails.stackTrace,
                    timestamp: event.timestamp
                });
            });

            // Enable Log domain
            await this.cdp.send('Log.enable');
            
            // Capture log entries
            this.cdp.on('Log.entryAdded', event => {
                if (event.entry.level === 'error' || event.entry.level === 'warning') {
                    this.errorSources.console.push({
                        type: 'cdp_log',
                        level: event.entry.level,
                        text: event.entry.text,
                        url: event.entry.url,
                        line: event.entry.lineNumber,
                        timestamp: event.entry.timestamp
                    });
                }
            });

            // Enable Security domain
            await this.cdp.send('Security.enable');
            
            // Capture security issues
            this.cdp.on('Security.securityStateChanged', event => {
                if (event.securityState !== 'secure') {
                    this.errorSources.security.push({
                        type: 'security_state',
                        state: event.securityState,
                        summary: event.summary,
                        timestamp: Date.now()
                    });
                }
            });

        } catch (error) {
            throw new Error(`BRUTAL: CDP error capture REQUIRED - ${error.message}`);
        }
    }

    async start() {
        this.isCapturing = true;
        this.errors = [];
        
        // Clear previous errors
        for (const source in this.errorSources) {
            this.errorSources[source] = [];
        }
        
        return { status: 'capturing' };
    }

    async stop() {
        this.isCapturing = false;
        
        // Collect errors from page
        const pageErrors = await this.page.evaluate(() => {
            return window.__BRUTAL_ERRORS__ || {};
        });
        
        // Merge all error sources
        const allErrors = {
            ...this.errorSources,
            ...pageErrors
        };
        
        // Flatten and sort by timestamp
        const flatErrors = [];
        for (const [source, errors] of Object.entries(allErrors)) {
            for (const error of errors) {
                flatErrors.push({
                    source,
                    ...error
                });
            }
        }
        
        flatErrors.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        
        return {
            total: flatErrors.length,
            bySource: allErrors,
            timeline: flatErrors,
            summary: this.generateSummary(flatErrors)
        };
    }

    generateSummary(errors) {
        const summary = {
            total: errors.length,
            critical: 0,
            warnings: 0,
            byType: {},
            topErrors: []
        };
        
        const errorCounts = {};
        
        for (const error of errors) {
            // Count by type
            summary.byType[error.type] = (summary.byType[error.type] || 0) + 1;
            
            // BRUTAL: ALL errors are critical
            summary.critical++;
            
            // Track top errors
            const key = error.message || error.text || error.type;
            errorCounts[key] = (errorCounts[key] || 0) + 1;
        }
        
        // Get top 5 errors
        summary.topErrors = Object.entries(errorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([error, count]) => ({ error, count }));
        
        return summary;
    }
}