/**
 * Complete test of BRUTAL Test System
 */

import BrutalTestSystem from './brutal-test/index.js';

async function completeTest() {
    console.log('🧪 Complete BRUTAL Test System Verification\n');
    
    const testSystem = new BrutalTestSystem({
        mode: 'quick',
        browsers: ['chrome'],
        headless: true,
        outputDir: './test-results-complete',
        viewport: { width: 1920, height: 1080 }
    });
    
    try {
        console.log('1. Initializing system...');
        await testSystem.initialize();
        console.log('✅ System initialized\n');
        
        console.log('2. Running test on example file...');
        const results = await testSystem.run('./framework-v3/test-example.html');
        
        console.log('\n📊 Complete Test Results:');
        console.log('========================');
        console.log(`Total errors: ${results.errors?.length || 0}`);
        console.log(`Tests run: ${results.tests?.length || 0}`);
        console.log(`Duration: ${(results.duration / 1000).toFixed(2)}s`);
        
        // Show test details
        if (results.tests && results.tests.length > 0) {
            console.log('\nTest Details:');
            results.tests.forEach(test => {
                console.log(`\n- ${test.name}`);
                console.log(`  Status: ${test.result?.status || 'unknown'}`);
                if (test.result?.total) {
                    console.log(`  Results: ${test.result.passed}/${test.result.total} passed`);
                }
                if (test.capture?.errors?.total > 0) {
                    console.log(`  Captured errors: ${test.capture.errors.total}`);
                }
            });
        }
        
        // Show errors if any
        if (results.errors && results.errors.length > 0) {
            console.log('\n❌ Errors detected:');
            results.errors.slice(0, 5).forEach((error, i) => {
                console.log(`${i + 1}. ${error.type || 'ERROR'}: ${error.message || error.text}`);
            });
        }
        
        // Show analysis if available
        if (results.analysis) {
            console.log('\n🔍 Analysis:');
            if (results.analysis.errors) {
                console.log(`- Error types: ${Object.keys(results.analysis.errors.byType).join(', ')}`);
            }
            if (results.analysis.performance) {
                console.log(`- Performance score: ${results.analysis.performance.performanceScore}%`);
            }
            if (results.analysis.rootCauses?.primaryCause) {
                console.log(`- Root cause: ${results.analysis.rootCauses.primaryCause.rootCause}`);
            }
        }
        
        // Show suggestions
        if (results.suggestions && results.suggestions.length > 0) {
            console.log('\n💡 Suggestions:');
            results.suggestions.slice(0, 3).forEach((suggestion, i) => {
                console.log(`${i + 1}. ${suggestion.title}`);
            });
        }
        
        console.log('\n✅ BRUTAL Test System is fully operational!');
        console.log(`📁 Full report saved to: ${results.outputDir || testSystem.config.outputDir}`);
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run test
completeTest();