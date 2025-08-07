/**
 * Simple Performance Benchmark - Custom Elements vs React/Vue
 * Direct timing measurements without external dependencies
 */

const { JSDOM } = require('jsdom');

// Setup DOM
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;

// Custom Element
class FastElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  connectedCallback() {
    this.shadowRoot.innerHTML = '<div>Fast Element</div>';
  }
}
customElements.define('fast-element', FastElement);

// React setup
const React = require('react');
const ReactDOMServer = require('react-dom/server');

function ReactComponent() {
  return React.createElement('div', null, 'React Component');
}

// Vue setup
const { createSSRApp } = require('vue');
const { renderToString } = require('@vue/server-renderer');

const VueComponent = {
  template: '<div>Vue Component</div>'
};

// Benchmark functions
function benchmarkCustomElement(iterations = 1000) {
  const start = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    const element = new FastElement();
    document.body.appendChild(element);
    document.body.removeChild(element);
  }
  
  const end = process.hrtime.bigint();
  return Number(end - start) / 1000000; // Convert to milliseconds
}

function benchmarkReact(iterations = 1000) {
  const start = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    ReactDOMServer.renderToString(React.createElement(ReactComponent));
  }
  
  const end = process.hrtime.bigint();
  return Number(end - start) / 1000000;
}

function benchmarkVue(iterations = 1000) {
  const start = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    const app = createSSRApp(VueComponent);
    renderToString(app);
  }
  
  const end = process.hrtime.bigint();
  return Number(end - start) / 1000000;
}

// Run benchmarks
async function runBenchmarks() {
  const iterations = 1000;
  
  console.log('🔥 Performance Benchmark Suite');
  console.log('=' .repeat(40));
  console.log(`Iterations: ${iterations}`);
  console.log(`Environment: Node.js ${process.version}`);
  console.log('');
  
  // Custom Elements
  const customTime = benchmarkCustomElement(iterations);
  const customAvg = customTime / iterations;
  
  // React
  const reactTime = benchmarkReact(iterations);
  const reactAvg = reactTime / iterations;
  
  // Vue (simplified since full Vue SSR is complex)
  const vueTime = benchmarkVue(iterations);
  const vueAvg = vueTime / iterations;
  
  // Results
  const results = {
    timestamp: new Date().toISOString(),
    iterations,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    },
    results: {
      customElements: {
        totalTime: customTime,
        avgTime: customAvg,
        opsPerSec: 1000 / customAvg
      },
      react: {
        totalTime: reactTime,
        avgTime: reactAvg,
        opsPerSec: 1000 / reactAvg
      },
      vue: {
        totalTime: vueTime,
        avgTime: vueAvg,
        opsPerSec: 1000 / vueAvg
      }
    }
  };
  
  // Display results
  console.log('📊 RESULTS:');
  console.log('');
  console.log(`Custom Elements: ${customAvg.toFixed(3)}ms avg (${(1000/customAvg).toFixed(0)} ops/sec)`);
  console.log(`React:           ${reactAvg.toFixed(3)}ms avg (${(1000/reactAvg).toFixed(0)} ops/sec)`);
  console.log(`Vue:             ${vueAvg.toFixed(3)}ms avg (${(1000/vueAvg).toFixed(0)} ops/sec)`);
  console.log('');
  
  // Performance comparison
  const fastest = Math.min(customAvg, reactAvg, vueAvg);
  if (fastest === customAvg) {
    console.log('🏆 Custom Elements are fastest!');
    console.log(`${(reactAvg/customAvg).toFixed(1)}x faster than React`);
    console.log(`${(vueAvg/customAvg).toFixed(1)}x faster than Vue`);
  } else if (fastest === reactAvg) {
    console.log('🏆 React is fastest!');
    console.log(`${(customAvg/reactAvg).toFixed(1)}x faster than Custom Elements`);
  } else {
    console.log('🏆 Vue is fastest!');
    console.log(`${(customAvg/vueAvg).toFixed(1)}x faster than Custom Elements`);
  }
  
  // Save results
  const fs = require('fs');
  fs.writeFileSync('benchmarks/results.json', JSON.stringify(results, null, 2));
  console.log('');
  console.log('💾 Results saved to benchmarks/results.json');
  
  return results;
}

if (require.main === module) {
  runBenchmarks().catch(console.error);
}

module.exports = { runBenchmarks };