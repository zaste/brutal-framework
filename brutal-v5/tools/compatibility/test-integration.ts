#!/usr/bin/env node
/**
 * Integration test for the complete compatibility system
 * Tests all components working together in a real scenario
 */

import { CompatibilityMatrixGenerator } from './matrix-generator.js';
import { VersionCompatibilitySystem } from './version-manifest.js';
import { RuntimeVersionGuard } from './runtime-guard.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

async function runIntegrationTest() {
  console.log('🧪 Running Compatibility System Integration Test\n');
  
  const testDir = join(tmpdir(), `brutal-integration-${Date.now()}`);
  let allTestsPassed = true;

  try {
    // 1. Setup test environment
    console.log('1️⃣  Setting up test environment...');
    await mkdir(join(testDir, 'packages', '@brutal'), { recursive: true });
    
    // Create mock packages
    const packages = [
      {
        name: '@brutal/foundation',
        version: '1.0.0',
        dependencies: {}
      },
      {
        name: '@brutal/shared',
        version: '1.0.0', 
        dependencies: {}
      },
      {
        name: '@brutal/events',
        version: '1.0.0',
        dependencies: {
          '@brutal/shared': 'workspace:*'
        }
      },
      {
        name: '@brutal/components',
        version: '1.0.0',
        dependencies: {
          '@brutal/foundation': 'workspace:*',
          '@brutal/events': 'workspace:*'
        }
      },
      {
        name: '@brutal/enhanced-components',
        version: '1.0.0',
        dependencies: {
          '@brutal/components': 'workspace:*'
        }
      }
    ];

    for (const pkg of packages) {
      const pkgDir = join(testDir, 'packages', '@brutal', pkg.name.split('/')[1]);
      await mkdir(pkgDir, { recursive: true });
      await writeFile(
        join(pkgDir, 'package.json'),
        JSON.stringify(pkg, null, 2)
      );
    }
    console.log('   ✓ Created 5 mock packages\n');

    // 2. Generate compatibility matrix
    console.log('2️⃣  Generating compatibility matrix...');
    const generator = new CompatibilityMatrixGenerator(testDir);
    const manifest = await generator.generate();
    
    const matrixPath = join(testDir, 'compatibility-matrix.json');
    const htmlPath = join(testDir, 'compatibility-matrix.html');
    
    await generator.save(manifest, matrixPath);
    await generator.generateHTMLReport(manifest, htmlPath);
    console.log('   ✓ Generated matrix files\n');

    // 3. Test version validation
    console.log('3️⃣  Testing version validation...');
    const system = new VersionCompatibilitySystem(manifest);
    
    // Test compatible versions
    const compatiblePackages = {
      '@brutal/foundation': '1.0.0',
      '@brutal/shared': '1.0.0',
      '@brutal/events': '1.0.0',
      '@brutal/components': '1.0.0',
      '@brutal/enhanced-components': '1.0.0'
    };
    
    const compatResult = system.validateCompatibility(compatiblePackages);
    if (compatResult.valid) {
      console.log('   ✓ Compatible versions validated correctly');
    } else {
      console.error('   ✗ Compatible versions failed validation');
      allTestsPassed = false;
    }

    // Test incompatible versions
    const incompatiblePackages = {
      '@brutal/foundation': '2.0.0', // Too high
      '@brutal/components': '1.0.0'
    };
    
    const incompatResult = system.validateCompatibility(incompatiblePackages);
    if (!incompatResult.valid && incompatResult.issues.length > 0) {
      console.log('   ✓ Incompatible versions detected correctly');
      console.log(`     - Found ${incompatResult.issues.length} issues`);
      console.log(`     - ${incompatResult.suggestions.length} suggestions provided`);
    } else {
      console.error('   ✗ Failed to detect incompatible versions');
      allTestsPassed = false;
    }
    console.log('');

    // 4. Test runtime guard
    console.log('4️⃣  Testing runtime version guard...');
    
    // Clear any previous state
    RuntimeVersionGuard.clearCache();
    
    // Test with missing dependency
    let errorCaught = false;
    try {
      RuntimeVersionGuard.validate({
        packageName: '@brutal/test-component',
        packageVersion: '1.0.0',
        dependencies: {
          '@brutal/missing': '^1.0.0'
        },
        mode: 'strict'
      });
    } catch (error) {
      errorCaught = true;
    }
    
    if (errorCaught) {
      console.log('   ✓ Runtime guard caught missing dependency');
    } else {
      console.error('   ✗ Runtime guard failed to catch missing dependency');
      allTestsPassed = false;
    }

    // Test with valid dependencies
    try {
      RuntimeVersionGuard.validate({
        packageName: '@brutal/components',
        packageVersion: '1.0.0',
        dependencies: {
          '@brutal/foundation': '^1.0.0',
          '@brutal/events': '^1.0.0'
        },
        mode: 'strict'
      });
      console.log('   ✓ Runtime guard validated correct dependencies');
    } catch (error) {
      console.error('   ✗ Runtime guard incorrectly rejected valid dependencies');
      allTestsPassed = false;
    }
    console.log('');

    // 5. Generate comprehensive report
    console.log('5️⃣  Generating comprehensive report...');
    const report = system.generateReport(compatiblePackages);
    
    const reportPath = join(testDir, 'compatibility-report.json');
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('   ✓ Generated comprehensive report');
    console.log(`     - ${Object.keys(report.packages).length} packages analyzed`);
    console.log(`     - Compatibility matrix: ${report.matrix.packages.length}x${report.matrix.packages.length}`);
    console.log(`     - Breaking changes: ${report.breaking.length}`);
    console.log(`     - Recommendations: ${report.recommendations.length}`);
    console.log('');

    // 6. Summary
    console.log('📊 Integration Test Summary:');
    console.log('─'.repeat(40));
    console.log(`Test directory: ${testDir}`);
    console.log(`Files generated:`);
    console.log(`  - ${matrixPath}`);
    console.log(`  - ${htmlPath}`);
    console.log(`  - ${reportPath}`);
    console.log('');
    
    if (allTestsPassed) {
      console.log('✅ All integration tests PASSED!');
      console.log('\n🎉 The compatibility system is working correctly!\n');
    } else {
      console.log('❌ Some integration tests FAILED!');
      console.log('\n⚠️  Please fix the issues before proceeding.\n');
    }

    // Cleanup option (commented out to allow inspection)
    // await rm(testDir, { recursive: true, force: true });

  } catch (error) {
    console.error('\n❌ Integration test failed with error:', error);
    allTestsPassed = false;
  }

  process.exit(allTestsPassed ? 0 : 1);
}

// Run the test
runIntegrationTest();