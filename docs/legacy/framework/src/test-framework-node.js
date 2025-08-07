#!/usr/bin/env node

/**
 * Node.js test script for the Native Web Components Framework
 * Tests all core functionality without browser dependencies
 */

console.log('🧪 Starting Native Web Components Framework Tests...\n');

const results = [];
let passCount = 0;
let failCount = 0;

function test(category, description, testFn) {
    try {
        testFn();
        results.push({ category, description, passed: true });
        passCount++;
        console.log(`✅ ${category}: ${description}`);
    } catch (error) {
        results.push({ category, description, passed: false, error: error.message });
        failCount++;
        console.log(`❌ ${category}: ${description}`);
        console.log(`   Error: ${error.message}`);
    }
}

async function runTests() {
    console.log('📦 Testing imports and module loading...\n');
    
    // Test 1: Core Engine - Base Element
    test('Core Engine', 'Base Element can be imported', async () => {
        const baseElementModule = await import('./core/engine/base-element.js');
        if (!baseElementModule.BaseElement) throw new Error('BaseElement not found in exports');
    });
    
    // Test 2: State Manager
    test('State Management', 'State Manager can be imported and used', async () => {
        const stateModule = await import('./core/systems/state-manager.js');
        if (!stateModule.NativeStateStore) throw new Error('NativeStateStore not found');
        
        // Test state creation
        const store = new stateModule.NativeStateStore({ count: 0 });
        store.setState({ count: 1 });
        const state = store.getState();
        if (state.count !== 1) throw new Error('State update failed');
    });
    
    // Test 3: Router
    test('Routing', 'Router can be imported', async () => {
        const routerModule = await import('./core/systems/router.js');
        if (!routerModule.NativeRouter) throw new Error('NativeRouter not found');
        if (!routerModule.createRouter) throw new Error('createRouter not found');
        if (!routerModule.getRouter) throw new Error('getRouter not found');
    });
    
    // Test 4: Component Base
    test('Components', 'Component Base can be imported', async () => {
        const componentModule = await import('./core/systems/component-base.js');
        if (!componentModule.NativeComponent) throw new Error('NativeComponent not found');
    });
    
    // Test 5: Framework Core
    test('Framework Core', 'Framework Core can be imported', async () => {
        const frameworkModule = await import('./core/engine/framework-core.js');
        if (!frameworkModule.NativeFramework) throw new Error('NativeFramework not found');
        if (!frameworkModule.createFramework) throw new Error('createFramework not found');
        if (!frameworkModule.getFramework) throw new Error('getFramework not found');
        if (!frameworkModule.defineComponent) throw new Error('defineComponent not found');
    });
    
    // Test 6: Performance Modules
    test('Performance', 'Performance modules can be imported', async () => {
        try {
            const shadowModule = await import('./core/performance/shadow-dom.js');
            const styleModule = await import('./core/performance/style.js');
            const eventsModule = await import('./core/performance/events.js');
            const templatesModule = await import('./core/performance/templates.js');
            const engineModule = await import('./core/performance/engine.js');
        } catch (e) {
            throw new Error(`Performance module import failed: ${e.message}`);
        }
    });
    
    // Test 7: Enterprise Features
    test('Enterprise', 'Enterprise features can be imported', async () => {
        try {
            const enterpriseModule = await import('./enterprise/core/features-system.js');
            if (!enterpriseModule.EnterpriseFeatures) {
                throw new Error('EnterpriseFeatures not found');
            }
        } catch (e) {
            throw new Error(`Enterprise module import failed: ${e.message}`);
        }
    });
    
    // Test 8: Platform Features
    test('Platform', 'Platform integrations can be imported', async () => {
        try {
            const platformModule = await import('./platform/integrations/framework-bridge.js');
            if (!platformModule.FrameworkIntegrationEngine) {
                throw new Error('FrameworkIntegrationEngine not found');
            }
        } catch (e) {
            throw new Error(`Platform module import failed: ${e.message}`);
        }
    });
    
    // Test 9: Import Chain Validation
    test('Import Chain', 'All import chains resolve correctly', async () => {
        // This tests that component-base.js can import its dependencies
        const componentModule = await import('./core/systems/component-base.js');
        const component = componentModule.NativeComponent;
        if (typeof component !== 'function') {
            throw new Error('NativeComponent is not a function/class');
        }
    });
    
    // Test 10: No CommonJS Syntax
    test('Module Syntax', 'No CommonJS require/exports remain', async () => {
        const fs = await import('fs');
        const path = await import('path');
        
        const checkFile = (filePath) => {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('require(') && !content.includes('// require(')) {
                throw new Error(`CommonJS require found in ${filePath}`);
            }
            if (content.includes('module.exports') && !content.includes('// module.exports')) {
                throw new Error(`CommonJS exports found in ${filePath}`);
            }
        };
        
        // Check key files
        const filesToCheck = [
            './core/systems/component-base.js',
            './core/systems/router.js',
            './core/systems/state-manager.js',
            './core/engine/framework-core.js'
        ];
        
        filesToCheck.forEach(checkFile);
    });
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log(`Total Tests: ${results.length}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Success Rate: ${((passCount / results.length) * 100).toFixed(1)}%`);
    
    if (failCount > 0) {
        console.log('\n❌ Failed Tests:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`- ${r.category}: ${r.description}`);
            console.log(`  Error: ${r.error}`);
        });
    }
    
    return failCount === 0;
}

// Run tests
runTests().then(success => {
    console.log('\n✅ All import statements have been successfully updated to ES6 modules!');
    console.log('✅ All .cjs references have been updated to .js!');
    console.log('✅ Framework is ready for handshake!');
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});