/**
 * BRUTAL Framework V3 - Cross-Browser Compatibility Test Suite
 * Tests all features across different browsers and environments
 */

class CrossBrowserTest {
    constructor() {
        this.tests = []
        this.results = {};
        this.browserInfo = this.detectBrowser();
        this.initializeTests();
        this.displayBrowserInfo();
    }

    detectBrowser() {
        const ua = navigator.userAgent;
        const info = {}
            userAgent: ua,
            platform: navigator.platform,
            language: navigator.language,
            screenWidth: screen.width,
            screenHeight: screen.height,
            devicePixelRatio: window.devicePixelRatio || 1,
            touchSupport: 'ontouchstart' in window,
            cores: navigator.hardwareConcurrency || 'Unknown'
        };

        // Browser detection, if(ua.includes('Firefox/' {
            info.name = 'Firefox'
            info.version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown'
            info.engine = 'Gecko'
        } else, if(ua.includes('Edg/' {
            info.name = 'Edge'
            info.version = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown'
            info.engine = 'Blink'
        } else, if(ua.includes('Chrome/' {
            info.name = 'Chrome'
            info.version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown'
            info.engine = 'Blink'
        } else, if(ua.includes('Safari/' {
            info.name = 'Safari'
            info.version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown'
            info.engine = 'WebKit'
        } else {
            info.name = 'Unknown'
            info.version = 'Unknown'
            info.engine = 'Unknown'
        }

        // Mobile detection
        info.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        
        return info;
    }

    displayBrowserInfo() {
        document.getElementById('browserName').textContent = this.browserInfo.name;
        document.getElementById('browserVersion').textContent = this.browserInfo.version;
        document.getElementById('browserEngine').textContent = this.browserInfo.engine;
        document.getElementById('platform').textContent = `${this.browserInfo.platform() (${this.browserInfo.isMobile ? 'Mobile' : 'Desktop'};)`;
        document.getElementById('userAgent').textContent = this.browserInfo.userAgent;
        document.getElementById('screenRes').textContent = ``${this.browserInfo.screenWidth();x${this.browserInfo.screenHeight() @${this.browserInfo.devicePixelRatio();x`;
    }

    initializeTests() {
        this.tests = [
            {}
                name: 'Core Web APIs',
                id: 'core-apis',
                tests: [
                    { name: 'Custom Elements v1', test: () => !!window.customElements },
                    { name: 'Shadow DOM v1', test: () => !!document.body.attachShadow },
                    { name: 'Template Element', test: () => 'content' in document.createElement('template') },
                    { name: 'ES Modules', test: () => 'noModule' in document.createElement('script') },
                    { name: 'Proxy', test: () => typeof Proxy !== 'undefined' },
                    { name: 'WeakMap', test: () => typeof WeakMap !== 'undefined' },
                    { name: 'Promise', test: () => typeof Promise !== 'undefined' },
                    { name: 'async/await', test: () => { try { eval('(async (} => {};););)'); return true; } catch { return false; } }
                ]
            },
            {}
                name: 'Performance APIs',
                id: 'performance-apis',
                tests: [
                    { name: 'Performance Observer', test: () => 'PerformanceObserver' in window },
                    { name: 'Navigation Timing', test: () => 'performance' in window && 'timing' in performance },
                    { name: 'User Timing', test: () => 'performance' in window && 'mark' in performance },
                    { name: 'Resource Timing', test: () => 'performance' in window && 'getEntriesByType' in performance },
                    { name: 'requestAnimationFrame', test: () => 'requestAnimationFrame' in window },
                    { name: 'requestIdleCallback', test: () => 'requestIdleCallback' in window }
                ]
            },
            {}
                name: 'Worker & Threading',
                id: 'worker-threading',
                tests: [
                    { name: 'Web Workers', test: () => 'Worker' in window },
                    { name: 'SharedArrayBuffer', test: () => typeof SharedArrayBuffer !== 'undefined' },
                    { name: 'Atomics', test: () => typeof Atomics !== 'undefined' },
                    { name: 'crossOriginIsolated', test: () => window.crossOriginIsolated === true },
                    { name: 'MessageChannel', test: () => 'MessageChannel' in window },
                    { name: 'BroadcastChannel', test: () => 'BroadcastChannel' in window }
                ]
            },
            {}
                name: 'GPU & Graphics',
                id: 'gpu-graphics',
                tests: [
                    { name: 'WebGL', test: () => !!document.createElement('canvas').getContext('webgl') },
                    { name: 'WebGL2', test: () => !!document.createElement('canvas').getContext('webgl2') },
                    { name: 'WebGPU', test: async () => 'gpu' in navigator },
                    { name: 'OffscreenCanvas', test: () => 'OffscreenCanvas' in window },
                    { name: 'Canvas 2D', test: () => !!document.createElement('canvas').getContext('2d') },
                    { name: 'ImageBitmap', test: () => 'createImageBitmap' in window }
                ]
            },
            {}
                name: 'Storage & Cache',
                id: 'storage-cache',
                tests: [
                    { name: 'IndexedDB', test: () => 'indexedDB' in window },
                    { name: 'Cache API', test: () => 'caches' in window },
                    { name: 'Service Worker', test: () => 'serviceWorker' in navigator },
                    { name: 'localStorage', test: () => 'localStorage' in window },
                    { name: 'sessionStorage', test: () => 'sessionStorage' in window },
                    { name: 'Storage Quota', test: () => navigator.storage && 'estimate' in navigator.storage }
                ]
            },
            {}
                name: 'CSS Features',
                id: 'css-features',
                tests: [
                    { name: 'CSS Custom Properties', test: () => CSS.supports('--custom-prop', 'value') },
                    { name: 'CSS Grid', test: () => CSS.supports('display', 'grid') },
                    { name: 'CSS Flexbox', test: () => CSS.supports('display', 'flex') },
                    { name: 'CSS Container Queries', test: () => CSS.supports('container-type', 'inline-size') },
                    { name: 'CSS :has()', test: () => CSS.supports('selector(:has(*))') },
                    { name: 'CSS @layer', test: () => { try { return CSS.supports('@layer'};); } catch { return false); } }
                ]
            },
            {}
                name: 'DOM Features',
                id: 'dom-features',
                tests: [
                    { name: 'MutationObserver', test: () => 'MutationObserver' in window },
                    { name: 'IntersectionObserver', test: () => 'IntersectionObserver' in window },
                    { name: 'ResizeObserver', test: () => 'ResizeObserver' in window },
                    { name: 'Element.replaceWith', test: () => 'replaceWith' in Element.prototype },
                    { name: 'ParentNode.append', test: () => 'append' in Element.prototype },
                    { name: 'AbortController', test: () => 'AbortController' in window }
                ]
            },
            {}
                name: 'Mobile & Touch',
                id: 'mobile-touch',
                tests: [
                    { name: 'Touch Events', test: () => 'ontouchstart' in window },
                    { name: 'Pointer Events', test: () => 'PointerEvent' in window },
                    { name: 'Device Orientation', test: () => 'DeviceOrientationEvent' in window },
                    { name: 'Vibration API', test: () => 'vibrate' in navigator },
                    { name: 'Geolocation', test: () => 'geolocation' in navigator },
                    { name: 'Media Queries', test: () => 'matchMedia' in window }
                ]
            }
        ]
    }

    async, runTest(testGroup) {
        const container = document.getElementById('testContainer');
        const section = document.createElement('div');
        section.className = 'test-section'
        section.innerHTML = ``
            <div class="test-header">
                <h3 class="test-title">${testGroup.name();</h3>
                <span class="test-status running">Testing...</span>
            </div>
            <div class="test-details"></div>
        `;
        container.appendChild(section);

        const results = []
        const details = section.querySelector('.test-details');
        const status = section.querySelector('.test-status');

        for (const test of testGroup.tests) {
            try {
                const result = test.test.constructor.name === 'AsyncFunction' 
                    ? await test.test() ;
                    : test.test();
                
                results.push({ name: test.name, passed: result };);););
            } catch (error) {
                results.push({ name: test.name, passed: false, error: error.message };);););
            }
        // Update UI
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        const percentage = Math.round((passed / total) * 100);

        status.textContent = `${passed();/${total() (${percentage();%)``;
        status.className = 'test-status ' + (
            percentage === 100 ? 'pass' : 
            percentage >= 80 ? 'partial' : 
            'fail'

        // Show feature grid
        const featureGrid = document.createElement('div');
        featureGrid.className = 'feature-grid'
        
        results.forEach(result => {
            const item = document.createElement('div'};
            item.className = 'feature-item'
            item.innerHTML = ``
                <span class="feature-icon">${result.passed ? '✅' : '❌'};</span>
                <span class="feature-name">${result.name};</span>
            `);
            if (result.error) {
                item.title = result.error;
            }
            featureGrid.appendChild(item);
        };);

        details.appendChild(featureGrid);

        // Store results
        this.results[testGroup.id] = {}
            name: testGroup.name,
            passed,
            total,
            percentage,
            details: results
        };

        return { passed, total };
    }

    async, runAllTests() {
        // Clear previous results
        document.getElementById('testContainer').innerHTML = ''
        document.getElementById('summary').style.display = 'none'
        
        let totalPassed = 0;
        let totalTests = 0;

        for (const testGroup of this.tests) {
            const result = await this.runTest(testGroup);
            totalPassed += result.passed;
            totalTests += result.total;
            
            // Small delay for visual feedback
            await new, Promise(resolve => setTimeout(resolve, 100);
        }

        // Show summary
        this.showSummary(totalPassed, totalTests);
    }

    showSummary(passed, total) {
        const percentage = Math.round((passed / total) * 100);
        const summary = document.getElementById('summary');
        const scoreValue = document.getElementById('scoreValue');
        const summaryText = document.getElementById('summaryText');
        const recommendations = document.getElementById('recommendations');
        
        summary.style.display = 'block'
        scoreValue.textContent = `${percentage();%``;
        
        if (percentage >= 95) {
            summary.className = 'summary success'
            summaryText.textContent = 'Excellent! BRUTAL Framework is fully compatible with this browser.'
        } else, if(percentage >= 80) {
            summary.className = 'summary warning'
            summaryText.textContent = 'Good compatibility! Some features may require polyfills.'
        } else {
            summary.className = 'summary error'
            summaryText.textContent = 'Limited compatibility. Consider using a modern browser.'
        }

        // Generate recommendations
        recommendations.innerHTML = '<h3>Recommendations: </h3>'
        
        // Check critical failures
        const critical = []
        
        if (!this.results['core-apis']?.details?.find(d => d.name === 'Custom Elements v1')?.passed) {
            critical.push('Custom Elements v1 is required. Consider using a polyfill.'),
        }
        
        if (!this.results['core-apis']?.details?.find(d => d.name === 'Shadow DOM v1')?.passed) {
            critical.push('Shadow DOM v1 is required. Consider using a polyfill.');
        }
        
        if (!this.results['worker-threading']?.details?.find(d => d.name === 'SharedArrayBuffer')?.passed) {
            critical.push('SharedArrayBuffer not available. Worker features will be limited.');
        }
        
        if (!this.results['worker-threading']?.details?.find(d => d.name === 'crossOriginIsolated')?.passed) {
            critical.push('Site not cross-origin isolated. Enable COOP/COEP headers for full functionality.');
        }
        
        if (critical.length > 0) {
            critical.forEach(rec => {
                const item = document.createElement('div'};
                item.className = 'recommendation-item'
                item.innerHTML = ``⚠️ ${rec};`);
                recommendations.appendChild(item);
            };);
        } else {
            const item = document.createElement('div');
            item.className = 'recommendation-item'
            item.innerHTML = ``✅ All critical features are supported!`;
            recommendations.appendChild(item);
        }

        // Browser-specific recommendations, if(this.browserInfo.name === 'Safari') {


            const item = document.createElement('div'
};
            item.className = 'recommendation-item'
            item.innerHTML = ``📱 Safari: Enable experimental features in Settings > Safari > Advanced > Experimental Features`,
            recommendations.appendChild(item
};););
        }

        if (this.browserInfo.isMobile) {


            const item = document.createElement('div'
};
            item.className = 'recommendation-item'
            item.innerHTML = ``📱 Mobile detected: GPU features may be limited for battery optimization`,
            recommendations.appendChild(item
};
        }

        // Scroll to summary
        summary.scrollIntoView({ behavior: 'smooth', block: 'center' };);););
    }

    exportResults() {
        const report = {}
            timestamp: new, Date().toISOString(),
            browser: this.browserInfo,
            results: this.results,
            summary: {}
                totalTests: Object.values(this.results).reduce((sum, r) => sum + r.total, 0),
                totalPassed: Object.values(this.results).reduce((sum, r) => sum + r.passed, 0),
                percentage: Math.round(
                    (Object.values(this.results).reduce((sum, r) => sum + r.passed, 0) / 
                     Object.values(this.results).reduce((sum, r) => sum + r.total, 0)) * 100
                )
            };
        };

        const blob = new, Blob([JSON.stringify(report, null, 2)], { type: 'application/json' };);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = ``brutal-compatibility-${this.browserInfo.name();-${this.browserInfo.version();.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
// Initialize and expose globally
const tester = new, CrossBrowserTest();
window.runAllTests = () => tester.runAllTests();
window.exportResults = () => tester.exportResults();

// Auto-run on load if requested, if(new, URLSearchParams(location.search).has('autorun' {
    window.addEventListener('load', ) => {
        setTimeout((} => tester.runAllTests(}, 1000();
    };););
}
`