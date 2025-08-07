/**
 * TestReporter - Formats and outputs test results
 */

import * as fs from 'fs/promises';
import type { TestFileResult, ReporterOptions } from './types.js';

export class TestReporter {
  private options: Required<ReporterOptions>;

  constructor(options: ReporterOptions = {}) {
    this.options = {
      format: options.format ?? 'default',
      output: options.output ?? '',
      showTests: options.showTests ?? true,
      showStacks: options.showStacks ?? true,
      colors: options.colors ?? true
    };
  }

  /**
   * Report test results
   */
  async report(results: TestFileResult[], summary: any): Promise<void> {
    let output: string;

    switch (this.options.format) {
      case 'json':
        output = this.formatJSON(results, summary);
        break;
      case 'tap':
        output = this.formatTAP(results);
        break;
      case 'junit':
        output = this.formatJUnit(results, summary);
        break;
      default:
        output = this.formatDefault(results, summary);
    }

    if (this.options.output) {
      await fs.writeFile(this.options.output, output);
    } else {
      console.log(output);
    }
  }

  /**
   * Default human-readable format
   */
  private formatDefault(results: TestFileResult[], summary: any): string {
    const lines: string[] = [];
    const colors = this.options.colors;

    // Header
    lines.push('');
    lines.push('Test Results');
    lines.push('============');
    lines.push('');

    // File results
    for (const fileResult of results) {
      const status = fileResult.failed > 0 ? '✗' : '✓';
      const color = fileResult.failed > 0 ? 'red' : 'green';
      
      lines.push(`${this.color(status, color, colors)} ${fileResult.file}`);
      
      if (this.options.showTests) {
        for (const test of fileResult.results) {
          const testStatus = test.skipped ? '○' : test.passed ? '✓' : '✗';
          const testColor = test.skipped ? 'gray' : test.passed ? 'green' : 'red';
          const duration = test.duration.toFixed(2);
          
          lines.push(`  ${this.color(testStatus, testColor, colors)} ${test.name} (${duration}ms)`);
          
          if (!test.passed && test.error && this.options.showStacks) {
            lines.push(this.formatError(test.error, '    '));
          }
        }
      }
      
      lines.push('');
    }

    // Summary
    lines.push('Summary');
    lines.push('-------');
    lines.push(`Files:    ${summary.files}`);
    lines.push(`Tests:    ${summary.total}`);
    lines.push(`Passed:   ${this.color(summary.passed.toString(), 'green', colors)}`);
    lines.push(`Failed:   ${this.color(summary.failed.toString(), summary.failed > 0 ? 'red' : 'green', colors)}`);
    lines.push(`Skipped:  ${this.color(summary.skipped.toString(), 'gray', colors)}`);
    lines.push(`Duration: ${(summary.duration / 1000).toFixed(2)}s`);
    lines.push('');

    // Overall status
    if (summary.success) {
      lines.push(this.color('All tests passed!', 'green', colors));
    } else {
      lines.push(this.color(`${summary.failed} tests failed`, 'red', colors));
    }

    return lines.join('\\n');
  }

  /**
   * JSON format
   */
  private formatJSON(results: TestFileResult[], summary: any): string {
    return JSON.stringify({
      results,
      summary,
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  /**
   * TAP (Test Anything Protocol) format
   */
  private formatTAP(results: TestFileResult[]): string {
    const lines: string[] = [];
    let testNumber = 0;
    
    // TAP version
    lines.push('TAP version 13');
    
    // Count total tests
    const totalTests = results.reduce((acc, r) => acc + r.results.length, 0);
    lines.push(`1..${totalTests}`);
    
    // Output each test
    for (const fileResult of results) {
      for (const test of fileResult.results) {
        testNumber++;
        
        if (test.skipped) {
          lines.push(`ok ${testNumber} ${test.name} # SKIP`);
        } else if (test.passed) {
          lines.push(`ok ${testNumber} ${test.name}`);
        } else {
          lines.push(`not ok ${testNumber} ${test.name}`);
          if (test.error) {
            lines.push(`  ---`);
            lines.push(`  message: ${test.error.message}`);
            if (test.error.stack) {
              lines.push(`  stack: |`);
              test.error.stack.split('\\n').forEach(line => {
                lines.push(`    ${line}`);
              });
            }
            lines.push(`  ...`);
          }
        }
      }
    }
    
    return lines.join('\\n');
  }

  /**
   * JUnit XML format
   */
  private formatJUnit(results: TestFileResult[], summary: any): string {
    const lines: string[] = [];
    
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push(`<testsuites tests="${summary.total}" failures="${summary.failed}" skipped="${summary.skipped}" time="${(summary.duration / 1000).toFixed(3)}">`);
    
    for (const fileResult of results) {
      const suiteName = fileResult.file.replace(/[^a-zA-Z0-9]/g, '_');
      lines.push(`  <testsuite name="${suiteName}" tests="${fileResult.results.length}" failures="${fileResult.failed}" skipped="${fileResult.skipped}" time="${(fileResult.duration / 1000).toFixed(3)}">`);
      
      for (const test of fileResult.results) {
        const testName = this.escapeXML(test.name);
        lines.push(`    <testcase name="${testName}" time="${(test.duration / 1000).toFixed(3)}">`);
        
        if (test.skipped) {
          lines.push(`      <skipped/>`);
        } else if (!test.passed && test.error) {
          lines.push(`      <failure message="${this.escapeXML(test.error.message)}">`);
          if (test.error.stack) {
            lines.push(this.escapeXML(test.error.stack));
          }
          lines.push(`      </failure>`);
        }
        
        lines.push(`    </testcase>`);
      }
      
      lines.push(`  </testsuite>`);
    }
    
    lines.push('</testsuites>');
    
    return lines.join('\\n');
  }

  /**
   * Format error for display
   */
  private formatError(error: Error, indent: string = ''): string {
    const lines: string[] = [];
    
    lines.push(`${indent}${this.color('Error:', 'red', this.options.colors)} ${error.message}`);
    
    if (error.stack && this.options.showStacks) {
      const stackLines = error.stack.split('\\n').slice(1); // Skip first line (message)
      stackLines.forEach(line => {
        lines.push(`${indent}${this.color(line.trim(), 'gray', this.options.colors)}`);
      });
    }
    
    return lines.join('\\n');
  }

  /**
   * Apply color to text
   */
  private color(text: string, color: string, enabled: boolean): string {
    if (!enabled) return text;
    
    const colors: Record<string, string> = {
      red: '\\x1b[31m',
      green: '\\x1b[32m',
      yellow: '\\x1b[33m',
      blue: '\\x1b[34m',
      gray: '\\x1b[90m',
      reset: '\\x1b[0m'
    };
    
    return `${colors[color] || ''}${text}${colors.reset}`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}