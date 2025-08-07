/**
 * @brutal/test-extractor
 * 
 * Zero-dependency test extraction and running for co-located test files.
 * Enables *.test.ts files to live alongside source code.
 */

export { TestExtractor } from './test-extractor.js';
export { TestRunner } from './test-runner.js';
export { TestReporter } from './test-reporter.js';
export { test, it, describe, assert, expect } from './test-api.js';
export type { 
  TestFile, 
  TestCase, 
  TestResult, 
  TestSuite,
  ExtractorOptions,
  RunnerOptions,
  ReporterOptions 
} from './types.js';