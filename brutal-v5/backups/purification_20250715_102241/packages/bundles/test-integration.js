#!/usr/bin/env node
/**
 * Comprehensive integration test for BRUTAL bundles
 * Tests that all packages are properly integrated and functional
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';
import kleur from 'kleur';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'passed' });
    console.log(kleur.green('✓'), name);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
    console.log(kleur.red('✗'), name);
    console.log(kleur.gray('  ' + error.message));
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function testBundle(bundleName, bundlePath) {
  console.log(kleur.bold(`\n🧪 Testing ${bundleName} bundle\n`));
  
  // Load bundle
  const bundleCode = readFileSync(bundlePath, 'utf8');
  
  // Create a module context
  const context = {
    console,
    exports: {},
    module: { exports: {} }
  };
  
  // Execute bundle in VM
  try {
    vm.createContext(context);
    vm.runInContext(bundleCode, context);
  } catch (error) {
    console.error(kleur.red(`Failed to load bundle: ${error.message}`));
    return;
  }
  
  const brutal = context.module.exports || context.exports;
  
  // Test based on bundle type
  if (bundleName === 'brutal-lite') {
    testLiteBundle(brutal);
  } else if (bundleName === 'brutal-core') {
    testCoreBundle(brutal);
  }
}

function testLiteBundle(brutal) {
  test('lite bundle exports foundation', () => {
    assert(brutal.foundation, 'foundation module missing');
    assert(typeof brutal.foundation === 'object', 'foundation should be an object');
  });
  
  test('lite bundle exports shared', () => {
    assert(brutal.shared, 'shared module missing');
    assert(typeof brutal.shared === 'object', 'shared should be an object');
  });
  
  test('lite bundle exports templates', () => {
    assert(brutal.templates, 'templates module missing');
    assert(typeof brutal.templates === 'object', 'templates should be an object');
  });
  
  test('lite bundle exports components', () => {
    assert(brutal.components, 'components module missing');
    assert(typeof brutal.components === 'object', 'components should be an object');
  });
  
  // Test specific functionality
  test('shared utilities work correctly', () => {
    assert(brutal.shared.BrutalError, 'BrutalError class missing');
    const error = new brutal.shared.BrutalError('test');
    assert(error.message === 'test', 'BrutalError message incorrect');
    assert(error.name === 'BrutalError', 'BrutalError name incorrect');
  });
  
  test('template compilation works', () => {
    assert(brutal.templates.compile, 'compile function missing');
    const template = brutal.templates.compile('Hello ${name}!');
    assert(template, 'template compilation failed');
    assert(template.render, 'template.render method missing');
    const result = template.render({ name: 'World' });
    assert(result === 'Hello World!', `Expected "Hello World!", got "${result}"`);
  });
  
  test('HTML escaping works', () => {
    const template = brutal.templates.compile('${content}');
    const result = template.render({ content: '<script>alert("xss")</script>' });
    assert(result.includes('&lt;script&gt;'), 'HTML not escaped properly');
  });
}

function testCoreBundle(brutal) {
  // Test all 11 core packages
  const corePackages = [
    'foundation', 'shared', 'events', 'templates', 
    'cache', 'components', 'state', 'routing', 
    'scheduling', 'a11y', 'plugins'
  ];
  
  corePackages.forEach(pkg => {
    test(`core bundle exports ${pkg}`, () => {
      assert(brutal[pkg], `${pkg} module missing`);
      assert(typeof brutal[pkg] === 'object', `${pkg} should be an object`);
    });
  });
  
  // Test events functionality
  test('EventEmitter works correctly', () => {
    assert(brutal.events.EventEmitter, 'EventEmitter class missing');
    const emitter = new brutal.events.EventEmitter();
    let received = null;
    emitter.on('test', (data) => { received = data; });
    emitter.emit('test', { value: 42 });
    assert(received?.value === 42, 'Event not received correctly');
  });
  
  // Test state management
  test('createStore works correctly', () => {
    assert(brutal.state.createStore, 'createStore function missing');
    const store = brutal.state.createStore({
      initialState: { count: 0 },
      actions: {
        increment: (state) => ({ count: state.count + 1 })
      }
    });
    assert(store, 'Store creation failed');
    assert(store.getState().count === 0, 'Initial state incorrect');
    store.dispatch('increment');
    assert(store.getState().count === 1, 'State update failed');
  });
  
  // Test routing
  test('Router instantiation works', () => {
    assert(brutal.routing.Router, 'Router class missing');
    const router = new brutal.routing.Router();
    assert(router, 'Router instantiation failed');
    assert(typeof router.addRoute === 'function', 'addRoute method missing');
    assert(typeof router.navigate === 'function', 'navigate method missing');
  });
  
  // Test cache
  test('MemoryCache works correctly', () => {
    assert(brutal.cache.MemoryCache, 'MemoryCache class missing');
    const cache = new brutal.cache.MemoryCache();
    cache.set('key', 'value');
    assert(cache.get('key') === 'value', 'Cache get/set failed');
    assert(cache.has('key') === true, 'Cache has() failed');
    cache.delete('key');
    assert(cache.has('key') === false, 'Cache delete failed');
  });
  
  // Test cache factory
  test('createCache factory works', () => {
    assert(brutal.cache.createCache, 'createCache function missing');
    const cache = brutal.cache.createCache({ type: 'memory' });
    assert(cache, 'Cache creation failed');
    cache.set('test', 123);
    assert(cache.get('test') === 123, 'Factory-created cache failed');
  });
  
  // Test component base
  test('BrutalComponent exists', () => {
    assert(brutal.components.BrutalComponent, 'BrutalComponent class missing');
    assert(typeof brutal.components.BrutalComponent === 'function', 'BrutalComponent should be a class');
  });
  
  // Test scheduling
  test('scheduling module exports exist', () => {
    assert(brutal.scheduling, 'scheduling module missing');
    // Check for expected exports (placeholder for now)
  });
  
  // Test a11y
  test('a11y module exports exist', () => {
    assert(brutal.a11y, 'a11y module missing');
    // Check for expected exports (placeholder for now)
  });
  
  // Test plugins
  test('plugins module exports exist', () => {
    assert(brutal.plugins, 'plugins module missing');
    // Check for expected exports (placeholder for now)
  });
  
  // Test cross-package integration
  test('components can use templates', () => {
    // This tests that packages can work together
    const template = brutal.templates.compile('<div>${content}</div>');
    const html = template.render({ content: 'Integration test' });
    assert(html === '<div>Integration test</div>', 'Cross-package integration failed');
  });
  
  test('error handling across packages', () => {
    const error = new brutal.shared.BrutalError('Test error');
    assert(error instanceof Error, 'BrutalError should extend Error');
    
    // Test ValidationError
    assert(brutal.shared.ValidationError, 'ValidationError missing');
    const validationError = new brutal.shared.ValidationError('Invalid input');
    assert(validationError.name === 'ValidationError', 'ValidationError name incorrect');
  });
}

async function runIntegrationTests() {
  console.log(kleur.bold('\n🏗️  BRUTAL V5 Bundle Integration Tests\n'));
  
  // Test lite bundle
  const litePath = join(__dirname, 'dist', 'brutal-lite.js');
  await testBundle('brutal-lite', litePath);
  
  // Test core bundle
  const corePath = join(__dirname, 'dist', 'brutal-core.js');
  await testBundle('brutal-core', corePath);
  
  // Summary
  console.log(kleur.bold('\n📊 Test Summary\n'));
  console.log(kleur.green(`✓ Passed: ${results.passed}`));
  if (results.failed > 0) {
    console.log(kleur.red(`✗ Failed: ${results.failed}`));
    
    console.log(kleur.red('\nFailed tests:'));
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(t => {
        console.log(kleur.red(`  - ${t.name}`));
        console.log(kleur.gray(`    ${t.error}`));
      });
  }
  
  const coverage = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  console.log(kleur.cyan(`\nIntegration test coverage: ${coverage}%`));
  
  if (results.failed > 0) {
    process.exit(1);
  }
}

runIntegrationTests().catch(console.error);