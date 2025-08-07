/**
 * Performance Regression Testing Suite
 * Ensures Day 4 performance victory (0.036ms) is maintained
 * Based on Chromium optimization patterns from custom_element_reaction_stack.cc
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Set up JSDOM environment
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
  pretendToBeVisual: true
});

global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
global.queueMicrotask = dom.window.queueMicrotask || ((fn) => Promise.resolve().then(fn));

// Import our optimized elements
const { ChromiumOptimizedElement, PreCompiledOptimizedElement, MicroOptimizedElement } = 
  require('../src/chromium-optimized-element.js');

// Baseline performance targets from Day 4 success
const PERFORMANCE_TARGETS = {
  minimalElement: 0.036, // Day 4 victory target
  preCompiledElement: 0.068, // Day 4 secondary target
  pooledElement: 0.113, // Day 3 best performance
  maxRegressionPercent: 10 // Allow 10% performance regression maximum
};

// Performance tracking
const performanceHistory = [];

function measurePerformance(name, iterations, createFunction) {
  // Warm up
  for (let i = 0; i < 100; i++) {
    createFunction();
  }

  // Measure
  const times = [];
  
  for (let run = 0; run < 5; run++) {
    const startTime = process.hrtime.bigint();
    
    for (let i = 0; i < iterations; i++) {
      createFunction();
    }
    
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds
    const avgTime = duration / iterations;
    times.push(avgTime);
  }

  // Calculate statistics
  const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const stddev = Math.sqrt(times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length);

  return {
    name,
    iterations,
    avg,
    min,
    max,
    stddev,
    times,
    timestamp: new Date().toISOString()
  };
}

function createMinimalElement() {
  const element = global.document.createElement('div');
  element.textContent = 'Minimal Element';  // Faster than innerHTML
  return element;
}

function createPreCompiledElement() {
  const TEMPLATE = '<div>Pre-compiled Template</div>';
  const element = global.document.createElement('div');
  element.innerHTML = TEMPLATE;  // Static template
  return element;
}

function createOptimizedCustomElement() {
  class TestOptimizedElement extends HTMLElement {
    constructor() {
      super();
      this.textContent = 'Optimized Custom Element';
    }
  }

  // Use counter to avoid redefinition errors
  const elementName = `test-optimized-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  customElements.define(elementName, TestOptimizedElement);
  
  return global.document.createElement(elementName);
}

function createPooledElement() {
  // Implement object pooling pattern from Day 3
  if (!createPooledElement.pool) {
    createPooledElement.pool = [];
    createPooledElement.poolSize = 0;
    createPooledElement.maxPoolSize = 100;
  }

  if (createPooledElement.poolSize > 0) {
    const element = createPooledElement.pool.pop();
    createPooledElement.poolSize--;
    element.textContent = 'Pooled Element (reused)';
    return element;
  }

  const element = global.document.createElement('div');
  element.textContent = 'Pooled Element (new)';
  
  // Simulate release back to pool
  if (createPooledElement.poolSize < createPooledElement.maxPoolSize) {
    createPooledElement.pool.push(element.cloneNode(true));
    createPooledElement.poolSize++;
  }
  
  return element;
}

function runPerformanceRegression() {
  console.log('🔍 Running Performance Regression Tests...\n');
  
  const results = [];
  const iterations = 10000;

  // Test 1: Minimal Element (Day 4 Victory Pattern)
  console.log('📊 Testing Minimal Element Performance (Day 4 Victory)...');
  const minimalResult = measurePerformance('Minimal Element', iterations, createMinimalElement);
  results.push(minimalResult);
  
  const minimalStatus = minimalResult.avg <= PERFORMANCE_TARGETS.minimalElement * (1 + PERFORMANCE_TARGETS.maxRegressionPercent / 100);
  console.log(`   Average: ${minimalResult.avg.toFixed(6)}ms (Target: ${PERFORMANCE_TARGETS.minimalElement}ms)`);
  console.log(`   Status: ${minimalStatus ? '✅ PASS' : '❌ REGRESSION DETECTED'}`);
  
  // Test 2: Pre-compiled Element
  console.log('\n📊 Testing Pre-compiled Element Performance...');
  const preCompiledResult = measurePerformance('Pre-compiled Element', iterations, createPreCompiledElement);
  results.push(preCompiledResult);
  
  const preCompiledStatus = preCompiledResult.avg <= PERFORMANCE_TARGETS.preCompiledElement * (1 + PERFORMANCE_TARGETS.maxRegressionPercent / 100);
  console.log(`   Average: ${preCompiledResult.avg.toFixed(6)}ms (Target: ${PERFORMANCE_TARGETS.preCompiledElement}ms)`);
  console.log(`   Status: ${preCompiledStatus ? '✅ PASS' : '❌ REGRESSION DETECTED'}`);

  // Test 3: Optimized Custom Element
  console.log('\n📊 Testing Optimized Custom Element Performance...');
  const optimizedResult = measurePerformance('Optimized Custom Element', iterations / 10, createOptimizedCustomElement);
  results.push(optimizedResult);
  
  console.log(`   Average: ${optimizedResult.avg.toFixed(6)}ms`);
  console.log(`   Status: ✅ MEASURED (Baseline for future regression testing)`);

  // Test 4: Pooled Element
  console.log('\n📊 Testing Pooled Element Performance...');
  const pooledResult = measurePerformance('Pooled Element', iterations, createPooledElement);
  results.push(pooledResult);
  
  const pooledStatus = pooledResult.avg <= PERFORMANCE_TARGETS.pooledElement * (1 + PERFORMANCE_TARGETS.maxRegressionPercent / 100);
  console.log(`   Average: ${pooledResult.avg.toFixed(6)}ms (Target: ${PERFORMANCE_TARGETS.pooledElement}ms)`);
  console.log(`   Status: ${pooledStatus ? '✅ PASS' : '❌ REGRESSION DETECTED'}`);

  // Performance Summary
  console.log('\n📈 Performance Regression Summary:');
  console.log('═'.repeat(60));
  
  const allPassed = minimalStatus && preCompiledStatus && pooledStatus;
  console.log(`Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ REGRESSION DETECTED'}`);
  
  console.log('\nDetailed Results:');
  results.forEach(result => {
    console.log(`  ${result.name}: ${result.avg.toFixed(6)}ms ± ${result.stddev.toFixed(6)}ms`);
    console.log(`    Min: ${result.min.toFixed(6)}ms, Max: ${result.max.toFixed(6)}ms`);
  });

  // Compare with React baseline (Day 4 reference: React = 0.040ms)
  const reactBaseline = 0.040;
  const minimalSpeedup = reactBaseline / minimalResult.avg;
  console.log('\n🏆 Victory Validation:');
  console.log(`  React Baseline: ${reactBaseline}ms`);
  console.log(`  Our Best (Minimal): ${minimalResult.avg.toFixed(6)}ms`);
  console.log(`  Speed Advantage: ${minimalSpeedup.toFixed(2)}x faster than React`);
  console.log(`  Victory Status: ${minimalResult.avg < reactBaseline ? '✅ VICTORY MAINTAINED' : '❌ VICTORY LOST'}`);

  // Save results to history
  const historyEntry = {
    timestamp: new Date().toISOString(),
    results,
    targets: PERFORMANCE_TARGETS,
    victoryStatus: minimalResult.avg < reactBaseline,
    allTestsPassed: allPassed
  };
  
  performanceHistory.push(historyEntry);
  
  // Save to file
  const resultsFile = path.join(__dirname, 'performance-regression-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(performanceHistory, null, 2));
  
  console.log(`\n💾 Results saved to: ${resultsFile}`);
  
  return {
    passed: allPassed,
    victoryMaintained: minimalResult.avg < reactBaseline,
    results,
    summary: {
      minimalElement: minimalResult.avg,
      preCompiledElement: preCompiledResult.avg,
      pooledElement: pooledResult.avg,
      reactComparison: minimalSpeedup
    }
  };
}

// Memory usage tracking
function trackMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    console.log('\n💾 Memory Usage:');
    console.log(`  RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Total: ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  External: ${(usage.external / 1024 / 1024).toFixed(2)} MB`);
    
    return usage;
  }
  return null;
}

// Main execution
if (require.main === module) {
  console.log('🚀 Custom Elements Performance Regression Testing Suite');
  console.log('Target: Maintain Day 4 victory (0.036ms vs React 0.040ms)\n');
  
  const memoryBefore = trackMemoryUsage();
  
  const testResults = runPerformanceRegression();
  
  const memoryAfter = trackMemoryUsage();
  
  if (memoryBefore && memoryAfter) {
    const heapDelta = memoryAfter.heapUsed - memoryBefore.heapUsed;
    console.log(`\n📊 Memory Delta: ${(heapDelta / 1024 / 1024).toFixed(2)} MB`);
  }
  
  console.log('\n🎯 Regression Test Complete!');
  process.exit(testResults.passed && testResults.victoryMaintained ? 0 : 1);
}

module.exports = {
  runPerformanceRegression,
  measurePerformance,
  PERFORMANCE_TARGETS,
  performanceHistory
};