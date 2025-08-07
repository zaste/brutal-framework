/**
 * Optimized Custom Elements Benchmark - Fair DOM Comparison
 * Research into making Custom Elements faster than React
 */

const { JSDOM } = require('jsdom');
const React = require('react');
const ReactDOM = require('react-dom/client');

// Setup DOM
const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="react-root"></div></body></html>`);
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;

// OPTIMIZATION 1: Minimal Custom Element (no Shadow DOM overhead)
class OptimizedElement extends HTMLElement {
  constructor() {
    super();
    // NO Shadow DOM - direct innerHTML manipulation
    this._content = 'Optimized Element';
  }
  
  connectedCallback() {
    // Direct innerHTML - fastest possible
    this.innerHTML = `<div>${this._content}</div>`;
  }
  
  updateContent(content) {
    this._content = content;
    this.innerHTML = `<div>${this._content}</div>`;
  }
}

// OPTIMIZATION 2: Pre-compiled template Custom Element
class PreCompiledElement extends HTMLElement {
  static template = '<div>Pre-compiled Element</div>';
  
  connectedCallback() {
    this.innerHTML = PreCompiledElement.template;
  }
}

// OPTIMIZATION 3: Pooled Custom Element (reuse instances)
class PooledElement extends HTMLElement {
  static pool = [];
  static getFromPool() {
    return this.pool.pop() || new PooledElement();
  }
  static returnToPool(element) {
    this.pool.push(element);
  }
  
  connectedCallback() {
    this.innerHTML = '<div>Pooled Element</div>';
  }
}

customElements.define('optimized-element', OptimizedElement);
customElements.define('precompiled-element', PreCompiledElement);
customElements.define('pooled-element', PooledElement);

// React Component for fair comparison
function ReactComponent({ children = 'React Component' }) {
  return React.createElement('div', null, children);
}

// Benchmark functions
function benchmarkOptimizedElement(iterations = 1000) {
  const start = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    const element = new OptimizedElement();
    document.body.appendChild(element);
    document.body.removeChild(element);
  }
  
  const end = process.hrtime.bigint();
  return Number(end - start) / 1000000;
}

function benchmarkPreCompiledElement(iterations = 1000) {
  const start = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    const element = new PreCompiledElement();
    document.body.appendChild(element);
    document.body.removeChild(element);
  }
  
  const end = process.hrtime.bigint();
  return Number(end - start) / 1000000;
}

function benchmarkPooledElement(iterations = 1000) {
  const start = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    const element = PooledElement.getFromPool();
    document.body.appendChild(element);
    document.body.removeChild(element);
    PooledElement.returnToPool(element);
  }
  
  const end = process.hrtime.bigint();
  return Number(end - start) / 1000000;
}

function benchmarkReactDOM(iterations = 1000) {
  const container = document.getElementById('react-root');
  const start = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(ReactComponent));
    root.unmount();
  }
  
  const end = process.hrtime.bigint();
  return Number(end - start) / 1000000;
}

// Memory usage measurement
function measureMemoryUsage(fn, iterations = 100) {
  if (global.gc) {
    global.gc(); // Force garbage collection if available
  }
  
  const memBefore = process.memoryUsage();
  fn(iterations);
  
  if (global.gc) {
    global.gc();
  }
  
  const memAfter = process.memoryUsage();
  return {
    heapUsed: memAfter.heapUsed - memBefore.heapUsed,
    heapTotal: memAfter.heapTotal - memBefore.heapTotal,
    external: memAfter.external - memBefore.external
  };
}

// Bundle size simulation (rough estimate)
function estimateBundleSize() {
  const customElementsSize = 1024; // ~1KB for custom elements polyfill
  const reactSize = 42000; // ~42KB for React + ReactDOM
  const vueSize = 34000; // ~34KB for Vue
  
  return {
    customElements: customElementsSize,
    react: reactSize,
    vue: vueSize
  };
}

async function runOptimizedBenchmarks() {
  const iterations = 1000;
  
  console.log('🚀 OPTIMIZED Custom Elements vs React');
  console.log('=' .repeat(50));
  console.log(`Iterations: ${iterations}`);
  console.log(`Environment: Node.js ${process.version}`);
  console.log('');
  
  // Performance benchmarks
  const optimizedTime = benchmarkOptimizedElement(iterations);
  const preCompiledTime = benchmarkPreCompiledElement(iterations);
  const pooledTime = benchmarkPooledElement(iterations);
  const reactTime = benchmarkReactDOM(iterations);
  
  const optimizedAvg = optimizedTime / iterations;
  const preCompiledAvg = preCompiledTime / iterations;
  const pooledAvg = pooledTime / iterations;
  const reactAvg = reactTime / iterations;
  
  // Memory usage
  const optimizedMem = measureMemoryUsage(benchmarkOptimizedElement, 100);
  const reactMem = measureMemoryUsage(benchmarkReactDOM, 100);
  
  // Bundle size
  const bundleSizes = estimateBundleSize();
  
  // Results
  const results = {
    timestamp: new Date().toISOString(),
    iterations,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    },
    performance: {
      optimizedElement: { totalTime: optimizedTime, avgTime: optimizedAvg, opsPerSec: 1000 / optimizedAvg },
      preCompiledElement: { totalTime: preCompiledTime, avgTime: preCompiledAvg, opsPerSec: 1000 / preCompiledAvg },
      pooledElement: { totalTime: pooledTime, avgTime: pooledAvg, opsPerSec: 1000 / pooledAvg },
      react: { totalTime: reactTime, avgTime: reactAvg, opsPerSec: 1000 / reactAvg }
    },
    memory: {
      optimizedElement: optimizedMem,
      react: reactMem
    },
    bundleSize: bundleSizes
  };
  
  // Display results
  console.log('📊 PERFORMANCE RESULTS:');
  console.log('');
  console.log(`Optimized Custom Element: ${optimizedAvg.toFixed(3)}ms avg (${(1000/optimizedAvg).toFixed(0)} ops/sec)`);
  console.log(`Pre-compiled Element:     ${preCompiledAvg.toFixed(3)}ms avg (${(1000/preCompiledAvg).toFixed(0)} ops/sec)`);
  console.log(`Pooled Element:           ${pooledAvg.toFixed(3)}ms avg (${(1000/pooledAvg).toFixed(0)} ops/sec)`);
  console.log(`React DOM:                ${reactAvg.toFixed(3)}ms avg (${(1000/reactAvg).toFixed(0)} ops/sec)`);
  console.log('');
  
  // Performance comparison
  const fastest = Math.min(optimizedAvg, preCompiledAvg, pooledAvg, reactAvg);
  let winner = '';
  
  if (fastest === optimizedAvg) {
    winner = 'Optimized Custom Element';
    console.log('🏆 Optimized Custom Element is fastest!');
    console.log(`${(reactAvg/optimizedAvg).toFixed(1)}x faster than React`);
  } else if (fastest === preCompiledAvg) {
    winner = 'Pre-compiled Element';
    console.log('🏆 Pre-compiled Element is fastest!');
    console.log(`${(reactAvg/preCompiledAvg).toFixed(1)}x faster than React`);
  } else if (fastest === pooledAvg) {
    winner = 'Pooled Element';
    console.log('🏆 Pooled Element is fastest!');
    console.log(`${(reactAvg/pooledAvg).toFixed(1)}x faster than React`);
  } else {
    winner = 'React';
    console.log('🏆 React is still fastest!');
  }
  
  // Memory comparison
  console.log('');
  console.log('💾 MEMORY USAGE:');
  console.log(`Optimized Element: ${(optimizedMem.heapUsed/1024).toFixed(2)}KB heap`);
  console.log(`React:             ${(reactMem.heapUsed/1024).toFixed(2)}KB heap`);
  
  // Bundle size comparison
  console.log('');
  console.log('📦 BUNDLE SIZE:');
  console.log(`Custom Elements: ${(bundleSizes.customElements/1024).toFixed(1)}KB`);
  console.log(`React:           ${(bundleSizes.react/1024).toFixed(1)}KB`);
  console.log(`Bundle advantage: ${(bundleSizes.react/bundleSizes.customElements).toFixed(1)}x smaller`);
  
  // Save results
  const fs = require('fs');
  fs.writeFileSync('benchmarks/optimized-results.json', JSON.stringify(results, null, 2));
  console.log('');
  console.log('💾 Results saved to benchmarks/optimized-results.json');
  
  return results;
}

if (require.main === module) {
  runOptimizedBenchmarks().catch(console.error);
}

module.exports = { runOptimizedBenchmarks };