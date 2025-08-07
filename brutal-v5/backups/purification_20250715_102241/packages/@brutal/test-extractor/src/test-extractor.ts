/**
 * TestExtractor - Finds and extracts test files from source directories
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { TestFile, ExtractorOptions } from './types.js';

export class TestExtractor {
  private options: Required<ExtractorOptions>;

  constructor(options: ExtractorOptions = {}) {
    this.options = {
      patterns: options.patterns || ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js'],
      directories: options.directories || ['src', 'packages'],
      ignore: options.ignore || ['node_modules', 'dist', 'build', '.git'],
      extensions: options.extensions || ['.ts', '.js', '.mjs']
    };
  }

  /**
   * Find all test files in the specified directories
   */
  async findTestFiles(baseDir: string = process.cwd()): Promise<string[]> {
    const testFiles: string[] = [];

    for (const dir of this.options.directories) {
      const fullPath = path.join(baseDir, dir);
      if (await this.exists(fullPath)) {
        await this.walkDirectory(fullPath, testFiles, baseDir);
      }
    }

    return testFiles.sort();
  }

  /**
   * Extract test information from a file
   */
  async extractTests(filePath: string): Promise<TestFile> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Basic extraction - look for test patterns
    const tests = this.parseTestFile(content);
    
    return {
      path: filePath,
      tests: tests.tests,
      suites: tests.suites
    };
  }

  /**
   * Walk directory recursively to find test files
   */
  private async walkDirectory(dir: string, testFiles: string[], baseDir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip ignored directories
      if (entry.isDirectory()) {
        if (!this.shouldIgnore(entry.name)) {
          await this.walkDirectory(fullPath, testFiles, baseDir);
        }
      } else if (entry.isFile()) {
        // Check if file matches test patterns
        if (this.isTestFile(entry.name)) {
          testFiles.push(fullPath);
        }
      }
    }
  }

  /**
   * Check if a directory should be ignored
   */
  private shouldIgnore(name: string): boolean {
    return this.options.ignore.includes(name) || name.startsWith('.');
  }

  /**
   * Check if a file is a test file
   */
  private isTestFile(filename: string): boolean {
    // Check extensions
    const ext = path.extname(filename);
    if (!this.options.extensions.includes(ext)) {
      return false;
    }

    // Check patterns
    return filename.includes('.test.') || filename.includes('.spec.');
  }

  /**
   * Parse test file content to extract test information
   */
  private parseTestFile(content: string): { tests: any[], suites: any[] } {
    const tests: any[] = [];
    const suites: any[] = [];

    // Simple regex-based extraction for test patterns
    // This is a basic implementation - can be enhanced with AST parsing
    
    // Match test() or it() calls
    const testRegex = /(?:test|it)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = testRegex.exec(content)) !== null) {
      tests.push({
        name: match[1],
        fn: () => {}, // Placeholder - actual function will be loaded at runtime
      });
    }

    // Match describe() blocks
    const describeRegex = /describe\s*\(\s*['"`]([^'"`]+)['"`]/g;
    while ((match = describeRegex.exec(content)) !== null) {
      suites.push({
        name: match[1],
        tests: [] // Will be populated during actual execution
      });
    }

    return { tests, suites };
  }

  /**
   * Check if a path exists
   */
  private async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get glob patterns for test files
   */
  getPatterns(): string[] {
    return [...this.options.patterns];
  }

  /**
   * Get search directories
   */
  getDirectories(): string[] {
    return [...this.options.directories];
  }
}