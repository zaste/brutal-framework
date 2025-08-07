/**
 * Test the BRUTAL Test System
 */

import BrutalTestSystem from './brutal-test/index.js';

async function testSystem() {
    console.log('🧪 Testing BRUTAL Test System...\n');
    
    try {
        // Create test system with basic config
        const testSystem = new BrutalTestSystem({
            mode: 'quick',
            browsers: ['chrome'],
            headless: true,
            outputDir: './test-results',
            viewport: { width: 1920, height: 1080 }
        });
        
        console.log('1. Initializing test system...');
        await testSystem.initialize();
        console.log('✅ Test system initialized\n');
        
        console.log('2. Running quick test...');
        const results = await testSystem.run('./framework-v3');
        
        console.log('\n📊 Test Results:');
        console.log(`- Total errors: ${results.errors?.length || 0}`);
        console.log(`- Tests run: ${results.tests?.length || 0}`);
        console.log(`- Duration: ${(results.duration / 1000).toFixed(2)}s`);
        
        if (results.errors && results.errors.length > 0) {
            console.log('\n❌ Errors found:');
            results.errors.slice(0, 3).forEach((error, i) => {
                console.log(`${i + 1}. ${error.type || 'ERROR'}: ${error.message || error.text}`);
            });
        }
        
        console.log('\n✅ BRUTAL Test System is working!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run test
testSystem();