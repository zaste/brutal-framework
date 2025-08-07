/**
 * Type definitions for test extractor
 */

export interface TestFile {
  path: string;
  tests: TestCase[];
  suites: TestSuite[];
}

export interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
  timeout?: number;
  skip?: boolean;
  only?: boolean;
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
  beforeAll?: () => void | Promise<void>;
  afterAll?: () => void | Promise<void>;
}

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: Error;
  skipped?: boolean;
}

export interface TestFileResult {
  file: string;
  results: TestResult[];
  duration: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface ExtractorOptions {
  // Glob patterns for finding test files
  patterns?: string[];
  // Directories to search
  directories?: string[];
  // Directories to ignore
  ignore?: string[];
  // File extensions to consider
  extensions?: string[];
}

export interface RunnerOptions {
  // Run tests in parallel
  parallel?: boolean;
  // Maximum parallel workers
  maxWorkers?: number;
  // Test timeout in ms
  timeout?: number;
  // Fail fast on first error
  bail?: boolean;
  // Only run tests matching pattern
  grep?: RegExp;
  // Verbose output
  verbose?: boolean;
}

export interface ReporterOptions {
  // Output format
  format?: 'default' | 'json' | 'tap' | 'junit';
  // Output file path
  output?: string;
  // Show individual test results
  showTests?: boolean;
  // Show error stack traces
  showStacks?: boolean;
  // Use colors in output
  colors?: boolean;
}