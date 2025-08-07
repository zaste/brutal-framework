#!/usr/bin/env node
/**
 * Simple test runner for test-extractor
 */

import { TestExtractor, TestRunner, TestReporter } from '../dist/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTests() {
  console.log('Running test-extractor tests...');
  
  try {
    // Create instances
    const extractor = new TestExtractor({
      directories: ['tests'],
      patterns: ['**/*.test.js']
    });
    
    const runner = new TestRunner({
      parallel: false,
      verbose: true
    });
    
    const reporter = new TestReporter({
      format: 'default',
      colors: true,
      showTests: true
    });
    
    // Find test files
    const testFiles = await extractor.findTestFiles(join(__dirname, '..'));
    console.log(`Found ${testFiles.length} test files`);
    
    // Run tests
    const results = await runner.runFiles(testFiles);
    
    // Report results
    const summary = runner.getSummary();
    await reporter.report(results, summary);
    
    // Exit with appropriate code
    process.exit(summary.success ? 0 : 1);
  } catch (error) {
    console.error('Test runner error:', error);
    process.exit(1);
  }
}

runTests();