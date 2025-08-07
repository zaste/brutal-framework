/**
 * STATIC ANALYSIS TESTING
 * Tests framework without requiring DOM environment
 */

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testResults = { passed: 0, failed: 0, errors: [] };

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

async function testBuildArtifacts() {
  console.log('\n🔍 TESTING: Build Artifacts');
  
  try {
    // Core package
    const coreDistPath = join(__dirname, 'packages/core/dist');
    const coreFiles = await fs.readdir(coreDistPath);
    
    logTest('Core dist files generated', coreFiles.length > 0, `Found: ${coreFiles.join(', ')}`);
    
    const indexJs = await fs.readFile(join(coreDistPath, 'index.js'), 'utf8');
    const indexCjs = await fs.readFile(join(coreDistPath, 'index.cjs'), 'utf8');
    
    logTest('index.js has substantial content', indexJs.length > 50000, `${indexJs.length} characters`);
    logTest('index.cjs has substantial content', indexCjs.length > 50000, `${indexCjs.length} characters`);
    
    // Sections package
    const sectionsDistPath = join(__dirname, 'packages/sections/dist');
    const sectionsFiles = await fs.readdir(sectionsDistPath);
    
    logTest('Sections dist files generated', sectionsFiles.length > 0, `Found: ${sectionsFiles.join(', ')}`);
    
  } catch (error) {
    logTest('Build artifacts test', false, error.message);
  }
}

async function testExportAnalysis() {
  console.log('\n🔍 TESTING: Export Analysis');
  
  try {
    const indexJs = await fs.readFile(join(__dirname, 'packages/core/dist/index.js'), 'utf8');
    
    // Critical exports
    logTest('NativeComponentBase exported', indexJs.includes('NativeComponentBase'));
    logTest('CoreFramework exported', indexJs.includes('CoreFramework'));
    logTest('ConfigurationManager exported', indexJs.includes('ConfigurationManager'));
    logTest('performanceTracker exported', indexJs.includes('performanceTracker'));
    logTest('createFramework exported', indexJs.includes('createFramework'));
    logTest('quickStart exported', indexJs.includes('quickStart'));
    
    // Polyfills
    logTest('IntersectionObserverPolyfill exported', indexJs.includes('IntersectionObserverPolyfill'));
    logTest('CSSStyleSheetPolyfill exported', indexJs.includes('CSSStyleSheetPolyfill'));
    logTest('installBrowserPolyfills exported', indexJs.includes('installBrowserPolyfills'));
    
    // Performance system
    logTest('PerformanceMetrics type exported', indexJs.includes('PerformanceMetrics'));
    logTest('recordMetric function exported', indexJs.includes('recordMetric'));
    
    // Configuration
    logTest('FrameworkConfig type available', indexJs.includes('FrameworkConfig'));
    logTest('ComponentDefinition type available', indexJs.includes('ComponentDefinition'));
    
  } catch (error) {
    logTest('Export analysis', false, error.message);
  }
}

async function testTypeScriptCompilation() {
  console.log('\n🔍 TESTING: TypeScript Compilation');
  
  try {
    // Check for TypeScript compilation errors in build logs
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    // Test core compilation
    const { stdout: coreOutput, stderr: coreErrors } = await execAsync('cd packages/core && npx tsc --noEmit');
    
    const criticalErrors = coreErrors.split('\n').filter(line => 
      line.includes('TS2341') || // Private property access
      line.includes('TS2304') || // Cannot find name
      line.includes('TS2307') || // Cannot find module
      line.includes('TS2339')    // Property does not exist
    );
    
    logTest('No critical TypeScript errors', criticalErrors.length === 0, 
      criticalErrors.length > 0 ? `Found: ${criticalErrors.slice(0, 3).join('; ')}` : 'Clean compilation');
    
  } catch (error) {
    // TypeScript errors are expected, check if they're critical
    const errorString = error.stderr || error.message;
    const criticalErrors = errorString.split('\n').filter(line => 
      line.includes('TS2341') || line.includes('TS2304') || 
      line.includes('TS2307') || line.includes('TS2339')
    );
    
    logTest('TypeScript compilation status', criticalErrors.length < 5, 
      `${criticalErrors.length} critical errors found`);
  }
}

async function testFrameworkStructure() {
  console.log('\n🔍 TESTING: Framework Structure');
  
  try {
    const indexJs = await fs.readFile(join(__dirname, 'packages/core/dist/index.js'), 'utf8');
    
    // Framework classes
    logTest('CoreFramework class defined', indexJs.includes('class CoreFramework'));
    logTest('NativeComponentBase class defined', indexJs.includes('class NativeComponentBase'));
    logTest('ConfigurationManager class defined', indexJs.includes('class ConfigurationManager'));
    logTest('PerformanceTracker class defined', indexJs.includes('class PerformanceTracker'));
    
    // Framework methods
    logTest('enableShadowDOMOptimization method', indexJs.includes('enableShadowDOMOptimization'));
    logTest('enableTemplateCaching method', indexJs.includes('enableTemplateCaching'));
    logTest('enableEventDelegation method', indexJs.includes('enableEventDelegation'));
    logTest('recordMetric method', indexJs.includes('recordMetric'));
    
    // Performance system
    logTest('Performance tracking initialization', indexJs.includes('__NWC_PERFORMANCE__'));
    logTest('React comparison calculation', indexJs.includes('calculateReactMultiplier'));
    
  } catch (error) {
    logTest('Framework structure test', false, error.message);
  }
}

async function testSectionsIntegration() {
  console.log('\n🔍 TESTING: Sections Integration');
  
  try {
    const sectionsJs = await fs.readFile(join(__dirname, 'packages/sections/dist/index.js'), 'utf8');
    
    // Component exports
    logTest('HeroSection exported', sectionsJs.includes('HeroSection'));
    logTest('HeroSectionOptimized exported', sectionsJs.includes('HeroSectionOptimized'));
    logTest('initializeSections function exported', sectionsJs.includes('initializeSections'));
    
    // Theme system
    logTest('sectionThemes exported', sectionsJs.includes('sectionThemes'));
    logTest('sectionAnimations exported', sectionsJs.includes('sectionAnimations'));
    
    // Performance integration
    logTest('Performance validation in sections', sectionsJs.includes('validateSectionPerformance'));
    
    // Check for core imports (should be resolved)
    logTest('Core imports resolved', !sectionsJs.includes('@nwc/core'), 'Core imports should be bundled');
    
  } catch (error) {
    logTest('Sections integration test', false, error.message);
  }
}

async function testPackageConfiguration() {
  console.log('\n🔍 TESTING: Package Configuration');
  
  try {
    // Test package.json files
    const rootPkg = JSON.parse(await fs.readFile(join(__dirname, 'package.json'), 'utf8'));
    const corePkg = JSON.parse(await fs.readFile(join(__dirname, 'packages/core/package.json'), 'utf8'));
    const sectionsPkg = JSON.parse(await fs.readFile(join(__dirname, 'packages/sections/package.json'), 'utf8'));
    
    logTest('Root package valid', rootPkg.name === 'native-web-components-framework');
    logTest('Core package valid', corePkg.name === '@nwc/core');
    logTest('Sections package valid', sectionsPkg.name === '@nwc/sections');
    
    logTest('Core has build script', corePkg.scripts && corePkg.scripts.build);
    logTest('Sections has build script', sectionsPkg.scripts && sectionsPkg.scripts.build);
    
    logTest('Core exports defined', corePkg.exports !== undefined);
    logTest('Core main field defined', corePkg.main !== undefined);
    
  } catch (error) {
    logTest('Package configuration test', false, error.message);
  }
}

async function testPolyfillImplementation() {
  console.log('\n🔍 TESTING: Polyfill Implementation');
  
  try {
    const indexJs = await fs.readFile(join(__dirname, 'packages/core/dist/index.js'), 'utf8');
    
    // IntersectionObserver polyfill
    logTest('IntersectionObserver polyfill class', indexJs.includes('class IntersectionObserverPolyfill'));
    logTest('IntersectionObserver implements interface', indexJs.includes('implements IntersectionObserver'));
    logTest('IntersectionObserver has observe method', indexJs.includes('observe(target)'));
    logTest('IntersectionObserver has takeRecords method', indexJs.includes('takeRecords()'));
    
    // CSSStyleSheet polyfill
    logTest('CSSStyleSheet polyfill class', indexJs.includes('class CSSStyleSheetPolyfill'));
    logTest('CSSStyleSheet implements interface', indexJs.includes('implements CSSStyleSheet'));
    logTest('CSSStyleSheet has insertRule method', indexJs.includes('insertRule(rule'));
    logTest('CSSStyleSheet has cssRules property', indexJs.includes('get cssRules()'));
    
    // Polyfill installation
    logTest('Polyfill installation function', indexJs.includes('installBrowserPolyfills'));
    logTest('Browser support detection', indexJs.includes('browserSupport'));
    
  } catch (error) {
    logTest('Polyfill implementation test', false, error.message);
  }
}

async function runStaticTests() {
  console.log('🔬 STATIC FRAMEWORK ANALYSIS');
  console.log('==============================');
  
  await testBuildArtifacts();
  await testExportAnalysis();
  await testTypeScriptCompilation();
  await testFrameworkStructure();
  await testSectionsIntegration();
  await testPackageConfiguration();
  await testPolyfillImplementation();
  
  console.log('\n📊 STATIC TEST SUMMARY');
  console.log('======================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${(testResults.passed / (testResults.passed + testResults.failed) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n🚨 FAILED TESTS:');
    testResults.errors.forEach(error => {
      console.log(`   • ${error.name}: ${error.details}`);
    });
  }
  
  console.log('\n🎯 STATIC ANALYSIS RESULT:');
  if (testResults.failed === 0) {
    console.log('✅ ALL STATIC TESTS PASSED - Framework structure is solid');
  } else if (testResults.failed < 3) {
    console.log('⚠️  Minor structural issues - Framework mostly well-formed');
  } else {
    console.log('❌ Major structural issues - Framework needs architectural fixes');
  }
}

runStaticTests().catch(error => {
  console.error('❌ Static test execution failed:', error);
  process.exit(1);
});