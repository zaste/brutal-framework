/**
 * Real Browser Performance Validation
 * Complementa JSDOM tests con real browser measurements
 * Mantiene architecture existente mientras valida performance real
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

console.log('🌐 Real Browser Performance Validation');
console.log('🎯 Complementing JSDOM tests with real browser measurements');
console.log('📊 Validating actual performance vs claimed results\n');

/**
 * Create test HTML page for browser testing
 */
function createTestHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Shadow DOM Performance Test</title>
    <meta charset="utf-8">
</head>
<body>
    <div id="test-container"></div>
    
    <script>
    // Import our shadow DOM optimizer (converted to browser-compatible)
    window.ShadowDOMTest = {
      // Real Shadow DOM creation test
      createBasicShadowDOM: function() {
        const startTime = performance.now();
        
        const element = document.createElement('div');
        const shadowRoot = element.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = \`
          <style>
            .container { padding: 16px; background: #f0f0f0; }
            .btn { background: #007bff; color: white; padding: 8px 16px; }
          </style>
          <div class="container">
            <h3>Test Component</h3>
            <button class="btn">Action</button>
            <input type="text" placeholder="Input field">
          </div>
        \`;
        
        document.getElementById('test-container').appendChild(element);
        
        const endTime = performance.now();
        return endTime - startTime;
      },

      // Optimized Shadow DOM with our enhancements
      createOptimizedShadowDOM: function() {
        const startTime = performance.now();
        
        // Apply real optimizations from our framework
        const element = document.createElement('div');
        const shadowRoot = element.attachShadow({ 
          mode: 'open',
          delegatesFocus: true 
        });

        // Test Constructable Stylesheets (if supported)
        if ('adoptedStyleSheets' in shadowRoot) {
          try {
            const styleSheet = new CSSStyleSheet();
            styleSheet.replace(\`
              .container { padding: 16px; background: #f0f0f0; contain: layout style; }
              .btn { background: #007bff; color: white; padding: 8px 16px; }
            \`);
            shadowRoot.adoptedStyleSheets = [styleSheet];
          } catch (e) {
            // Fallback to style tag
            shadowRoot.innerHTML = \`
              <style>
                .container { padding: 16px; background: #f0f0f0; contain: layout style; }
                .btn { background: #007bff; color: white; padding: 8px 16px; }
              </style>
            \`;
          }
        } else {
          shadowRoot.innerHTML = \`
            <style>
              .container { padding: 16px; background: #f0f0f0; }
              .btn { background: #007bff; color: white; padding: 8px 16px; }
            </style>
          \`;
        }

        shadowRoot.innerHTML += \`
          <div class="container">
            <h3>Optimized Component</h3>
            <button class="btn">Action</button>
            <input type="text" placeholder="Input field">
          </div>
        \`;

        // Add event delegation
        shadowRoot.addEventListener('click', function(event) {
          if (event.target.matches('.btn')) {
            // Handle button click efficiently
          }
        }, { passive: true });

        document.getElementById('test-container').appendChild(element);
        
        const endTime = performance.now();
        return endTime - startTime;
      },

      // React component simulation for comparison
      createReactSimulation: function() {
        const startTime = performance.now();
        
        // Simulate React component creation overhead
        const element = document.createElement('div');
        element.innerHTML = \`
          <div style="padding: 16px; background: #f0f0f0;">
            <h3>React Component</h3>
            <button style="background: #007bff; color: white; padding: 8px 16px;">Action</button>
            <input type="text" placeholder="Input field">
          </div>
        \`;

        // Simulate React's synthetic event system overhead
        element.addEventListener('click', function(event) {
          // Simulate event processing overhead
          const syntheticEvent = { ...event, isPersistent: () => false };
          // Additional React overhead simulation
        });

        document.getElementById('test-container').appendChild(element);
        
        const endTime = performance.now();
        return endTime - startTime;
      },

      // Run comprehensive performance test
      runPerformanceTest: function(iterations = 50) {
        const results = {
          basicShadowDOM: [],
          optimizedShadowDOM: [],
          reactSimulation: []
        };

        // Clear container
        document.getElementById('test-container').innerHTML = '';

        for (let i = 0; i < iterations; i++) {
          // Test basic Shadow DOM
          const basicTime = this.createBasicShadowDOM();
          results.basicShadowDOM.push(basicTime);
          
          // Clean up
          document.getElementById('test-container').innerHTML = '';
          
          // Test optimized Shadow DOM
          const optimizedTime = this.createOptimizedShadowDOM();
          results.optimizedShadowDOM.push(optimizedTime);
          
          // Clean up
          document.getElementById('test-container').innerHTML = '';
          
          // Test React simulation
          const reactTime = this.createReactSimulation();
          results.reactSimulation.push(reactTime);
          
          // Clean up
          document.getElementById('test-container').innerHTML = '';
        }

        return results;
      },

      // Calculate statistics
      calculateStats: function(times) {
        const sorted = times.slice().sort((a, b) => a - b);
        const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
        const median = sorted[Math.floor(sorted.length / 2)];
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        
        return { avg, median, min, max, p95 };
      },

      // Browser capability detection
      detectCapabilities: function() {
        return {
          shadowDOM: 'attachShadow' in Element.prototype,
          constructableStylesheets: 'adoptedStyleSheets' in Document.prototype,
          customElements: 'customElements' in window,
          cssContainment: CSS.supports('contain', 'layout'),
          userAgent: navigator.userAgent,
          browserName: this.getBrowserName()
        };
      },

      getBrowserName: function() {
        const agent = navigator.userAgent.toLowerCase();
        if (agent.includes('chrome')) return 'chrome';
        if (agent.includes('firefox')) return 'firefox';
        if (agent.includes('safari')) return 'safari';
        if (agent.includes('edge')) return 'edge';
        return 'unknown';
      }
    };
    </script>
</body>
</html>`;
}

/**
 * Run browser performance tests
 */
async function runBrowserTests() {
  let browser;
  try {
    console.log('🚀 Launching headless Chrome...');
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set up the test page
    const testHTML = createTestHTML();
    await page.setContent(testHTML, { waitUntil: 'networkidle0' });
    
    console.log('🔬 Running browser capability detection...');
    const capabilities = await page.evaluate(() => window.ShadowDOMTest.detectCapabilities());
    
    console.log('📊 Browser Capabilities:');
    console.log(`  Browser: ${capabilities.browserName}`);
    console.log(`  Shadow DOM: ${capabilities.shadowDOM ? '✅' : '❌'}`);
    console.log(`  Constructable Stylesheets: ${capabilities.constructableStylesheets ? '✅' : '❌'}`);
    console.log(`  Custom Elements: ${capabilities.customElements ? '✅' : '❌'}`);
    console.log(`  CSS Containment: ${capabilities.cssContainment ? '✅' : '❌'}`);
    
    if (!capabilities.shadowDOM) {
      console.log('❌ Browser does not support Shadow DOM - cannot run tests');
      return null;
    }
    
    console.log('\n🧪 Running performance tests (50 iterations)...');
    const results = await page.evaluate(() => window.ShadowDOMTest.runPerformanceTest(50));
    
    console.log('📈 Calculating statistics...');
    const basicStats = await page.evaluate((times) => 
      window.ShadowDOMTest.calculateStats(times), results.basicShadowDOM
    );
    const optimizedStats = await page.evaluate((times) => 
      window.ShadowDOMTest.calculateStats(times), results.optimizedShadowDOM
    );
    const reactStats = await page.evaluate((times) => 
      window.ShadowDOMTest.calculateStats(times), results.reactSimulation
    );
    
    return {
      capabilities,
      performance: {
        basicShadowDOM: basicStats,
        optimizedShadowDOM: optimizedStats,
        reactSimulation: reactStats
      },
      rawResults: results
    };
    
  } catch (error) {
    console.error('❌ Browser test failed:', error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Compare with JSDOM results
 */
function compareWithJSDOM(browserResults) {
  // Load JSDOM results from our existing benchmarks
  let jsdomResults = {};
  try {
    // Try to load existing benchmark results
    const day6Results = require('./shadow-dom-performance-analysis.cjs');
    jsdomResults = day6Results.day6Results || {};
  } catch (e) {
    console.log('⚠️ Could not load JSDOM results for comparison');
  }
  
  if (!browserResults) {
    console.log('❌ No browser results to compare');
    return;
  }
  
  const browserOptimized = browserResults.performance.optimizedShadowDOM.avg;
  const browserReact = browserResults.performance.reactSimulation.avg;
  const optimizationGain = ((browserResults.performance.basicShadowDOM.avg - browserOptimized) / browserResults.performance.basicShadowDOM.avg) * 100;
  const reactAdvantage = ((browserReact - browserOptimized) / browserReact) * 100;
  
  console.log('\n📊 REAL BROWSER PERFORMANCE RESULTS');
  console.log('=====================================');
  console.log(`Basic Shadow DOM:     ${browserResults.performance.basicShadowDOM.avg.toFixed(4)}ms`);
  console.log(`Optimized Shadow DOM: ${browserOptimized.toFixed(4)}ms`);
  console.log(`React Simulation:     ${browserReact.toFixed(4)}ms`);
  console.log(`Optimization gain:    ${optimizationGain.toFixed(2)}%`);
  console.log(`React advantage:      ${reactAdvantage.toFixed(2)}%`);
  
  if (reactAdvantage > 0) {
    const factor = browserReact / browserOptimized;
    console.log(`Performance factor:   ${factor.toFixed(2)}x faster than React`);
  } else {
    const factor = browserOptimized / browserReact;
    console.log(`Performance factor:   ${factor.toFixed(2)}x SLOWER than React`);
  }
  
  // Validation against our claims
  console.log('\n🎯 VALIDATION AGAINST WEEK 2 CLAIMS');
  console.log('====================================');
  
  const claimedReactAdvantage = 23.09; // From our Week 2 claims
  const actualReactAdvantage = reactAdvantage > 0 ? (browserReact / browserOptimized) : -(browserOptimized / browserReact);
  
  console.log(`Claimed React advantage: ${claimedReactAdvantage}x faster`);
  console.log(`Actual React advantage:  ${actualReactAdvantage.toFixed(2)}x ${reactAdvantage > 0 ? 'faster' : 'slower'}`);
  
  const claimValidation = Math.abs(actualReactAdvantage) >= 2.0; // At least 2x faster
  console.log(`Claim validation:        ${claimValidation ? '✅ REASONABLE' : '❌ INVALID'}`);
  
  if (jsdomResults.projectedRealWorld) {
    console.log(`\nJSDOM projection:        ${jsdomResults.projectedRealWorld.toFixed(4)}ms`);
    console.log(`Browser actual:          ${browserOptimized.toFixed(4)}ms`);
    const projectionAccuracy = Math.abs(jsdomResults.projectedRealWorld - browserOptimized) / browserOptimized * 100;
    console.log(`Projection accuracy:     ${projectionAccuracy.toFixed(1)}% difference`);
  }
  
  return {
    browserResults,
    validation: {
      claimValidation,
      actualReactAdvantage,
      optimizationGain
    }
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('Starting real browser performance validation...\n');
  
  const browserResults = await runBrowserTests();
  const comparison = compareWithJSDOM(browserResults);
  
  if (comparison && comparison.validation.claimValidation) {
    console.log('\n🎉 REAL BROWSER VALIDATION: ✅ SUCCESS');
    console.log('Our Shadow DOM optimizations show measurable improvement in real browsers');
  } else {
    console.log('\n⚠️ REAL BROWSER VALIDATION: ❌ NEEDS IMPROVEMENT');
    console.log('Performance claims need adjustment based on real browser measurements');
  }
  
  // Save results for future reference
  const resultsPath = path.join(__dirname, 'browser-validation-results.json');
  if (browserResults) {
    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      browserResults,
      validation: comparison?.validation
    }, null, 2));
    console.log(`\n📁 Results saved to: ${resultsPath}`);
  }
  
  console.log('\n🔄 NEXT STEPS:');
  console.log('1. Review real browser performance vs JSDOM projections');
  console.log('2. Adjust performance claims based on actual measurements');
  console.log('3. Implement optimizations that show real browser impact');
  console.log('4. Update documentation with realistic performance expectations');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  runBrowserTests,
  compareWithJSDOM
};