#!/usr/bin/env node

/**
 * Test de integración REAL del framework
 * Sin simulaciones, probando los módulos reales
 */

import { createFramework, defineComponent, NativeComponent } from '../../core/engine/framework-core.js';
import { NativeStateStore } from '../../core/systems/state-manager.js';
import { NativeRouter } from '../../core/systems/router.js';

console.log('🧪 Test de Integración REAL - Native Web Components Framework\n');

const results = {
    passed: 0,
    failed: 0,
    tests: []
};

async function test(name, testFn) {
    process.stdout.write(`Testing ${name}... `);
    try {
        await testFn();
        console.log('✅ PASSED');
        results.passed++;
        results.tests.push({ name, passed: true });
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
        console.error(error.stack);
        results.failed++;
        results.tests.push({ name, passed: false, error: error.message });
    }
}

// Test 1: Framework Core
await test('Framework Core - Creation', async () => {
    const framework = createFramework({
        enableRouter: true,
        enableStateManagement: true,
        enablePerformanceMonitoring: true
    });
    
    if (!framework) throw new Error('Framework is null');
    if (!framework.component) throw new Error('Framework missing component method');
    if (!framework.route) throw new Error('Framework missing route method');
    if (!framework.navigate) throw new Error('Framework missing navigate method');
});

// Test 2: State Management
await test('State Management - Real Operations', async () => {
    const store = new NativeStateStore({
        count: 0,
        items: [],
        user: null
    });
    
    // Test initial state
    const initialState = store.getState();
    if (initialState.count !== 0) throw new Error('Initial count should be 0');
    
    // Test state update
    store.setState({ count: 5 });
    if (store.getState().count !== 5) throw new Error('Count should be 5 after update');
    
    // Test partial update
    store.setState({ user: { name: 'Test User' } });
    if (store.getState().count !== 5) throw new Error('Count should remain 5');
    if (!store.getState().user) throw new Error('User should be set');
    
    // Test subscription
    let updateCount = 0;
    const unsubscribe = store.subscribe(() => {
        updateCount++;
    });
    
    store.setState({ count: 10 });
    if (updateCount !== 1) throw new Error('Subscriber should be called once');
    
    unsubscribe();
    store.setState({ count: 15 });
    if (updateCount !== 1) throw new Error('Unsubscribed listener should not be called');
});

// Test 3: Router
await test('Router - Route Registration and Navigation', async () => {
    const router = new NativeRouter({
        enableHashRouting: false
    });
    
    // Register routes
    router.route('/', 'Home Page');
    router.route('/about', 'About Page');
    router.route('/products/:id', 'Product Page');
    
    if (router.routes.size !== 3) throw new Error('Should have 3 routes registered');
    
    // Test route finding
    const homeRoute = router._findRoute('/');
    if (!homeRoute) throw new Error('Home route not found');
    
    const productRoute = router._findRoute('/products/123');
    if (!productRoute) throw new Error('Product route not found');
    
    // Test parameter extraction
    const params = router._extractParams(productRoute, '/products/123');
    if (params.id !== '123') throw new Error('Product ID parameter not extracted correctly');
});

// Test 4: Component System
await test('Component System - Class Creation', async () => {
    class TestComponent extends NativeComponent {
        constructor() {
            super();
            this.testValue = 42;
        }
        
        getTemplate() {
            return '<div>Test Component</div>';
        }
        
        getStyles() {
            return ':host { display: block; }';
        }
    }
    
    const component = new TestComponent();
    if (!component) throw new Error('Component creation failed');
    if (component.testValue !== 42) throw new Error('Component property not set');
    if (typeof component.getTemplate !== 'function') throw new Error('getTemplate method missing');
});

// Test 5: Performance Metrics
await test('Performance - Measurement System', async () => {
    const framework = createFramework({
        enablePerformanceMonitoring: true
    });
    
    const metrics = framework.getMetrics();
    if (!metrics) throw new Error('Metrics should be available');
    if (!metrics.framework) throw new Error('Framework metrics missing');
    if (typeof metrics.framework.initialized !== 'boolean') throw new Error('Framework initialization state missing');
});

// Test 6: Store Creation via Framework
await test('Framework Store Management', async () => {
    const framework = createFramework();
    
    const store1 = framework.createStore('test1', { value: 1 });
    const store2 = framework.createStore('test2', { value: 2 });
    
    if (store1.getState().value !== 1) throw new Error('Store 1 initial value incorrect');
    if (store2.getState().value !== 2) throw new Error('Store 2 initial value incorrect');
    
    // Test getting existing store
    const store1Again = framework.getStore('test1');
    if (store1Again !== store1) throw new Error('Should return same store instance');
});

// Test 7: Integration - Component with State
await test('Integration - Component + State', async () => {
    const framework = createFramework();
    const globalStore = framework.createStore('global', { theme: 'light' });
    
    class ThemedComponent extends NativeComponent {
        constructor() {
            super();
            this.store = globalStore;
        }
        
        getTemplate() {
            const theme = this.store.getState().theme;
            return `<div class="theme-${theme}">Themed Component</div>`;
        }
    }
    
    const component = new ThemedComponent();
    const template = component.getTemplate();
    if (!template.includes('theme-light')) throw new Error('Component should use light theme');
    
    globalStore.setState({ theme: 'dark' });
    const newTemplate = component.getTemplate();
    if (!newTemplate.includes('theme-dark')) throw new Error('Component should update to dark theme');
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${results.passed + results.failed}`);
console.log(`Passed: ${results.passed} ✅`);
console.log(`Failed: ${results.failed} ❌`);
console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.failed > 0) {
    console.log('\nFailed Tests:');
    results.tests.filter(t => !t.passed).forEach(t => {
        console.log(`- ${t.name}: ${t.error}`);
    });
    process.exit(1);
} else {
    console.log('\n🎉 All integration tests passed!');
    process.exit(0);
}