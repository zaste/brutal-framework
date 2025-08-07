#!/usr/bin/env node
/**
 * Test BRUTAL bundles in Node.js environment
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import kleur from 'kleur';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Test results
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(kleur.green('✓'), name);
  } catch (error) {
    failed++;
    console.log(kleur.red('✗'), name);
    console.log(kleur.gray('  ' + error.message));
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function testLiteBundle() {
  console.log(kleur.bold('\n🧪 Testing brutal-lite bundle\n'));
  
  const bundle = await import('./dist/brutal-lite.js');
  
  test('exports foundation module', () => {
    assert(bundle.foundation, 'foundation missing');
    assert(bundle.foundation.registry, 'foundation.registry missing');
    assert(bundle.foundation.configLoader, 'foundation.configLoader missing');
    assert(bundle.foundation.polyfillStrategy, 'foundation.polyfillStrategy missing');
  });
  
  test('exports shared module', () => {
    assert(bundle.shared, 'shared missing');
    assert(bundle.shared.BrutalError, 'BrutalError missing');
    assert(bundle.shared.ValidationError, 'ValidationError missing');
    assert(bundle.shared.NetworkError, 'NetworkError missing');
  });
  
  test('exports templates module', () => {
    assert(bundle.templates, 'templates missing');
    assert(bundle.templates.compile, 'compile function missing');
    assert(bundle.templates.render, 'render function missing');
    assert(bundle.templates.html, 'html function missing');
    assert(bundle.templates.Template, 'Template class missing');
  });
  
  test('exports components module', () => {
    assert(bundle.components, 'components missing');
    // Note: BrutalComponent extends HTMLElement, which doesn't exist in Node
    // But the export should still be there
    assert(bundle.components.BrutalComponent, 'BrutalComponent missing');
  });
  
  // Functional tests
  test('template compilation works', () => {
    const template = bundle.templates.compile('Hello ${name}!');
    const result = template.render({ name: 'BRUTAL' });
    assert(result === 'Hello BRUTAL!', `Got: ${result}`);
  });
  
  test('HTML escaping works', () => {
    const template = bundle.templates.compile('${content}');
    const result = template.render({ content: '<script>alert("xss")</script>' });
    assert(result.includes('&lt;script&gt;'), 'HTML not escaped');
  });
  
  test('error classes work', () => {
    const error = new bundle.shared.BrutalError('Test error', 'TEST_CODE');
    assert(error.message === 'Test error', 'Error message wrong');
    assert(error.code === 'TEST_CODE', 'Error code wrong');
    assert(error.name === 'BrutalError', 'Error name wrong');
  });
  
  test('sanitization functions work', () => {
    const html = bundle.shared.sanitizeHTML('<div>test</div>');
    assert(html === '&lt;div&gt;test&lt;/div&gt;', 'HTML sanitization failed');
    
    const input = bundle.shared.sanitizeInput('  test  ');
    assert(input === 'test', 'Input sanitization failed');
  });
}

async function testCoreBundle() {
  console.log(kleur.bold('\n🧪 Testing brutal-core bundle\n'));
  
  const bundle = await import('./dist/brutal-core.js');
  
  // Test all 11 modules are exported
  const modules = [
    'foundation', 'shared', 'events', 'templates', 
    'cache', 'components', 'state', 'routing', 
    'scheduling', 'a11y', 'plugins'
  ];
  
  modules.forEach(mod => {
    test(`exports ${mod} module`, () => {
      assert(bundle[mod], `${mod} missing`);
    });
  });
  
  // Test events functionality
  test('EventEmitter works', () => {
    assert(bundle.events.EventEmitter, 'EventEmitter missing');
    const emitter = new bundle.events.EventEmitter();
    
    let received = null;
    emitter.on('test', (data) => { received = data; });
    emitter.emit('test', { value: 42 });
    
    assert(received?.value === 42, 'Event not received');
  });
  
  test('EventEmitter removes listeners', () => {
    const emitter = new bundle.events.EventEmitter();
    let count = 0;
    const handler = () => count++;
    
    emitter.on('test', handler);
    emitter.emit('test');
    assert(count === 1, 'Handler not called');
    
    emitter.off('test', handler);
    emitter.emit('test');
    assert(count === 1, 'Handler still called after removal');
  });
  
  // Test state management
  test('createStore works', () => {
    assert(bundle.state.createStore, 'createStore missing');
    
    const store = bundle.state.createStore({ count: 0 });
    
    assert(store.getState().count === 0, 'Initial state wrong');
    
    store.setState({ count: 1 });
    assert(store.getState().count === 1, 'setState failed');
    
    store.setState({ count: 0 });
    assert(store.getState().count === 0, 'setState failed');
  });
  
  test('store subscriptions work', () => {
    const store = bundle.state.createStore({ value: 0 });
    
    let notified = false;
    let lastState = null;
    
    const unsubscribe = store.subscribe((state) => { 
      notified = true;
      lastState = state;
    });
    
    store.setState({ value: 42 });
    assert(notified, 'Subscriber not notified');
    assert(lastState?.value === 42, 'State not passed to subscriber');
    assert(store.getState().value === 42, 'State not updated');
    
    // Test unsubscribe
    notified = false;
    unsubscribe();
    store.setState({ value: 100 });
    assert(!notified, 'Subscriber still notified after unsubscribe');
  });
  
  // Test cache
  test('MemoryCache works', () => {
    assert(bundle.cache.MemoryCache, 'MemoryCache missing');
    const cache = new bundle.cache.MemoryCache();
    
    cache.set('key', 'value');
    assert(cache.get('key') === 'value', 'Cache get failed');
    assert(cache.has('key'), 'Cache has failed');
    assert(cache.size === 1, 'Cache size wrong');
    
    cache.delete('key');
    assert(!cache.has('key'), 'Cache delete failed');
  });
  
  test('cache with TTL works', async () => {
    const cache = new bundle.cache.MemoryCache({ ttl: 100 });
    
    cache.set('temp', 'value');
    assert(cache.get('temp') === 'value', 'Initial get failed');
    
    await new Promise(resolve => setTimeout(resolve, 150));
    assert(cache.get('temp') === undefined, 'TTL expiry failed');
  });
  
  // Test routing
  test('Router works', () => {
    assert(bundle.routing.Router, 'Router missing');
    assert(bundle.routing.Route, 'Route missing');
    
    const route = new bundle.routing.Route({ path: '/users/:id' });
    assert(route.matches('/users/123'), 'Route matching failed');
    
    const params = route.extractParams('/users/123');
    assert(params.id === '123', 'Param extraction failed');
  });
  
  test('navigation functions exist', () => {
    assert(typeof bundle.routing.navigate === 'function', 'navigate missing');
    assert(typeof bundle.routing.back === 'function', 'back missing');
    assert(typeof bundle.routing.forward === 'function', 'forward missing');
  });
}

async function verifyIntegration() {
  console.log(kleur.bold('\n🔗 Testing Cross-Package Integration\n'));
  
  const lite = await import('./dist/brutal-lite.js');
  const core = await import('./dist/brutal-core.js');
  
  test('lite bundle is subset of core', () => {
    // All lite exports should exist in core
    ['foundation', 'shared', 'templates', 'components'].forEach(mod => {
      assert(core[mod], `${mod} missing in core`);
    });
  });
  
  test('template + events integration', () => {
    const template = core.templates.compile('Event: ${type}');
    const emitter = new core.events.EventEmitter();
    
    let rendered = '';
    emitter.on('render', (data) => {
      rendered = template.render(data);
    });
    
    emitter.emit('render', { type: 'test-event' });
    assert(rendered === 'Event: test-event', 'Integration failed');
  });
  
  test('state + cache integration', () => {
    const store = core.state.createStore({ data: null });
    const cache = new core.cache.MemoryCache();
    
    // Subscribe to store and cache data
    store.subscribe((state) => {
      if (state.data) {
        cache.set('latest', state.data);
      }
    });
    
    store.setState({ data: { value: 42 } });
    assert(cache.get('latest')?.value === 42, 'State-cache sync failed');
    
    // Test update
    store.setState({ data: { value: 100 } });
    assert(cache.get('latest')?.value === 100, 'Cache not updated');
  });
}

async function checkPackageCompleteness() {
  console.log(kleur.bold('\n📋 Checking Package Completeness\n'));
  
  const core = await import('./dist/brutal-core.js');
  
  // Check each package has expected exports based on their index.ts
  const packageChecks = {
    foundation: ['registry', 'configLoader', 'polyfillStrategy', 'envProfiles'],
    shared: ['BrutalError', 'ValidationError', 'NetworkError', 'sanitizeHTML', 'sanitizeInput'],
    events: ['EventEmitter'],
    templates: ['compile', 'render', 'Template', 'html'],
    cache: ['MemoryCache', 'StorageCache', 'createCache'],
    components: ['BrutalComponent'],
    state: ['createStore'],
    routing: ['Router', 'Route', 'navigate', 'back', 'forward'],
    scheduling: ['ExampleFeature'], // Placeholder
    a11y: ['ExampleFeature'], // Placeholder
    plugins: ['ExampleFeature'] // Placeholder
  };
  
  Object.entries(packageChecks).forEach(([pkg, expectedExports]) => {
    test(`${pkg} has expected exports`, () => {
      assert(core[pkg], `${pkg} module missing`);
      
      expectedExports.forEach(exp => {
        assert(core[pkg][exp] !== undefined, `${pkg}.${exp} missing`);
      });
    });
  });
}

async function main() {
  console.log(kleur.bold('🏗️  BRUTAL V5 Bundle Tests\n'));
  
  await testLiteBundle();
  await testCoreBundle();
  await verifyIntegration();
  await checkPackageCompleteness();
  
  // Summary
  console.log(kleur.bold('\n📊 Summary\n'));
  console.log(kleur.green(`✓ Passed: ${passed}`));
  if (failed > 0) {
    console.log(kleur.red(`✗ Failed: ${failed}`));
  }
  
  const successRate = ((passed / (passed + failed)) * 100).toFixed(1);
  console.log(kleur.cyan(`Success rate: ${successRate}%`));
  
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(console.error);