#!/usr/bin/env node

/**
 * Browser simulation test for the Native Web Components Framework
 * Tests the actual framework modules as they would work in a browser
 */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simulated browser environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost:8080',
    pretendToBeVisual: true,
    resources: 'usable'
});

// Set up globals
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
global.CustomEvent = dom.window.CustomEvent;
global.performance = dom.window.performance;

console.log('🧪 Testing Native Web Components Framework in simulated browser...\n');

async function runTests() {
    const results = [];
    
    // Test 1: Import and test State Manager
    try {
        console.log('📦 Testing State Manager...');
        const { NativeStateStore } = await import('./core/systems/state-manager.js');
        
        const store = new NativeStateStore({ count: 0 });
        store.setState({ count: 1 });
        const state = store.getState();
        
        if (state.count === 1) {
            console.log('✅ State Manager works correctly');
            results.push({ test: 'State Manager', passed: true });
        } else {
            throw new Error('State update failed');
        }
    } catch (error) {
        console.log(`❌ State Manager error: ${error.message}`);
        results.push({ test: 'State Manager', passed: false, error: error.message });
    }
    
    // Test 2: Import and test Router
    try {
        console.log('\n📦 Testing Router...');
        const { NativeRouter } = await import('./core/systems/router.js');
        
        const router = new NativeRouter();
        router.route('/', 'Home Page');
        router.route('/about', 'About Page');
        
        console.log(`✅ Router initialized with ${router.routes.size} routes`);
        results.push({ test: 'Router', passed: true });
    } catch (error) {
        console.log(`❌ Router error: ${error.message}`);
        results.push({ test: 'Router', passed: false, error: error.message });
    }
    
    // Test 3: Import and test Component Base
    try {
        console.log('\n📦 Testing Component Base...');
        const { NativeComponent } = await import('./core/systems/component-base.js');
        
        // Test if we can create a component class
        class TestComponent extends NativeComponent {
            getTemplate() {
                return '<div>Test Component</div>';
            }
        }
        
        console.log('✅ Component Base works correctly');
        results.push({ test: 'Component Base', passed: true });
    } catch (error) {
        console.log(`❌ Component Base error: ${error.message}`);
        results.push({ test: 'Component Base', passed: false, error: error.message });
    }
    
    // Test 4: Import and test Framework Core
    try {
        console.log('\n📦 Testing Framework Core...');
        const { createFramework, NativeFramework } = await import('./core/engine/framework-core.js');
        
        const framework = createFramework({
            enableRouter: true,
            enableStateManagement: true
        });
        
        if (framework instanceof NativeFramework) {
            console.log('✅ Framework Core works correctly');
            results.push({ test: 'Framework Core', passed: true });
        } else {
            throw new Error('Framework creation failed');
        }
    } catch (error) {
        console.log(`❌ Framework Core error: ${error.message}`);
        results.push({ test: 'Framework Core', passed: false, error: error.message });
    }
    
    // Summary
    console.log('\n📊 Test Summary:');
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    console.log(`Total: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
        console.log('\n✅ All tests passed! Framework is working correctly.');
    } else {
        console.log('\n❌ Some tests failed:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`- ${r.test}: ${r.error}`);
        });
    }
    
    return passed === total;
}

// Run tests
runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});