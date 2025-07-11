/**
 * BRUTAL Framework V3 - Complete Test Runner
 * Runs all tests and generates comprehensive report
 */

import runComponentTests from './tests/01-test-component.js';
import runStateTests from './tests/02-test-state.js';
import runRouterTests from './tests/03-test-router.js';
import runPerformanceGemsTests from './tests/04-test-performance-gems.js';

async function runAllTests() {
  const startTime = performance.now();
  const results = {
    component: null,
    state: null,
    router: null,
    performanceGems: null,
    summary: {
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalTime: 0
    }
  };

  try {
    // Run Component tests
    results.component = await runComponentTests();
    
    // Run State tests
    results.state = await runStateTests();
    
    // Run Router tests
    results.router = await runRouterTests();
    
    // Run Performance Gems tests
    results.performanceGems = await runPerformanceGemsTests();
    
  } catch (error) {
    }

  // Calculate summary
  const modules = ['component', 'state', 'router', 'performanceGems'];
  for (const module of modules) {
    if (results[module]) {
      results.summary.totalTests += results[module].total;
      results.summary.totalPassed += results[module].passed;
      results.summary.totalFailed += results[module].failed;
    }
  }
  
  results.summary.totalTime = performance.now() - startTime;

  // Generate report
  generateReport(results);
  
  return results;
}

function generateReport(results) {
  .toFixed(1)}%
Total Time:     ${(results.summary.totalTime / 1000).toFixed(2)}s

📋 Module Breakdown:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // Component results
  if (results.component) {
    }

  // State results
  if (results.state) {
    }

  // Router results
  if (results.router) {
    }

  // Performance Gems results
  if (results.performanceGems) {
    }

  // Failed tests detail
  if (results.summary.totalFailed > 0) {
    for (const [module, result] of Object.entries(results)) {
      if (module === 'summary') continue;
      if (!result || !result.details) continue;
      
      const failed = result.details.filter(t => t.status === 'FAIL');
      if (failed.length > 0) {
        for (const test of failed) {
          }
      }
    }
  }

  // Performance warnings
  // Check for missing features
  const warnings = [];
  
  if (typeof SharedArrayBuffer === 'undefined' || !crossOriginIsolated) {
    warnings.push('- SharedArrayBuffer not available (need COOP/COEP headers)');
  }
  
  if (!('navigation' in window)) {
    warnings.push('- Navigation API not available (using History API fallback)');
  }
  
  if (typeof CSSStyleSheet === 'undefined' || !document.adoptedStyleSheets) {
    warnings.push('- Constructable Stylesheets not supported');
  }
  
  if (!('requestIdleCallback' in window)) {
    warnings.push('- requestIdleCallback not supported (using setTimeout fallback)');
  }

  if (warnings.length > 0) {
    warnings.forEach(w => );
  } else {
    }

  // Recommendations
  if (results.summary.totalFailed > 0) {
    }

  if (!crossOriginIsolated) {
    }

  if (results.summary.totalPassed === results.summary.totalTests) {
    }

  }

// Run tests if this is the main module (Node.js only)
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests };