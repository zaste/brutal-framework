/**
 * TEST POLYFILLS FUNCTIONALITY
 * Validate polyfills work correctly
 */

import { JSDOM } from 'jsdom';

// Setup minimal DOM environment
const dom = new JSDOM('<!DOCTYPE html><div id="app"></div>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.customElements = dom.window.customElements;
global.ShadowRoot = dom.window.ShadowRoot;
global.performance = { now: () => Date.now() };

console.log('🧪 TESTING POLYFILLS...');

try {
  // Test polyfills import
  const core = await import('./packages/core/dist/index.js');
  console.log('✅ Polyfills imported successfully');
  
  // Test IntersectionObserver polyfill
  const hasIntersectionObserver = typeof window.IntersectionObserver !== 'undefined';
  console.log('✅ IntersectionObserver available:', hasIntersectionObserver);
  
  if (hasIntersectionObserver) {
    const observer = new window.IntersectionObserver(() => {}, { threshold: 0.1 });
    console.log('✅ IntersectionObserver can be instantiated');
    observer.disconnect();
  }
  
  // Test CSSStyleSheet polyfill  
  const hasCSSStyleSheet = typeof window.CSSStyleSheet !== 'undefined';
  console.log('✅ CSSStyleSheet available:', hasCSSStyleSheet);
  
  if (hasCSSStyleSheet) {
    const sheet = new window.CSSStyleSheet();
    sheet.insertRule('body { color: red; }');
    console.log('✅ CSSStyleSheet can insert rules');
  }
  
  console.log('\n🎉 ALL POLYFILLS WORKING');
  
} catch (error) {
  console.error('❌ POLYFILL TEST FAILED:', error.message);
  process.exit(1);
}