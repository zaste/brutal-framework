/**
 * Basic test of BRUTAL Test System
 */

import BrutalTestSystem from './brutal-test/index.js';

async function basicTest() {
    console.log('🧪 Basic BRUTAL Test System Test\n');
    
    const testSystem = new BrutalTestSystem({
        mode: 'quick',
        browsers: ['chrome'],
        headless: true,
        outputDir: './test-results-basic'
    });
    
    try {
        console.log('1. Initializing...');
        await testSystem.initialize();
        
        console.log('2. Testing single file...');
        // Test just one specific file to avoid coverage conflicts
        const results = await testSystem.engine.runTest({
            name: 'index.html',
            path: 'framework-v3/index.html',
            type: 'integration',
            format: '.html',
            priority: 100
        });
        
        console.log('\n✅ Test completed!');
        console.log('Results:', results);
        
        await testSystem.cleanup();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

basicTest();