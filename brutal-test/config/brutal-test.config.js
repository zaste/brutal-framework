/**
 * BRUTAL Test System Configuration
 */

export default {
    // Test paths
    testPath: '../../framework-v3',
    outputDir: '../results',
    
    // Server configuration
    server: {
        port: 3333,
        root: '../../framework-v3',
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp'
        }
    },
    
    // Browser configuration
    browsers: ['chrome'], // Add 'firefox', 'safari' for cross-browser
    viewport: {
        width: 1920,
        height: 1080
    },
    headless: true,
    
    // Test modes
    modes: {
        quick: {
            tests: ['unit', 'smoke'],
            timeout: 30000,
            parallel: true
        },
        visual: {
            tests: ['visual', 'regression'],
            screenshots: true,
            fullPage: true,
            threshold: 0.1 // 10% difference threshold
        },
        complete: {
            tests: ['all'],
            coverage: true,
            performance: true,
            accessibility: true
        },
        continuous: {
            interval: 300000, // 5 minutes
            tests: ['critical'],
            alert: true
        }
    },
    
    // Test patterns
    testPatterns: {
        unit: /\.(spec|test)\.js$/,
        integration: /test.*\.html$/,
        visual: /visual.*test/i,
        performance: /perf.*test/i
    },
    
    // Error handling
    errorHandling: {
        captureConsole: true,
        captureNetwork: true,
        captureUnhandled: true,
        stackTraceLimit: 10
    },
    
    // Performance thresholds
    performance: {
        firstContentfulPaint: 1800,
        totalBlockingTime: 300,
        cumulativeLayoutShift: 0.1,
        minFPS: 30
    },
    
    // Reporting
    reporting: {
        formats: ['html', 'json'],
        screenshots: true,
        videos: false,
        coverage: true
    },
    
    // Fix suggestions
    autoFix: {
        enabled: false,
        types: ['formatting', 'imports', 'simple-errors']
    }
};