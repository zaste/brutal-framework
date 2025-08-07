/**
 * State Capture - Captures application, browser, and framework state
 */

export class StateCapture {
    constructor() {
        this.page = null;
        this.isCapturing = false;
        this.stateSnapshots = [];
    }

    async attach(page, cdp) {
        this.page = page;
        this.cdp = cdp;
        
        // Inject state capture utilities
        await this.injectStateCapture();
    }

    async injectStateCapture() {
        await this.page.evaluateOnNewDocument(() => {
            window.__BRUTAL_STATE__ = {
                snapshots: [],
                listeners: new Map()
            };

            // Capture BRUTAL framework state
            window.__captureBrutalState = () => {
                const state = {
                    timestamp: Date.now(),
                    brutal: {},
                    dom: {},
                    events: {},
                    workers: {},
                    gpu: {},
                    memory: {}
                };

                // BRUTAL framework state
                if (window.__BRUTAL__) {
                    state.brutal = {
                        initialized: true,
                        registry: window.__BRUTAL__.registry ? 
                            Object.keys(window.__BRUTAL__.registry.components || {}) : [],
                        workers: window.__BRUTAL__.workers ? {
                            pool: window.__BRUTAL__.workers.pool?.length || 0,
                            active: window.__BRUTAL__.workers.active || 0
                        } : null,
                        gpu: window.__BRUTAL__.gpu ? {
                            enabled: window.__BRUTAL__.gpu.enabled,
                            backend: window.__BRUTAL__.gpu.backend
                        } : null,
                        performance: window.__BRUTAL__.performance || {}
                    };
                } else {
                    state.brutal.initialized = false;
                }

                // DOM state
                state.dom = {
                    readyState: document.readyState,
                    elements: document.getElementsByTagName('*').length,
                    brutalComponents: document.querySelectorAll('[data-brutal-component]').length,
                    images: {
                        total: document.images.length,
                        loaded: Array.from(document.images).filter(img => img.complete).length
                    },
                    scripts: {
                        total: document.scripts.length,
                        loaded: Array.from(document.scripts).filter(s => !s.async || s.readyState === 'complete').length
                    }
                };

                // Event listeners count (getEventListeners only available in DevTools)
                state.events = {
                    // Count would be available in DevTools console
                    available: false
                };

                // Worker state
                if (typeof Worker !== 'undefined') {
                    state.workers = {
                        supported: true,
                        sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined'
                    };
                }

                // GPU state
                state.gpu = {
                    webgl: !!document.createElement('canvas').getContext('webgl'),
                    webgl2: !!document.createElement('canvas').getContext('webgl2'),
                    webgpu: 'gpu' in navigator
                };

                // Memory state
                if (performance.memory) {
                    state.memory = {
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize,
                        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                    };
                }

                return state;
            };

            // Capture state changes
            const captureStateChange = (type, detail) => {
                window.__BRUTAL_STATE__.snapshots.push({
                    type,
                    detail,
                    state: window.__captureBrutalState(),
                    timestamp: Date.now()
                });
            };

            // Monitor state changes
            const observer = new MutationObserver((mutations) => {
                const summary = {
                    added: 0,
                    removed: 0,
                    attributeChanges: 0,
                    textChanges: 0
                };
                
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList') {
                        summary.added += mutation.addedNodes.length;
                        summary.removed += mutation.removedNodes.length;
                    } else if (mutation.type === 'attributes') {
                        summary.attributeChanges++;
                    } else if (mutation.type === 'characterData') {
                        summary.textChanges++;
                    }
                });
                
                if (summary.added > 0 || summary.removed > 0 || summary.attributeChanges > 0) {
                    captureStateChange('dom_mutation', summary);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                attributes: true,
                characterData: true,
                subtree: true
            });

            // Monitor navigation
            window.addEventListener('popstate', () => {
                captureStateChange('navigation', { url: location.href });
            });

            // Monitor visibility changes
            document.addEventListener('visibilitychange', () => {
                captureStateChange('visibility', { hidden: document.hidden });
            });

            // Monitor online/offline
            window.addEventListener('online', () => {
                captureStateChange('network', { online: true });
            });
            
            window.addEventListener('offline', () => {
                captureStateChange('network', { online: false });
            });
        });
    }

    async start() {
        this.isCapturing = true;
        this.stateSnapshots = [];
        
        // Capture initial state
        const initialState = await this.captureCurrentState();
        this.stateSnapshots.push({
            type: 'initial',
            timestamp: Date.now(),
            state: initialState
        });
        
        return { status: 'capturing' };
    }

    async captureCurrentState() {
        // Get state from page
        const pageState = await this.page.evaluate(() => {
            return window.__captureBrutalState();
        });
        
        // Get browser state
        const browserState = await this.captureBrowserState();
        
        // Get network state
        const networkState = await this.captureNetworkState();
        
        return {
            page: pageState,
            browser: browserState,
            network: networkState
        };
    }

    async captureBrowserState() {
        const state = {
            url: await this.page.url(),
            title: await this.page.title(),
            viewport: await this.page.viewport(),
            cookies: await this.page.cookies(),
            localStorage: await this.captureLocalStorage(),
            sessionStorage: await this.captureSessionStorage()
        };
        
        // Get console messages if available
        if (this.page._consoleMessages) {
            state.consoleMessages = this.page._consoleMessages.length;
        }
        
        return state;
    }

    async captureLocalStorage() {
        try {
            return await this.page.evaluate(() => {
                const items = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    items[key] = localStorage.getItem(key);
                }
                return items;
            });
        } catch (error) {
            return { error: 'Could not access localStorage' };
        }
    }

    async captureSessionStorage() {
        try {
            return await this.page.evaluate(() => {
                const items = {};
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    items[key] = sessionStorage.getItem(key);
                }
                return items;
            });
        } catch (error) {
            return { error: 'Could not access sessionStorage' };
        }
    }

    async captureNetworkState() {
        // This would be populated by the browser controller
        return {
            requestCount: 0,
            failedRequests: 0,
            pendingRequests: 0
        };
    }

    async captureSnapshot(label) {
        const snapshot = {
            label,
            timestamp: Date.now(),
            state: await this.captureCurrentState()
        };
        
        this.stateSnapshots.push(snapshot);
        return snapshot;
    }

    async stop() {
        this.isCapturing = false;
        
        // Get all state changes from page
        const pageStateChanges = await this.page.evaluate(() => {
            return window.__BRUTAL_STATE__.snapshots;
        });
        
        // Capture final state
        const finalState = await this.captureCurrentState();
        this.stateSnapshots.push({
            type: 'final',
            timestamp: Date.now(),
            state: finalState
        });
        
        // Analyze state changes
        const analysis = this.analyzeStateChanges(pageStateChanges);
        
        return {
            snapshots: this.stateSnapshots,
            changes: pageStateChanges,
            analysis,
            summary: this.generateSummary(analysis)
        };
    }

    analyzeStateChanges(changes) {
        const analysis = {
            totalChanges: changes.length,
            changesByType: {},
            significantChanges: [],
            stateProgression: []
        };
        
        // Count changes by type
        changes.forEach(change => {
            analysis.changesByType[change.type] = (analysis.changesByType[change.type] || 0) + 1;
            
            // Identify significant changes
            if (change.type === 'dom_mutation' && change.detail.added > 10) {
                analysis.significantChanges.push({
                    type: 'large_dom_addition',
                    detail: change.detail,
                    timestamp: change.timestamp
                });
            }
            
            if (change.type === 'navigation') {
                analysis.significantChanges.push({
                    type: 'navigation',
                    url: change.detail.url,
                    timestamp: change.timestamp
                });
            }
        });
        
        // Track state progression
        if (changes.length > 0) {
            const first = changes[0];
            const last = changes[changes.length - 1];
            
            analysis.stateProgression = {
                duration: last.timestamp - first.timestamp,
                brutalInitialized: first.state?.brutal?.initialized === false && 
                                 last.state?.brutal?.initialized === true,
                domGrowth: (last.state?.dom?.elements || 0) - (first.state?.dom?.elements || 0),
                memoryGrowth: last.state?.memory && first.state?.memory ? 
                    last.state.memory.usedJSHeapSize - first.state.memory.usedJSHeapSize : 0
            };
        }
        
        return analysis;
    }

    generateSummary(analysis) {
        return {
            stateChanges: analysis.totalChanges,
            significantEvents: analysis.significantChanges.length,
            mostCommonChange: Object.entries(analysis.changesByType)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',
            brutalFramework: this.stateSnapshots[this.stateSnapshots.length - 1]?.state?.page?.brutal?.initialized || false
        };
    }
}