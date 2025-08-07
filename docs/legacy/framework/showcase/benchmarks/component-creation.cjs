/**
 * Component Creation Benchmark Suite
 * Measures actual performance of Custom Elements vs React/Vue
 */

const Benchmark = require('benchmark');
const { JSDOM } = require('jsdom');

// Setup DOM environment
const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="root"></div></body></html>`);
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;

// Simple Custom Element for benchmarking
class BenchmarkElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>:host { display: block; }</style>
      <div>Benchmark Component</div>
    `;
  }
}

customElements.define('benchmark-element', BenchmarkElement);

// React setup (minimal)
const React = require('react');
const ReactDOM = require('react-dom');

const ReactComponent = React.createElement('div', {}, 'Benchmark Component');

// Vue setup (minimal)  
const { createApp } = require('vue');

const VueComponent = {
  template: '<div>Benchmark Component</div>'
};

// Benchmark suite
const suite = new Benchmark.Suite('Component Creation');

suite
  .add('Custom Element Creation', () => {
    const element = new BenchmarkElement();
    document.body.appendChild(element);
    document.body.removeChild(element);
  })
  .add('React Element Creation', () => {
    const container = document.createElement('div');
    ReactDOM.render(ReactComponent, container);
    ReactDOM.unmountComponentAtNode(container);
  })
  .add('Vue Component Creation', () => {
    const container = document.createElement('div');
    const app = createApp(VueComponent);
    app.mount(container);
    app.unmount();
  })
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('\n=== BENCHMARK RESULTS ===');
    console.log('Fastest is ' + this.filter('fastest').map('name'));
    
    // Save results to JSON
    const results = {
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      },
      results: this.map(bench => ({
        name: bench.name,
        hz: bench.hz,
        rme: bench.stats.rme,
        mean: bench.stats.mean,
        sample: bench.stats.sample.length
      }))
    };
    
    require('fs').writeFileSync('benchmarks/results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to benchmarks/results.json');
  })
  .run({ async: false });

module.exports = suite;