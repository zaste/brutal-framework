import { describe, it, expect, beforeEach } from '@jest/globals';
import { BreakingChangeAnalyzer } from '../breaking-change-analyzer.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('BreakingChangeAnalyzer', () => {
  let analyzer: BreakingChangeAnalyzer;
  let testDir: string;

  beforeEach(async () => {
    analyzer = new BreakingChangeAnalyzer();
    testDir = join(tmpdir(), `breaking-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  async function createTestPackage(
    version: 'old' | 'new',
    content: string
  ) {
    const versionDir = join(testDir, version, 'src');
    await mkdir(versionDir, { recursive: true });
    await writeFile(join(versionDir, 'index.ts'), content);
    
    const tsconfig = {
      compilerOptions: {
        target: 'es2020',
        module: 'esnext',
        lib: ['es2020']
      }
    };
    await writeFile(
      join(testDir, version, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2)
    );
  }

  it('should detect removed exports', async () => {
    await createTestPackage('old', `
      export class RemovedClass {
        method() {}
      }
      
      export function keepFunction() {}
    `);

    await createTestPackage('new', `
      export function keepFunction() {}
    `);

    const report = await analyzer.analyzePackage(testDir, '1.0.0', '2.0.0');

    expect(report.summary.removals).toBe(1);
    expect(report.changes).toContainEqual(
      expect.objectContaining({
        type: 'removed',
        name: 'RemovedClass',
        category: 'class',
        details: expect.objectContaining({
          breaking: true,
          severity: 'major'
        })
      })
    );
  });

  it('should detect added exports', async () => {
    await createTestPackage('old', `
      export function existingFunction() {}
    `);

    await createTestPackage('new', `
      export function existingFunction() {}
      export class NewClass {
        method() {}
      }
    `);

    const report = await analyzer.analyzePackage(testDir, '1.0.0', '1.1.0');

    expect(report.summary.additions).toBe(1);
    expect(report.changes).toContainEqual(
      expect.objectContaining({
        type: 'added',
        name: 'NewClass',
        category: 'class',
        details: expect.objectContaining({
          breaking: false,
          severity: 'minor'
        })
      })
    );
  });

  it('should detect function signature changes', async () => {
    await createTestPackage('old', `
      export function myFunction(a: string): void {}
    `);

    await createTestPackage('new', `
      export function myFunction(a: string, b: number): void {}
    `);

    const report = await analyzer.analyzePackage(testDir, '1.0.0', '2.0.0');

    expect(report.summary.modifications).toBe(1);
    expect(report.summary.breakingChanges).toBe(1);
    
    const change = report.changes.find(c => c.name === 'myFunction');
    expect(change?.type).toBe('modified');
    expect(change?.details.breaking).toBe(true);
    expect(change?.details.severity).toBe('major');
  });

  it('should detect interface member changes', async () => {
    await createTestPackage('old', `
      export interface MyInterface {
        oldProp: string;
        keepProp: number;
      }
    `);

    await createTestPackage('new', `
      export interface MyInterface {
        keepProp: number;
        newRequiredProp: boolean;
      }
    `);

    const report = await analyzer.analyzePackage(testDir, '1.0.0', '2.0.0');

    expect(report.summary.breakingChanges).toBe(1);
    
    const change = report.changes.find(c => c.name === 'MyInterface');
    expect(change?.details.breaking).toBe(true);
    expect(change?.details.migrationHint).toContain('removed');
  });

  it('should detect enum member changes', async () => {
    await createTestPackage('old', `
      export enum Status {
        Active,
        Inactive,
        Deleted
      }
    `);

    await createTestPackage('new', `
      export enum Status {
        Active,
        Inactive,
        Archived // Renamed from Deleted
      }
    `);

    const report = await analyzer.analyzePackage(testDir, '1.0.0', '2.0.0');

    expect(report.summary.breakingChanges).toBe(1);
    
    const change = report.changes.find(c => c.name === 'Status');
    expect(change?.details.breaking).toBe(true);
  });

  it('should generate migration steps', async () => {
    await createTestPackage('old', `
      export class OldClass {
        oldMethod() {}
      }
      
      export function removedFunction() {}
    `);

    await createTestPackage('new', `
      export class NewClass {
        newMethod() {}
      }
    `);

    const report = await analyzer.analyzePackage(testDir, '1.0.0', '2.0.0');

    expect(report.migrationSteps).toContain('1. Replace removed APIs:');
    expect(report.migrationSteps.some(s => s.includes('OldClass'))).toBe(true);
    expect(report.migrationSteps.some(s => s.includes('removedFunction'))).toBe(true);
  });

  it('should estimate migration effort', async () => {
    // Few changes - medium effort
    await createTestPackage('old', `
      export function func1() {}
      export function func2() {}
    `);

    await createTestPackage('new', `
      export function func3() {}
    `);

    const report = await analyzer.analyzePackage(testDir, '1.0.0', '2.0.0');
    expect(report.estimatedEffort).toBe('medium');
  });

  it('should generate markdown report', () => {
    const report = {
      package: 'test-package',
      fromVersion: '1.0.0',
      toVersion: '2.0.0',
      timestamp: new Date().toISOString(),
      summary: {
        totalChanges: 3,
        breakingChanges: 2,
        additions: 1,
        removals: 1,
        modifications: 1
      },
      changes: [
        {
          type: 'removed' as const,
          category: 'function' as const,
          name: 'oldFunction',
          path: 'src/index.ts',
          details: {
            before: 'function oldFunction(): void',
            breaking: true,
            severity: 'major' as const,
            migrationHint: 'Use newFunction instead'
          }
        }
      ],
      migrationSteps: ['1. Replace removed APIs'],
      estimatedEffort: 'medium' as const
    };

    const markdown = analyzer.generateMarkdownReport(report);

    expect(markdown).toContain('# Breaking Change Analysis Report');
    expect(markdown).toContain('test-package');
    expect(markdown).toContain('1.0.0 → 2.0.0');
    expect(markdown).toContain('Breaking changes: 2');
    expect(markdown).toContain('⚠️ Breaking Changes');
    expect(markdown).toContain('oldFunction');
  });
});