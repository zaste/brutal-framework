/**
 * TestRunner - Executes extracted tests with zero dependencies
 */

import { Worker } from 'worker_threads';
import * as path from 'path';
import { pathToFileURL } from 'url';
import type { TestResult, TestFileResult, RunnerOptions } from './types.js';

export class TestRunner {
  private options: Required<RunnerOptions>;
  private results: Map<string, TestFileResult> = new Map();

  constructor(options: RunnerOptions = {}) {
    this.options = {
      parallel: options.parallel ?? true,
      maxWorkers: options.maxWorkers ?? 4,
      timeout: options.timeout ?? 5000,
      bail: options.bail ?? false,
      grep: options.grep ?? /.*/,
      verbose: options.verbose ?? false
    };
  }

  /**
   * Run tests from a single file
   */
  async runFile(filePath: string): Promise<TestFileResult> {
    const startTime = performance.now();
    const results: TestResult[] = [];
    
    try {
      // Import the test file dynamically
      const fileUrl = pathToFileURL(filePath).href;
      const testModule = await import(fileUrl);
      
      // Run tests defined in the module
      const tests = this.extractTestsFromModule(testModule);
      
      for (const test of tests) {
        if (!this.options.grep.test(test.name)) continue;
        
        const result = await this.runTest(test);
        results.push(result);
        
        if (this.options.bail && !result.passed) {
          break;
        }
      }
    } catch (error) {
      // File-level error
      results.push({
        name: 'File Import',
        passed: false,
        duration: 0,
        error: error as Error
      });
    }
    
    const duration = performance.now() - startTime;
    const fileResult: TestFileResult = {
      file: filePath,
      results,
      duration,
      passed: results.filter(r => r.passed && !r.skipped).length,
      failed: results.filter(r => !r.passed && !r.skipped).length,
      skipped: results.filter(r => r.skipped).length
    };
    
    this.results.set(filePath, fileResult);
    return fileResult;
  }

  /**
   * Run multiple test files
   */
  async runFiles(files: string[]): Promise<TestFileResult[]> {
    if (this.options.parallel && files.length > 1) {
      return this.runParallel(files);
    } else {
      return this.runSequential(files);
    }
  }

  /**
   * Run a single test case
   */
  private async runTest(test: any): Promise<TestResult> {
    const startTime = performance.now();
    
    if (test.skip) {
      return {
        name: test.name,
        passed: true,
        skipped: true,
        duration: 0
      };
    }
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Test timeout after ${this.options.timeout}ms`)), 
                  this.options.timeout);
      });
      
      // Run test with timeout
      await Promise.race([
        test.fn(),
        timeoutPromise
      ]);
      
      return {
        name: test.name,
        passed: true,
        duration: performance.now() - startTime
      };
    } catch (error) {
      return {
        name: test.name,
        passed: false,
        duration: performance.now() - startTime,
        error: error as Error
      };
    }
  }

  /**
   * Run tests sequentially
   */
  private async runSequential(files: string[]): Promise<TestFileResult[]> {
    const results: TestFileResult[] = [];
    
    for (const file of files) {
      const result = await this.runFile(file);
      results.push(result);
      
      if (this.options.bail && result.failed > 0) {
        break;
      }
    }
    
    return results;
  }

  /**
   * Run tests in parallel using workers
   */
  private async runParallel(files: string[]): Promise<TestFileResult[]> {
    const workerCount = Math.min(this.options.maxWorkers, files.length);
    const chunks = this.chunkArray(files, workerCount);
    
    const promises = chunks.map(chunk => this.runInWorker(chunk));
    const results = await Promise.all(promises);
    
    return results.flat();
  }

  /**
   * Run tests in a worker thread
   */
  private async runInWorker(files: string[]): Promise<TestFileResult[]> {
    return new Promise((resolve, reject) => {
      const workerPath = path.join(import.meta.url, '../worker.js');
      const worker = new Worker(workerPath, {
        workerData: {
          files,
          options: this.options
        }
      });
      
      worker.on('message', (results) => {
        resolve(results);
      });
      
      worker.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Extract tests from an imported module
   */
  private extractTestsFromModule(module: any): any[] {
    const tests: any[] = [];
    
    // Look for exported test functions
    if (module.__tests) {
      tests.push(...module.__tests);
    }
    
    // Look for global test registry (if using global test functions)
    if ((global as any).__brutalTests) {
      tests.push(...(global as any).__brutalTests);
      (global as any).__brutalTests = []; // Clear for next file
    }
    
    return tests;
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    const chunkSize = Math.ceil(array.length / size);
    
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    
    return chunks;
  }

  /**
   * Get all test results
   */
  getResults(): TestFileResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Get summary of all test runs
   */
  getSummary() {
    const results = this.getResults();
    const total = results.reduce((acc, r) => acc + r.results.length, 0);
    const passed = results.reduce((acc, r) => acc + r.passed, 0);
    const failed = results.reduce((acc, r) => acc + r.failed, 0);
    const skipped = results.reduce((acc, r) => acc + r.skipped, 0);
    const duration = results.reduce((acc, r) => acc + r.duration, 0);
    
    return {
      files: results.length,
      total,
      passed,
      failed,
      skipped,
      duration,
      success: failed === 0
    };
  }
}