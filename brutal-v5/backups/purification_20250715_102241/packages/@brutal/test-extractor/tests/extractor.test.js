/**
 * Tests for test-extractor functionality
 */

import { TestExtractor } from '../dist/test-extractor.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple test framework
const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Tests
test('TestExtractor - should create with default options', async () => {
  const extractor = new TestExtractor();
  assert(extractor instanceof TestExtractor);
  assert(extractor.getPatterns().length > 0);
  assert(extractor.getDirectories().length > 0);
});

test('TestExtractor - should accept custom options', async () => {
  const extractor = new TestExtractor({
    patterns: ['*.custom.js'],
    directories: ['custom-dir'],
    ignore: ['temp'],
    extensions: ['.custom']
  });
  
  assert(extractor.getPatterns().includes('*.custom.js'));
  assert(extractor.getDirectories().includes('custom-dir'));
});

test('TestExtractor - should find test files', async () => {
  const extractor = new TestExtractor({
    directories: ['.'],
    patterns: ['*.test.js']
  });
  
  const files = await extractor.findTestFiles(__dirname);
  assert(files.length > 0, 'Should find at least one test file');
  assert(files.some(f => f.includes('extractor.test.js')), 'Should find this test file');
});

test('TestExtractor - should extract test info from file', async () => {
  const extractor = new TestExtractor();
  const testFile = await extractor.extractTests(__filename);
  
  assert(testFile.path === __filename);
  assert(testFile.tests.length > 0, 'Should extract tests from this file');
});

// Export tests for runner
export const __tests = tests;