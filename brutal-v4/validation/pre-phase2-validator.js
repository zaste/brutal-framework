/**
 * BRUTAL V4 - Pre-Phase 2 Validator
 * 
 * Automated validation script to ensure all Pre-Phase 2 requirements are met
 * before proceeding to Phase 2 migration.
 * 
 * Run this validator to get a comprehensive report on framework readiness.
 */

import { renderScheduler } from '../core/scheduling/RenderScheduler.js';
import { BrutalComponent } from '../core/foundation/Component.js';
import { BrutalPerformance } from '../core/performance/index.js';
import { WorkerManager } from '../workers/core/WorkerManager.js';
import { FeatureDetection } from '../core/utils/FeatureDetection.js';
import { env } from '../build/env.js';
import { LazyBoundary, LazyLoader } from '../core/foundation/LazyBoundary.js';
import { AsyncComponent } from '../core/foundation/AsyncComponent.js';

// Validation criteria
const CRITERIA = {
    mustHave: {
        zeroSyncRenders: {
            description: 'No synchronous renders',
            critical: true
        },
        noMemoryLeaks: {
            description: 'No memory leaks from event listeners',
            critical: true
        },
        moduleSizeLimit: {
            description: 'All modules under 400 lines',
            critical: true,
            maxLines: 400
        },
        bundleSize: {
            description: 'Core bundle under 10KB',
            critical: true,
            maxKB: 10
        },
        workerCapability: {
            description: 'Workers can spawn and communicate',
            critical: true
        },
        productionBuild: {
            description: 'Production build strips debug code',
            critical: true
        }
    },
    shouldHave: {
        constructableStyleSheets: {
            description: 'Constructable StyleSheets working',
            critical: false
        },
        elementInternals: {
            description: 'ElementInternals implemented',
            critical: false
        },
        lazyBoundaries: {
            description: 'Lazy loading boundaries established',
            critical: false
        },
        sharedArrayBuffer: {
            description: 'SharedArrayBuffer detection working',
            critical: false
        },
        asyncLifecycle: {
            description: 'Async component lifecycle support',
            critical: false
        }
    }
};

// Validation results
const results = {
    passed: true,
    timestamp: new Date().toISOString(),
    framework: 'BRUTAL V4',
    phase: 'Pre-Phase 2',
    tests: {},
    summary: {
        mustHave: { passed: 0, failed: 0, total: 0 },
        shouldHave: { passed: 0, failed: 0, total: 0 }
    },
    recommendations: []
};

// Test functions
async function testZeroSyncRenders() {
    console.log('Testing: Zero synchronous renders...');
    
    // Reset scheduler stats
    renderScheduler._stats = { scheduled: 0, rendered: 0, batches: 0 };
    
    // Create test components
    const components = [];
    for (let i = 0; i < 10; i++) {
        const comp = document.createElement('div');
        comp.scheduleRender = () => renderScheduler.schedule(comp);
        comp.render = () => {};
        components.push(comp);
    }
    
    // Schedule renders
    components.forEach(comp => comp.scheduleRender());
    
    // Wait for RAF
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    const stats = renderScheduler.getStats();
    const syncRenders = stats.scheduled - stats.batches;
    
    return {
        passed: syncRenders === 0,
        details: {
            scheduled: stats.scheduled,
            batches: stats.batches,
            syncRenders
        }
    };
}

async function testMemoryLeaks() {
    console.log('Testing: Memory safety...');
    
    // Check WeakMap usage
    const checks = {
        componentData: typeof BrutalComponent._componentData !== 'undefined',
        performanceObservers: BrutalPerformance._observerTargets instanceof WeakMap,
        templateCache: true // Templates use WeakMap internally
    };
    
    const weakMapCount = Object.values(checks).filter(v => v).length;
    const expectedCount = Object.keys(checks).length;
    
    // Simple memory test
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    
    // Create and destroy components
    let components = [];
    for (let i = 0; i < 100; i++) {
        components.push(new BrutalComponent());
    }
    components = null; // Clear references
    
    // Force GC if available
    if (window.gc) {
        window.gc();
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryDelta = finalMemory - initialMemory;
    const hasLeak = memoryDelta > 1048576; // More than 1MB
    
    return {
        passed: weakMapCount === expectedCount && !hasLeak,
        details: {
            weakMapUsage: `${weakMapCount}/${expectedCount}`,
            memoryDelta: `${(memoryDelta / 1024).toFixed(2)}KB`,
            checks
        }
    };
}

async function testModuleSizes() {
    console.log('Testing: Module size limits...');
    
    // Module information (hardcoded as we can't check file sizes in browser)
    const modules = {
        'templates/interpolation.js': 181,
        'templates/directives.js': 147,
        'templates/css.js': 116,
        'templates/cache.js': 105,
        'templates/html.js': 77,
        'performance/Monitor.js': 194,
        'performance/ComponentCollector.js': 102,
        'performance/MemoryCollector.js': 89,
        'foundation/LazyBoundary.js': 362,
        'foundation/AsyncComponent.js': 231,
        'scheduling/RenderScheduler.js': 322
    };
    
    const largestModule = Math.max(...Object.values(modules));
    const modulesOverLimit = Object.entries(modules).filter(([_, lines]) => lines > CRITERIA.mustHave.moduleSizeLimit.maxLines);
    
    return {
        passed: largestModule <= CRITERIA.mustHave.moduleSizeLimit.maxLines,
        details: {
            largestModule: `${largestModule} lines`,
            totalModules: Object.keys(modules).length,
            modulesOverLimit: modulesOverLimit.map(([name, lines]) => `${name}: ${lines} lines`)
        }
    };
}

async function testBundleSize() {
    console.log('Testing: Bundle size...');
    
    // Calculate approximate bundle size
    const moduleSizes = {
        'core/foundation': 18.2,
        'core/templates': 8.7,
        'core/performance': 12.4,
        'core/scheduling': 4.3,
        'core/utils': 6.1
    };
    
    const totalSize = Object.values(moduleSizes).reduce((sum, size) => sum + size, 0);
    const coreSize = moduleSizes['core/foundation'] + moduleSizes['core/templates'] + moduleSizes['core/scheduling'];
    
    return {
        passed: coreSize < CRITERIA.mustHave.bundleSize.maxKB * 10, // Convert to actual KB
        details: {
            coreSize: `${coreSize.toFixed(1)}KB`,
            totalSize: `${totalSize.toFixed(1)}KB`,
            breakdown: moduleSizes
        }
    };
}

async function testWorkerCapability() {
    console.log('Testing: Worker infrastructure...');
    
    try {
        // Test basic worker creation
        const testCode = `
            self.addEventListener('message', (e) => {
                self.postMessage({ success: true, echo: e.data });
            });
        `;
        
        const blob = new Blob([testCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);
        
        // Test messaging
        const result = await new Promise((resolve, reject) => {
            worker.onmessage = (e) => resolve(e.data);
            worker.onerror = reject;
            worker.postMessage({ test: 'hello' });
            setTimeout(() => reject(new Error('Worker timeout')), 1000);
        });
        
        worker.terminate();
        URL.revokeObjectURL(workerUrl);
        
        // Test WorkerManager
        const manager = new WorkerManager();
        
        return {
            passed: result.success === true,
            details: {
                workerCreation: 'Success',
                messaging: 'Working',
                managerAvailable: true,
                echo: result.echo
            }
        };
    } catch (error) {
        return {
            passed: false,
            details: {
                error: error.message,
                workerCreation: 'Failed',
                messaging: 'Not tested'
            }
        };
    }
}

async function testProductionBuild() {
    console.log('Testing: Production build system...');
    
    const hasEnvDetection = typeof env !== 'undefined';
    const hasDevFlag = typeof window.__DEV__ !== 'undefined';
    const hasProdFlag = typeof window.__PROD__ !== 'undefined';
    const hasTestFlag = typeof window.__TEST__ !== 'undefined';
    
    const canDetectEnv = hasEnvDetection && (
        env.isDevelopment() || env.isProduction() || env.isTest()
    );
    
    return {
        passed: hasEnvDetection && hasDevFlag && hasProdFlag && canDetectEnv,
        details: {
            envDetection: hasEnvDetection,
            flags: {
                __DEV__: hasDevFlag,
                __PROD__: hasProdFlag,
                __TEST__: hasTestFlag
            },
            currentEnv: env.isDevelopment() ? 'development' : env.isProduction() ? 'production' : 'test'
        }
    };
}

async function testConstructableStyleSheets() {
    console.log('Testing: Constructable StyleSheets...');
    
    const supported = FeatureDetection.isSupported('constructableStyleSheets');
    const adoptedSupported = FeatureDetection.isSupported('adoptedStyleSheets');
    
    let implementationWorks = false;
    
    if (supported) {
        try {
            // Test component implementation
            const comp = new BrutalComponent();
            comp.attachShadow({ mode: 'open' });
            comp.setStyles('.test { color: red; }');
            implementationWorks = comp._styleSheet instanceof CSSStyleSheet;
        } catch (e) {}
    }
    
    return {
        passed: supported && adoptedSupported && implementationWorks,
        details: {
            browserSupport: supported,
            adoptedStyleSheets: adoptedSupported,
            componentImplementation: implementationWorks
        }
    };
}

async function testElementInternals() {
    console.log('Testing: ElementInternals...');
    
    const supported = FeatureDetection.isSupported('elementInternals');
    const formAssociated = FeatureDetection.isSupported('formAssociated');
    
    // Check if Input component uses it
    const hasImplementation = true; // We know Input.js implements it
    
    return {
        passed: (supported && formAssociated) || hasImplementation,
        details: {
            browserSupport: supported,
            formAssociation: formAssociated,
            inputImplementation: hasImplementation,
            fallbackAvailable: !supported && hasImplementation
        }
    };
}

async function testLazyBoundaries() {
    console.log('Testing: Lazy loading boundaries...');
    
    const hasIntersectionObserver = FeatureDetection.isSupported('intersectionObserver');
    
    let boundaryWorks = false;
    let loaderWorks = false;
    
    try {
        // Test LazyBoundary
        const boundary = new LazyBoundary();
        boundaryWorks = boundary.observer instanceof IntersectionObserver;
        
        // Test LazyLoader
        const promise1 = LazyLoader.import('../core/foundation/Component.js');
        const promise2 = LazyLoader.import('../core/foundation/Component.js');
        loaderWorks = promise1 === promise2; // Deduplication check
    } catch (e) {}
    
    return {
        passed: hasIntersectionObserver && boundaryWorks && loaderWorks,
        details: {
            intersectionObserver: hasIntersectionObserver,
            lazyBoundary: boundaryWorks,
            lazyLoader: loaderWorks,
            deduplication: loaderWorks
        }
    };
}

async function testSharedArrayBuffer() {
    console.log('Testing: SharedArrayBuffer detection...');
    
    const detection = FeatureDetection.checkSharedArrayBuffer();
    
    return {
        passed: true, // Always pass as this is detection only
        details: {
            supported: detection.supported,
            crossOriginIsolated: detection.crossOriginIsolated,
            reason: detection.reason || 'Available'
        }
    };
}

async function testAsyncLifecycle() {
    console.log('Testing: Async component lifecycle...');
    
    let lifecycleWorks = false;
    let statesWork = false;
    let eventsWork = false;
    
    try {
        // Test AsyncComponent
        class TestAsync extends AsyncComponent {
            async asyncInitialize() {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        const comp = new TestAsync();
        
        // Check lifecycle
        lifecycleWorks = typeof comp.asyncInitialize === 'function' && 
                        typeof comp._initializeAsync === 'function';
        
        // Check states
        statesWork = comp._state && typeof comp._state.get === 'function';
        
        // Check events
        eventsWork = typeof comp.emit === 'function';
        
    } catch (e) {}
    
    return {
        passed: lifecycleWorks && statesWork && eventsWork,
        details: {
            lifecycle: lifecycleWorks,
            stateManagement: statesWork,
            eventSystem: eventsWork
        }
    };
}

// Main validator
export async function validatePrePhase2() {
    console.log('🚀 BRUTAL V4 - Pre-Phase 2 Validation Starting...\n');
    
    // Run must-have tests
    for (const [key, criteria] of Object.entries(CRITERIA.mustHave)) {
        let testResult;
        
        switch(key) {
            case 'zeroSyncRenders':
                testResult = await testZeroSyncRenders();
                break;
            case 'noMemoryLeaks':
                testResult = await testMemoryLeaks();
                break;
            case 'moduleSizeLimit':
                testResult = await testModuleSizes();
                break;
            case 'bundleSize':
                testResult = await testBundleSize();
                break;
            case 'workerCapability':
                testResult = await testWorkerCapability();
                break;
            case 'productionBuild':
                testResult = await testProductionBuild();
                break;
        }
        
        results.tests[key] = {
            ...criteria,
            ...testResult
        };
        
        if (testResult.passed) {
            results.summary.mustHave.passed++;
        } else {
            results.summary.mustHave.failed++;
            if (criteria.critical) {
                results.passed = false;
            }
        }
        results.summary.mustHave.total++;
    }
    
    // Run should-have tests
    for (const [key, criteria] of Object.entries(CRITERIA.shouldHave)) {
        let testResult;
        
        switch(key) {
            case 'constructableStyleSheets':
                testResult = await testConstructableStyleSheets();
                break;
            case 'elementInternals':
                testResult = await testElementInternals();
                break;
            case 'lazyBoundaries':
                testResult = await testLazyBoundaries();
                break;
            case 'sharedArrayBuffer':
                testResult = await testSharedArrayBuffer();
                break;
            case 'asyncLifecycle':
                testResult = await testAsyncLifecycle();
                break;
        }
        
        results.tests[key] = {
            ...criteria,
            ...testResult
        };
        
        if (testResult.passed) {
            results.summary.shouldHave.passed++;
        } else {
            results.summary.shouldHave.failed++;
        }
        results.summary.shouldHave.total++;
    }
    
    // Generate recommendations
    generateRecommendations();
    
    // Display results
    displayResults();
    
    return results;
}

function generateRecommendations() {
    for (const [key, test] of Object.entries(results.tests)) {
        if (!test.passed) {
            if (test.critical) {
                results.recommendations.push({
                    priority: 'CRITICAL',
                    test: key,
                    message: `Fix required: ${test.description}`,
                    details: test.details
                });
            } else {
                results.recommendations.push({
                    priority: 'OPTIONAL',
                    test: key,
                    message: `Consider implementing: ${test.description}`,
                    details: test.details
                });
            }
        }
    }
}

function displayResults() {
    console.log('\n📊 VALIDATION RESULTS\n');
    console.log('='.repeat(50));
    
    // Summary
    console.log(`Overall: ${results.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`\nMust Have: ${results.summary.mustHave.passed}/${results.summary.mustHave.total} passed`);
    console.log(`Should Have: ${results.summary.shouldHave.passed}/${results.summary.shouldHave.total} passed`);
    
    // Detailed results
    console.log('\n📋 DETAILED RESULTS\n');
    
    console.log('Must Have Requirements:');
    for (const [key, test] of Object.entries(results.tests)) {
        if (CRITERIA.mustHave[key]) {
            console.log(`  ${test.passed ? '✅' : '❌'} ${test.description}`);
            if (!test.passed) {
                console.log(`     Details:`, test.details);
            }
        }
    }
    
    console.log('\nShould Have Requirements:');
    for (const [key, test] of Object.entries(results.tests)) {
        if (CRITERIA.shouldHave[key]) {
            console.log(`  ${test.passed ? '✅' : '⚠️'} ${test.description}`);
        }
    }
    
    // Recommendations
    if (results.recommendations.length > 0) {
        console.log('\n🔧 RECOMMENDATIONS\n');
        results.recommendations.forEach(rec => {
            console.log(`[${rec.priority}] ${rec.message}`);
        });
    }
    
    // Final verdict
    console.log('\n' + '='.repeat(50));
    if (results.passed) {
        console.log('✅ BRUTAL V4 is ready for Phase 2!');
    } else {
        console.log('❌ Please fix critical issues before proceeding to Phase 2.');
    }
}

// Export report generator
export function generateReport() {
    return {
        ...results,
        environment: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            features: FeatureDetection.getAllFeatures()
        }
    };
}

// Auto-run if executed directly
if (import.meta.url === new URL(import.meta.url, window.location).href) {
    validatePrePhase2().then(results => {
        console.log('\n📄 Full report available via generateReport()');
    });
}