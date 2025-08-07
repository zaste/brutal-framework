#!/usr/bin/env node
/**
 * Integration test for the complete performance tooling system
 * Tests all components working together
 */

import { 
  BenchmarkRunner, 
  BenchmarkStats, 
  bench 
} from './benchmark-suite.js';
import { RegressionDetector } from './regression-detector.js';
import { BundleSizeTracker } from './bundle-tracker.js';
import { MemoryLeakDetector } from './memory-leak-detector.js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

async function runIntegrationTest() {
  console.log('🧪 Running Performance Tools Integration Test\n');
  
  const testDir = join(tmpdir(), `brutal-perf-${Date.now()}`);
  let allTestsPassed = true;

  try {
    await mkdir(testDir, { recursive: true });

    // 1. Test Benchmark Suite
    console.log('1️⃣  Testing Benchmark Suite...');
    const benchmarkRunner = new BenchmarkRunner({
      iterations: 50,
      warmup: 10,
      minSamples: 20
    });

    // Add test benchmarks
    benchmarkRunner.addSuite('@brutal/components - Core Operations', [
      bench('createElement', () => {
        const obj = { type: 'div', props: {}, children: [] };
        void obj; // Use it
      }),
      bench('updateProps', () => {
        const obj = { a: 1, b: 2, c: 3 };
        Object.assign(obj, { a: 2, d: 4 });
      }),
      bench('arrayOperations', () => {
        const arr = [1, 2, 3, 4, 5];
        arr.map(x => x * 2).filter(x => x > 5);
      })
    ]);

    const benchmarkResults = await benchmarkRunner.runAll();
    const benchmarkPath = join(testDir, 'benchmark-results.json');
    await benchmarkRunner.saveResults(benchmarkResults, benchmarkPath);

    console.log('   ✓ Benchmark suite completed');
    console.log(`   ✓ Analyzed ${benchmarkResults.size} suites`);
    
    // Verify results
    const componentsSuite = benchmarkResults.get('@brutal/components - Core Operations');
    if (!componentsSuite || componentsSuite.benchmarks.length !== 3) {
      console.error('   ✗ Benchmark results incomplete');
      allTestsPassed = false;
    } else {
      console.log(`   ✓ All ${componentsSuite.benchmarks.length} benchmarks executed`);
    }
    console.log('');

    // 2. Test Regression Detection
    console.log('2️⃣  Testing Regression Detection...');
    
    // Create baseline (faster) results
    const baselineResults = new Map(benchmarkResults);
    for (const [name, suite] of baselineResults) {
      suite.benchmarks = suite.benchmarks.map(b => ({
        ...b,
        ops: Math.round(b.ops * 1.2), // 20% faster baseline
        mean: b.mean * 0.83
      }));
    }

    const regressionDetector = new RegressionDetector({
      error: 15,
      warning: 10,
      improvement: 10
    });

    const regressionReport = regressionDetector.detectRegressions(
      benchmarkResults,
      baselineResults
    );

    const regressionPath = join(testDir, 'regression-report.json');
    await regressionDetector.saveReport(regressionReport, regressionPath);

    console.log('   ✓ Regression detection completed');
    console.log(`   ✓ Found ${regressionReport.summary.errors} critical regressions`);
    console.log(`   ✓ Found ${regressionReport.summary.warnings} warnings`);

    const regressionMarkdown = regressionDetector.generateMarkdownReport(regressionReport);
    await writeFile(join(testDir, 'regression-report.md'), regressionMarkdown);
    console.log('   ✓ Generated markdown report');
    console.log('');

    // 3. Test Bundle Size Tracking
    console.log('3️⃣  Testing Bundle Size Tracking...');
    
    // Create mock bundles
    const packagesDir = join(testDir, 'packages');
    await mkdir(join(packagesDir, 'components', 'dist'), { recursive: true });
    await mkdir(join(packagesDir, 'utils', 'dist'), { recursive: true });

    // Create mock bundle files
    const mockBundle1 = 'export default function() { console.log("Component"); }'.repeat(100);
    const mockBundle2 = 'export const util = (x) => x * 2;'.repeat(50);

    await writeFile(join(packagesDir, 'components', 'package.json'), 
      JSON.stringify({ name: '@brutal/components', version: '1.0.0' }));
    await writeFile(join(packagesDir, 'components', 'dist', 'index.js'), mockBundle1);

    await writeFile(join(packagesDir, 'utils', 'package.json'), 
      JSON.stringify({ name: '@brutal/utils', version: '1.0.0' }));
    await writeFile(join(packagesDir, 'utils', 'dist', 'index.js'), mockBundle2);

    const bundleTracker = new BundleSizeTracker(testDir);
    const currentBundles = await bundleTracker.analyzeAllPackages();

    // Create baseline (smaller bundles)
    const baselineBundles = new Map();
    for (const [name, metrics] of currentBundles) {
      const smaller = { ...metrics };
      smaller.bundles = Object.fromEntries(
        Object.entries(metrics.bundles).map(([k, v]) => [
          k, 
          { ...v, raw: Math.round(v.raw * 0.8), gzipped: Math.round(v.gzipped * 0.8) }
        ])
      );
      baselineBundles.set(name, smaller);
    }

    const bundleReport = bundleTracker.compareMetrics(currentBundles, baselineBundles);
    const bundlePath = join(testDir, 'bundle-report.json');
    await writeFile(bundlePath, JSON.stringify(bundleReport, null, 2));

    console.log('   ✓ Bundle analysis completed');
    console.log(`   ✓ Analyzed ${bundleReport.summary.totalPackages} packages`);
    console.log(`   ✓ ${bundleReport.summary.increased} bundles increased`);

    const bundleMarkdown = bundleTracker.generateMarkdownReport(bundleReport);
    await writeFile(join(testDir, 'bundle-report.md'), bundleMarkdown);
    console.log('   ✓ Generated bundle report');
    console.log('');

    // 4. Test Memory Leak Detection
    console.log('4️⃣  Testing Memory Leak Detection...');
    
    const memoryDetector = new MemoryLeakDetector({
      iterations: 30,
      threshold: 0.05,
      warmup: 5,
      confidence: 0.7
    });

    // Test both leaky and non-leaky scenarios
    const memoryReport = await memoryDetector.detectLeaksInSuite(
      '@brutal/test-components',
      [
        {
          name: 'clean render',
          test: () => {
            const element = { type: 'div', props: {}, children: [] };
            // Properly cleaned up
            void element;
          }
        },
        {
          name: 'potential leak',
          test: (() => {
            const cache: any[] = [];
            return () => {
              cache.push({ timestamp: Date.now() });
              // Only keep last 10 items to avoid real leak in test
              if (cache.length > 10) cache.shift();
            };
          })()
        }
      ]
    );

    const memoryPath = join(testDir, 'memory-report.json');
    await writeFile(memoryPath, JSON.stringify(memoryReport, null, 2));

    console.log('   ✓ Memory leak detection completed');
    console.log(`   ✓ Tested ${memoryReport.summary.total} scenarios`);
    console.log(`   ✓ Found ${memoryReport.summary.leaks} memory leaks`);
    console.log(`   ✓ ${memoryReport.summary.suspicious} suspicious patterns`);

    const memoryMarkdown = memoryDetector.generateMarkdownReport(memoryReport);
    await writeFile(join(testDir, 'memory-report.md'), memoryMarkdown);
    console.log('   ✓ Generated memory report');
    console.log('');

    // 5. Integration Summary
    console.log('📊 Integration Test Summary:');
    console.log('─'.repeat(40));
    console.log(`Test directory: ${testDir}`);
    console.log('Generated reports:');
    console.log(`  - ${benchmarkPath}`);
    console.log(`  - ${regressionPath}`);
    console.log(`  - ${bundlePath}`);
    console.log(`  - ${memoryPath}`);
    console.log('');

    // Validate all components worked together
    const validations = [
      { name: 'Benchmarks executed', passed: benchmarkResults.size > 0 },
      { name: 'Regression analysis completed', passed: regressionReport !== null },
      { name: 'Bundle sizes analyzed', passed: bundleReport.changes.length > 0 },
      { name: 'Memory tests completed', passed: memoryReport.results.length > 0 }
    ];

    for (const validation of validations) {
      if (validation.passed) {
        console.log(`✓ ${validation.name}`);
      } else {
        console.log(`✗ ${validation.name}`);
        allTestsPassed = false;
      }
    }

    console.log('');
    
    if (allTestsPassed) {
      console.log('✅ All performance tools integration tests PASSED!');
      console.log('\n🎉 The performance tooling system is working correctly!\n');
    } else {
      console.log('❌ Some integration tests FAILED!');
      console.log('\n⚠️  Please fix the issues before proceeding.\n');
    }

    // Optional cleanup (commented to allow inspection)
    // await rm(testDir, { recursive: true, force: true });

  } catch (error) {
    console.error('\n❌ Integration test failed with error:', error);
    allTestsPassed = false;
  }

  process.exit(allTestsPassed ? 0 : 1);
}

// Run the test
runIntegrationTest();