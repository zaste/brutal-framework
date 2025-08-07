/**
 * Test BRUTAL Mode - This should CRASH HARD
 */

import BrutalTestSystem from './brutal-test/index.js';

async function testBrutalMode() {
    console.log('💀 Testing BRUTAL MODE - Expect CRASHES\n');
    
    const testSystem = new BrutalTestSystem({
        mode: 'quick',
        browsers: ['chrome'],
        headless: true,
        outputDir: './brutal-crash-test'
    });
    
    try {
        console.log('Initializing BRUTAL system...');
        await testSystem.initialize();
        
        // This should never get here if BRUTAL mode is working
        console.log('ERROR: System initialized without crashing!');
        console.log('BRUTAL MODE IS NOT BRUTAL ENOUGH!');
        
    } catch (error) {
        console.log('\n💀💀💀 EXPECTED CRASH 💀💀💀');
        console.log('Error:', error.message);
        console.log('\n✅ BRUTAL MODE IS WORKING - System crashed as expected!');
        process.exit(0); // Exit cleanly since this is expected
    }
}

// Test console.warn override
try {
    console.warn('This should crash immediately');
} catch (e) {
    console.log('✅ console.warn correctly throws:', e.message);
}

testBrutalMode();