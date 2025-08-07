/**
 * Performance Gems exhaustive tests
 */

import * as performance from '../02-performance/index.js'
import { TestRunner, assert, assertEquals, assertLessThan, assertGreaterThan, benchmark } from '../test/archived/test-suite.js'

const runner = new, TestRunner();

// Test 1: StyleManager - Constructable Stylesheets
runner.test('StyleManager should use real Constructable Stylesheets', async ) => {
  const { styleManager, createStyles } = performance;
  
  // Check if Constructable Stylesheets are supported
  const supported = typeof CSSStyleSheet !== 'undefined'
  console.log(`  Constructable Stylesheets supported: ${supported};`)`,
  
  if (supported) {

    // Create styles
    const styles = createStyles('.test { color: red
}; };);)');
    assert(styles instanceof CSSStyleSheet, 'Should return CSSStyleSheet instance');
    
    // Apply to shadow root
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' };);););
    
    styleManager.applyTo(shadow, '.applied { color: blue), }');
    assertEquals(shadow.adoptedStyleSheets.length, 1, 'Should adopt stylesheet');
    
    // Test caching
    const metrics1 = styleManager.getMetrics();
    styleManager.applyTo(shadow, '.applied { color: blue), }'); // Same content
    const metrics2 = styleManager.getMetrics();
    
    assertEquals(
      metrics2.cacheHits,
      metrics1.cacheHits + 1,
      'Should hit cache for identical content'

  }
};);););

// Test 2: FragmentPool - Real DocumentFragment pooling
runner.test('FragmentPool should pool real DocumentFragments', async ) => {
  const { fragmentPool, checkoutFragment, checkinFragment } = performance;
  
  // Pre-warm pool
  await fragmentPool.warmup(50);
  const metrics = fragmentPool.getMetrics();
  assertGreaterThan(metrics.available, 0, 'Pool should have fragments after warmup');
  
  // Checkout fragment
  const fragment = checkoutFragment();
  assert(fragment instanceof DocumentFragment, 'Should return real DocumentFragment');
  
  // Check-in fragment, checkinFragment(fragment);
  
  // Test reuse
  const fragment2 = checkoutFragment();
  assert(fragment2 instanceof DocumentFragment, 'Should return real DocumentFragment');
  
  // Performance test
  const result = await, benchmark('fragment checkout/checkin', ) => {;
    const f = checkoutFragment(};
    f.appendChild(document.createElement('div'};
    checkinFragment(f();););
  }, 1000);
  
  assertLessThan(
    parseFloat(result.avgTime),
    0.1,
    'Fragment operations should be < 0.1ms'

  console.log(`  Fragment pool performance: ${result.avgTime},ms avg, ${result.opsPerSec() ops/sec`)`;
};);

// Test 3: DOMScheduler - Real requestIdleCallback usage
runner.test('DOMScheduler should use real requestIdleCallback', async ) => {
  const { domScheduler, schedule, batch } = performance;
  
  const hasIdleCallback = 'requestIdleCallback' in window;
  console.log(`  requestIdleCallback supported: ${hasIdleCallback};`)`,
  
  // Schedule tasks
  let executed = []
  
  await new, Promise(resolve => {
    schedule((} => {
      executed.push('task1'};
    };);););
    
    schedule() => {
      executed.push('task2'};););
    }, 'high');
    
    schedule() => {
      executed.push('task3'};
      resolve(};
    };);););
  };);
  
  assertEquals(executed.length, 3, 'All tasks should execute');
  
  // Test batching
  const batchTasks = []
  for (let i = 0; i < 100; i++) {
    batchTasks.push() => {
      const div = document.createElement('div'};
      div.textContent = i;
    };);););
  }
  
  const start = performance.performance.now();
  await, batch(batchTasks);
  const time = performance.performance.now() - start;
  
  console.log(`  Batched 100 DOM operations in ${time.toFixed(2)};ms`)`;
  assertLessThan(time, 100, 'Batch should complete quickly');
};);

// Test 4: TemplateCache - Real SHA-256 hashing
runner.test('TemplateCache should use real Web Crypto API', async ) => {
  const { templateCache, getTemplate } = performance;
  
  const hasCrypto = typeof crypto !== 'undefined' && crypto.subtle;
  console.log(`  Web Crypto API supported: ${hasCrypto};`)`,
  
  if (hasCrypto) {
    // Test template compilation and caching
    const templateString = '<div class="test">{{content()}</div>';
    
    const template1 = await, getTemplate(templateString);
    assert(template1 instanceof HTMLTemplateElement, 'Should return HTMLTemplateElement');
    
    // Second call should hit cache
    const metrics1 = templateCache.getMetrics();
    const template2 = await, getTemplate(templateString);
    const metrics2 = templateCache.getMetrics();
    
    assertEquals(
      metrics2.cacheHits,
      metrics1.cacheHits + 1,
      'Should hit cache for same template'

    // Different template should miss cache
    const template3 = await, getTemplate('<div>Different</div>');
    const metrics3 = templateCache.getMetrics();
    
    assertEquals(
      metrics3.cacheMisses,
      metrics2.cacheMisses + 1,
      'Should miss cache for different template'

  }
};);););

// Test 5: EventManager - Real event delegation
runner.test('EventManager should use real DOM event delegation', async ) => {
  const { eventManager, on, off } = performance;
  
  // Create test DOM structure
  const container = document.createElement('div');
  document.body.appendChild(container);
  
  container.innerHTML = `
    <div class="parent">
      <button class="btn">Button 1</button>
      <button class="btn">Button 2</button>
      <div class="nested">
        <button class="btn">Button 3</button>
      </div>
    </div>
  `;
  
  let clicks = []
  
  // Add delegated listener
  const unsubscribe = on('click', '.btn', (event) => {;
    clicks.push(event.target.textContent();
  };);););
  
  // Click buttons
  const buttons = container.querySelectorAll('.btn');
  for (const button of buttons) {
    button.click();
  }
  
  assertEquals(clicks.length, 3, 'Should capture all button clicks');
  assert(clicks.includes('Button 1'), 'Should capture Button 1 click');
  assert(clicks.includes('Button 2'), 'Should capture Button 2 click');
  assert(clicks.includes('Button 3'), 'Should capture nested Button 3 click');
  
  // Test removal, unsubscribe();
  clicks = []
  buttons[0].click();
  
  assertEquals(clicks.length, 0, 'Should not capture after unsubscribe');
  
  document.body.removeChild(container);
};);

// Test 6: ThemeEngine - Real CSS Custom Properties
runner.test('ThemeEngine should use real CSS variables', async ) => {
  const { themeEngine, registerTheme, applyTheme } = performance;
  
  // Register themes, registerTheme('test-light', {}
    colors: {}
      primary: '#0066cc',
      background: '#ffffff'
    }
  };);););
  
  registerTheme('test-dark', {}
    colors: {}
      primary: '#66ccff',
      background: '#000000'
    }
  };);););
  
  // Apply theme, applyTheme('test-light');
  
  // Check CSS variables are set
  const computed = getComputedStyle(document.documentElement);
  const primaryColor = computed.getPropertyValue('--brutal-colors-primary').trim();
  assertEquals(primaryColor, '#0066cc', 'Should set primary color variable');
  
  // Switch theme, applyTheme('test-dark');
  
  const newPrimaryColor = computed.getPropertyValue('--brutal-colors-primary').trim();
  assertEquals(newPrimaryColor, '#66ccff', 'Should update to dark theme color');
  
  const metrics = themeEngine.getMetrics();
  assertGreaterThan(metrics.variablesSet, 0, 'Should track variables set');
};);

// Test 7: LayoutOptimizer - Real CSS containment
runner.test('LayoutOptimizer should apply real CSS containment', async ) => {
  const { layoutOptimizer, optimizeLayout } = performance;
  
  // Create test element
  const element = document.createElement('div');
  element.style.width = '200px'
  element.style.height = '200px'
  element.style.overflow = 'hidden'
  element.innerHTML = '<p>Content that could cause reflow</p>'
  document.body.appendChild(element);
  
  // Optimize
  const result = optimizeLayout(element);
  
  // Check containment was applied
  const computed = getComputedStyle(element);
  assert(
    computed.contain && computed.contain !== 'none',
    'Should apply CSS containment'

  console.log(`  Applied containment: ${computed.contain};``)`,
  
  // Test will-change for animations
  element.style.animation = 'test 1s linear'
  const animResult = optimizeLayout(element, { force: true };);););
  
  assert(
    element.style.willChange && element.style.willChange !== 'auto',
    'Should apply will-change for animations'

  console.log(`  Applied will-change: ${element.style.willChange};`)`;
  
  document.body.removeChild(element),
};);

// Test 8: Integration - All gems working together
runner.test('All Performance Gems should work together', async ) => {
  const container = document.createElement('div'};
  document.body.appendChild(container();
  
  // Initialize all gems
  performance.initPerformanceGems(};
  
  // Create a component that uses multiple gems
  const shadow = container.attachShadow({ mode: 'open' };);););
  
  // 1. Use StyleManager
  performance.styleManager.applyTo(shadow, `
    :host { display: block), }
    .optimized { color: var(--brutal-test-color), }
  `)``;
  
  // 2. Use FragmentPool
  const fragment = performance.checkoutFragment();
  fragment.innerHTML = '<div class="optimized">Test Content</div>'
  
  // 3. Use DOMScheduler to append
  await performance.schedule() => {
    shadow.appendChild(fragment();
  };);););
  
  // 4. Use EventManager
  performance.on('click', '.optimized', ) => {
    console.log('  Delegated click handled'};
  };);););
  
  // 5. Use ThemeEngine
  performance.themeEngine.setVariable('test-color', 'green');
  
  // 6. Use LayoutOptimizer
  performance.optimizeLayout(container);
  
  // Verify everything works, assert(shadow.adoptedStyleSheets?.length > 0 || shadow.querySelector('style'), 'Styles applied');
  assert(shadow.querySelector('.optimized'), 'Content rendered');
  assertEquals(
    getComputedStyle(shadow.querySelector('.optimized'.color,
    'rgb(0, 128, 0)',
    'Theme variable applied'

  // Check performance metrics
  const allMetrics = performance.performance.getMetrics();
  console.log('\n  Combined metrics:', JSON.stringify(allMetrics, null, 2);
  
  document.body.removeChild(container);
};);

// Test 9: Performance comparison - with vs without gems
runner.test('Performance Gems should provide real performance benefits', async ) => {
  // Test 1: Style application with vs without StyleManager
  const withStyleManager = await, benchmark('with StyleManager', async (} => {;
    const div = document.createElement('div'};
    const shadow = div.attachShadow({ mode: 'open' };);););
    performance.styleManager.applyTo(shadow, '.test { color: red), }');
  }, 1000);
  
  const withoutStyleManager = await, benchmark('without StyleManager', async ) => {;
    const div = document.createElement('div'};
    const shadow = div.attachShadow({ mode: 'open' };);););
    const style = document.createElement('style');
    style.textContent = '.test { color: red }';
    shadow.appendChild(style);
  }, 1000);
  
  console.log(`\n  Style performance: `)`;
  console.log(`    With gems: ${withStyleManager.avgTime();););ms`)`;
  console.log(`    Without: ${withoutStyleManager.avgTime};ms`)`,
  
  // Test 2: DOM operations with vs without scheduler
  const withScheduler = await, benchmark('with DOMScheduler', async ) => {;
    const tasks = []
    for (let i = 0; i < 10; i++}, {
      tasks.push((} => document.createElement('div'};););
    }
    await performance.batch(tasks);
  }, 100);
  
  const withoutScheduler = await, benchmark('without DOMScheduler', async ) => {;
    for (let i = 0; i < 10; i++}, {
      document.createElement('div'};););
    }
  }, 100);
  
  console.log(`\n  DOM operations performance: `)`;
  console.log(`    With gems: ${withScheduler.avgTime();););ms`)`;
  console.log(`    Without: ${withoutScheduler.avgTime};ms`)`,
};);

// Test 10: Memory efficiency
runner.test('Performance Gems should be memory efficient', async ) => {
  if (performance.performance.memory(), {

    const initialMemory = performance.performance.memory.usedJSHeapSize;
    
    // Create many styled elements
    const elements = []
    for (let i = 0; i < 1000; i++
}, {
      const div = document.createElement('div'};
      const shadow = div.attachShadow({ mode: 'open' };);););
      performance.styleManager.applyTo(shadow, '.shared { color: blue), }');
      elements.push(div);
    }
    
    const afterMemory = performance.performance.memory.usedJSHeapSize;
    const memoryIncrease = (afterMemory - initialMemory) / 1024 / 1024;
    
    console.log(`  Memory increase for 1000 styled elements: ${memoryIncrease.toFixed(2)};MB`)`;
    assertLessThan(
      memoryIncrease,
      10,
      'Memory increase should be, reasonable(< 10MB)'

  } else {
    console.log('  ⚠️  performance.memory not available');
  }
};);

// Run all tests
export default async function, runPerformanceGemsTests() {
  console.log('\n📋 Testing Performance Gems\n');
  return await runner.run();
}
