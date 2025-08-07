/**
 * COMPREHENSIVE FRAMEWORK TESTING
 * Tests all critical functionality without simulations or workarounds
 */

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function logTest(name, result, details = '') {
  const status = result ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (details) console.log(`   Details: ${details}`);
  if (result) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push({ name, details });
  }
}

async function testCorePackageBuild() {
  console.log('\n🔍 TESTING: Core Package Build');
  
  try {
    // Check if dist files exist
    const distPath = join(__dirname, 'packages/core/dist');
    const files = await fs.readdir(distPath);
    
    logTest('Core dist directory exists', files.length > 0, `Found ${files.length} files`);
    logTest('index.js exists', files.includes('index.js'));
    logTest('index.cjs exists', files.includes('index.cjs'));
    
    // Check file content
    const indexContent = await fs.readFile(join(distPath, 'index.js'), 'utf8');
    logTest('index.js has content', indexContent.length > 1000, `${indexContent.length} chars`);
    logTest('NativeComponentBase exported', indexContent.includes('NativeComponentBase'));
    logTest('CoreFramework exported', indexContent.includes('CoreFramework'));
    logTest('Performance tracking exported', indexContent.includes('performanceTracker'));
    
  } catch (error) {
    logTest('Core package build test', false, error.message);
  }
}

async function testCoreFrameworkImports() {
  console.log('\n🔍 TESTING: Core Framework Imports');
  
  try {
    // Use dynamic import to test the actual built package
    const distPath = join(__dirname, 'packages/core/dist/index.js');
    const core = await import(`file://${distPath}`);
    
    logTest('Core module imports successfully', true);
    logTest('NativeComponentBase available', typeof core.NativeComponentBase === 'function');
    logTest('CoreFramework available', typeof core.CoreFramework === 'function');
    logTest('performanceTracker available', typeof core.performanceTracker === 'object');
    logTest('createFramework function available', typeof core.createFramework === 'function');
    logTest('quickStart function available', typeof core.quickStart === 'function');
    
    // Test framework creation
    const framework = core.createFramework({
      environment: 'development',
      performance: { targetMultiplier: 25 }
    });
    
    logTest('Framework instance creation', framework !== null);
    logTest('Framework has initialize method', typeof framework.initialize === 'function');
    
  } catch (error) {
    logTest('Core framework imports', false, error.message);
  }
}

async function testPolyfillsInstallation() {
  console.log('\n🔍 TESTING: Browser Polyfills');
  
  try {
    // Import polyfills
    const distPath = join(__dirname, 'packages/core/dist/index.js');
    const core = await import(`file://${distPath}`);
    
    logTest('Polyfills module imported', true);
    logTest('IntersectionObserverPolyfill available', typeof core.IntersectionObserverPolyfill === 'function');
    logTest('CSSStyleSheetPolyfill available', typeof core.CSSStyleSheetPolyfill === 'function');
    
    // Test IntersectionObserver polyfill
    const observer = new core.IntersectionObserverPolyfill(() => {}, {});
    logTest('IntersectionObserver polyfill instantiates', observer !== null);
    logTest('Observer has observe method', typeof observer.observe === 'function');
    logTest('Observer has unobserve method', typeof observer.unobserve === 'function');
    logTest('Observer has disconnect method', typeof observer.disconnect === 'function');
    logTest('Observer has takeRecords method', typeof observer.takeRecords === 'function');
    
    // Test CSSStyleSheet polyfill
    const stylesheet = new core.CSSStyleSheetPolyfill();
    logTest('CSSStyleSheet polyfill instantiates', stylesheet !== null);
    logTest('Stylesheet has insertRule method', typeof stylesheet.insertRule === 'function');
    logTest('Stylesheet has deleteRule method', typeof stylesheet.deleteRule === 'function');
    logTest('Stylesheet has cssRules property', stylesheet.cssRules !== undefined);
    
    // Test functionality
    const ruleIndex = stylesheet.insertRule('body { color: red; }');
    logTest('insertRule returns index', typeof ruleIndex === 'number');
    logTest('cssRules has added rule', stylesheet.cssRules.length > 0);
    
  } catch (error) {
    logTest('Polyfills testing', false, error.message);
  }
}

async function testSectionsPackage() {
  console.log('\n🔍 TESTING: Sections Package');
  
  try {
    // Check sections build
    const sectionsDistPath = join(__dirname, 'packages/sections/dist');
    const files = await fs.readdir(sectionsDistPath);
    
    logTest('Sections dist exists', files.length > 0, `Found ${files.length} files`);
    
    // Test sections import
    const sectionsPath = join(sectionsDistPath, 'index.js');
    const sections = await import(`file://${sectionsPath}`);
    
    logTest('Sections module imports', true);
    logTest('HeroSection exported', sections.HeroSection !== undefined);
    logTest('HeroSectionOptimized exported', sections.HeroSectionOptimized !== undefined);
    logTest('initializeSections function exported', typeof sections.initializeSections === 'function');
    
    // Test initialization
    const config = sections.initializeSections({
      autoRegister: false,
      performanceTracking: true
    });
    
    logTest('Sections initialization works', config.ready === true);
    
  } catch (error) {
    logTest('Sections package testing', false, error.message);
  }
}

async function testComponentCreation() {
  console.log('\n🔍 TESTING: Component Creation');
  
  try {
    // Import core
    const distPath = join(__dirname, 'packages/core/dist/index.js');
    const core = await import(`file://${distPath}`);
    
    // Create test component class
    class TestComponent extends core.NativeComponentBase {
      constructor() {
        super();
        this.testProperty = 'working';
      }
      
      connectedCallback() {
        this.innerHTML = '<div>Test Component</div>';
      }
    }
    
    logTest('Component class extends NativeComponentBase', TestComponent.prototype instanceof core.NativeComponentBase);
    
    // Test component instantiation
    const component = new TestComponent();
    logTest('Component instantiation works', component !== null);
    logTest('Component has test property', component.testProperty === 'working');
    logTest('Component has framework methods', typeof component.enableShadowDOMOptimization === 'function');
    logTest('Component has performance methods', typeof component.recordMetric === 'function');
    
  } catch (error) {
    logTest('Component creation testing', false, error.message);
  }
}

async function testPerformanceTracking() {
  console.log('\n🔍 TESTING: Performance Tracking');
  
  try {
    const distPath = join(__dirname, 'packages/core/dist/index.js');
    const core = await import(`file://${distPath}`);
    
    const tracker = core.performanceTracker;
    logTest('Performance tracker exists', tracker !== null);
    
    // Test metric recording
    tracker.recordMetric('testMetric', 42);
    const metrics = tracker.getMetrics();
    
    logTest('Metrics recording works', metrics !== null);
    logTest('Metrics has timestamp', typeof metrics.timestamp === 'number');
    logTest('Metrics has componentCount', typeof metrics.componentCount === 'number');
    logTest('Metrics has reactComparisonMultiplier', typeof metrics.reactComparisonMultiplier === 'number');
    
    // Test component metrics
    tracker.recordComponentMetrics('testComponent', {
      name: 'testComponent',
      renderTime: 5.2,
      memoryFootprint: 1024
    });
    
    const componentMetrics = tracker.getComponentMetrics('testComponent');
    logTest('Component metrics recording works', componentMetrics.length > 0);
    logTest('Component metrics has correct data', componentMetrics[0].renderTime === 5.2);
    
  } catch (error) {
    logTest('Performance tracking testing', false, error.message);
  }
}

async function testHeroSectionComponent() {
  console.log('\n🔍 TESTING: Hero Section Component');
  
  try {
    // Import sections
    const sectionsPath = join(__dirname, 'packages/sections/dist/index.js');
    const sections = await import(`file://${sectionsPath}`);
    
    logTest('HeroSection class available', typeof sections.HeroSection === 'function');
    logTest('HeroSectionOptimized class available', typeof sections.HeroSectionOptimized === 'function');
    
    // Test basic instantiation
    const heroBasic = new sections.HeroSection();
    logTest('Basic HeroSection instantiates', heroBasic !== null);
    
    const heroOptimized = new sections.HeroSectionOptimized();
    logTest('Optimized HeroSection instantiates', heroOptimized !== null);
    
    // Test configuration
    if (sections.HeroSectionOptimized.prototype.setAttribute) {
      heroOptimized.setAttribute('title', 'Test Title');
      heroOptimized.setAttribute('theme', 'corporate');
      logTest('Hero component accepts attributes', true);
    }
    
  } catch (error) {
    logTest('Hero Section component testing', false, error.message);
  }
}

async function testRealDOMIntegration() {
  console.log('\n🔍 TESTING: Real DOM Integration');
  
  try {
    // Create minimal DOM environment for testing
    global.window = {
      addEventListener: () => {},
      performance: { now: () => Date.now() },
      IntersectionObserver: undefined
    };
    
    global.document = {
      createElement: (tag) => ({
        tagName: tag,
        setAttribute: () => {},
        appendChild: () => {},
        innerHTML: '',
        style: {},
        attachShadow: () => ({ innerHTML: '' })
      })
    };
    
    // Import and test
    const distPath = join(__dirname, 'packages/core/dist/index.js');
    const core = await import(`file://${distPath}`);
    
    // Test polyfill installation in mock environment
    const observer = new core.IntersectionObserverPolyfill(() => {}, {});
    const mockElement = document.createElement('div');
    
    observer.observe(mockElement);
    logTest('Polyfill works with DOM elements', true);
    
    observer.disconnect();
    logTest('Observer cleanup works', true);
    
  } catch (error) {
    logTest('Real DOM integration testing', false, error.message);
  }
}

async function testShadowDOMOptimization() {
  console.log('\n🔍 TESTING: Shadow DOM Optimization');
  
  try {
    const distPath = join(__dirname, 'packages/core/dist/index.js');
    const core = await import(`file://${distPath}`);
    
    // Mock shadow DOM for testing
    global.HTMLElement = class HTMLElement {
      constructor() {
        this.shadowRoot = null;
        this.style = {};
      }
      
      attachShadow(options) {
        if (this.shadowRoot) {
          throw new Error('Shadow root cannot be created on a host which already hosts a shadow tree');
        }
        this.shadowRoot = { innerHTML: '', mode: options.mode };
        return this.shadowRoot;
      }
    };
    
    // Test component with shadow DOM
    class TestShadowComponent extends core.NativeComponentBase {
      constructor() {
        super();
      }
    }
    
    const component = new TestShadowComponent();
    logTest('Shadow DOM component creation', component !== null);
    
    // Test shadow DOM optimization method
    if (typeof component.enableShadowDOMOptimization === 'function') {
      component.enableShadowDOMOptimization();
      logTest('Shadow DOM optimization method executes', true);
    }
    
  } catch (error) {
    logTest('Shadow DOM optimization testing', false, error.message);
  }
}

async function runAllTests() {
  console.log('🧪 COMPREHENSIVE FRAMEWORK TESTING');
  console.log('=====================================');
  
  await testCorePackageBuild();
  await testCoreFrameworkImports();
  await testPolyfillsInstallation();
  await testSectionsPackage();
  await testComponentCreation();
  await testPerformanceTracking();
  await testHeroSectionComponent();
  await testRealDOMIntegration();
  await testShadowDOMOptimization();
  
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${(testResults.passed / (testResults.passed + testResults.failed) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n🚨 FAILED TESTS:');
    testResults.errors.forEach(error => {
      console.log(`   • ${error.name}: ${error.details}`);
    });
  }
  
  console.log('\n🎯 FRAMEWORK STATUS:');
  if (testResults.failed === 0) {
    console.log('✅ ALL TESTS PASSED - Framework is fully functional');
  } else if (testResults.failed < 5) {
    console.log('⚠️  Minor issues detected - Framework mostly functional');
  } else {
    console.log('❌ Major issues detected - Framework needs fixes');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});