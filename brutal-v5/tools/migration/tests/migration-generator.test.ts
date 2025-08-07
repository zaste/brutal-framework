import { describe, it, expect, beforeEach } from '@jest/globals';
import { MigrationGenerator } from '../migration-generator.js';
import { BreakingChangeReport } from '../breaking-change-analyzer.js';
import { mkdir, writeFile, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('MigrationGenerator', () => {
  let generator: MigrationGenerator;
  let testDir: string;

  beforeEach(async () => {
    generator = new MigrationGenerator();
    testDir = join(tmpdir(), `migration-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  const createTestReport = (): BreakingChangeReport => ({
    package: '@brutal/test',
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
        type: 'removed',
        category: 'function',
        name: 'oldFunction',
        path: 'src/index.ts',
        details: {
          before: 'function oldFunction(param: string): void',
          breaking: true,
          severity: 'major',
          migrationHint: 'Use newFunction instead'
        }
      },
      {
        type: 'modified',
        category: 'function',
        name: 'updateFunction',
        path: 'src/utils.ts',
        details: {
          before: 'function updateFunction(a: string): void',
          after: 'function updateFunction(a: string, b: number): void',
          breaking: true,
          severity: 'major',
          migrationHint: 'Add second parameter'
        }
      }
    ],
    migrationSteps: [
      '1. Replace removed APIs',
      '2. Update function signatures',
      '3. Run tests'
    ],
    estimatedEffort: 'medium'
  });

  it('should generate migration script from report', () => {
    const report = createTestReport();
    const script = generator.generateMigrationScript(report);

    expect(script.name).toBe('migrate-@brutal/test-1.0.0-to-2.0.0');
    expect(script.fromVersion).toBe('1.0.0');
    expect(script.toVersion).toBe('2.0.0');
    expect(script.rules.length).toBeGreaterThan(0);
  });

  it('should generate removal rules', () => {
    const report = createTestReport();
    const script = generator.generateMigrationScript(report);
    
    const removalRule = script.rules.find(r => 
      r.pattern.includes('oldFunction')
    );

    expect(removalRule).toBeDefined();
    expect(removalRule?.pattern).toContain('\\boldFunction\\s*\\(');
    expect(removalRule?.replacement).toContain('TODO');
    expect(removalRule?.replacement).toContain('was removed');
  });

  it('should generate modification rules', () => {
    const report = createTestReport();
    const script = generator.generateMigrationScript(report);
    
    const modRule = script.rules.find(r => 
      r.description.includes('updateFunction')
    );

    expect(modRule).toBeDefined();
    expect(modRule?.pattern).toContain('updateFunction');
  });

  it('should include test cases in rules', () => {
    const report = createTestReport();
    const script = generator.generateMigrationScript(report);
    
    const ruleWithTest = script.rules.find(r => r.testCase);
    expect(ruleWithTest).toBeDefined();
    expect(ruleWithTest?.testCase?.before).toBeDefined();
    expect(ruleWithTest?.testCase?.after).toBeDefined();
  });

  it('should execute migration on files', async () => {
    // Create test file
    const testFile = join(testDir, 'test.ts');
    await writeFile(testFile, `
      import { oldFunction } from '@brutal/test';
      
      oldFunction('param');
    `);

    const script = {
      name: 'test-migration',
      description: 'Test migration',
      fromVersion: '1.0.0',
      toVersion: '2.0.0',
      rules: [{
        pattern: '\\boldFunction\\b',
        replacement: 'newFunction',
        description: 'Rename oldFunction to newFunction'
      }]
    };

    const result = await generator.executeMigration(script, testDir);

    expect(result.filesProcessed).toBe(1);
    expect(result.filesModified).toBe(1);
    expect(result.errors).toHaveLength(0);

    const content = await readFile(testFile, 'utf-8');
    expect(content).toContain('newFunction');
    expect(content).not.toContain('oldFunction');
  });

  it('should support dry run mode', async () => {
    const testFile = join(testDir, 'test.ts');
    const originalContent = `const x = oldFunction();`;
    await writeFile(testFile, originalContent);

    const script = {
      name: 'test-migration',
      description: 'Test migration',
      fromVersion: '1.0.0',
      toVersion: '2.0.0',
      rules: [{
        pattern: 'oldFunction',
        replacement: 'newFunction',
        description: 'Rename function'
      }]
    };

    const result = await generator.executeMigration(script, testDir, {
      dryRun: true
    });

    expect(result.filesModified).toBe(1);
    
    const content = await readFile(testFile, 'utf-8');
    expect(content).toBe(originalContent); // File unchanged
  });

  it('should respect file patterns', async () => {
    await writeFile(join(testDir, 'include.ts'), 'oldFunction()');
    await writeFile(join(testDir, 'exclude.ts'), 'oldFunction()');

    const script = {
      name: 'test-migration',
      description: 'Test migration',
      fromVersion: '1.0.0',
      toVersion: '2.0.0',
      rules: [{
        pattern: 'oldFunction',
        replacement: 'newFunction',
        description: 'Rename function',
        filePattern: 'include'
      }]
    };

    const result = await generator.executeMigration(script, testDir);

    const includeContent = await readFile(join(testDir, 'include.ts'), 'utf-8');
    const excludeContent = await readFile(join(testDir, 'exclude.ts'), 'utf-8');

    expect(includeContent).toContain('newFunction');
    expect(excludeContent).toContain('oldFunction');
  });

  it('should generate migration package', async () => {
    const report = createTestReport();
    const script = generator.generateMigrationScript(report);
    const outputPath = join(testDir, 'migration-package');

    await generator.generateMigrationPackage(script, outputPath);

    // Check generated files
    const packageJson = JSON.parse(
      await readFile(join(outputPath, 'package.json'), 'utf-8')
    );
    expect(packageJson.name).toBe(script.name);

    const readme = await readFile(join(outputPath, 'README.md'), 'utf-8');
    expect(readme).toContain('# migrate-@brutal/test-1.0.0-to-2.0.0');
    expect(readme).toContain('## Usage');
    expect(readme).toContain('## Migration Rules');

    const mainScript = await readFile(join(outputPath, 'migrate.js'), 'utf-8');
    expect(mainScript).toContain('#!/usr/bin/env node');
    expect(mainScript).toContain('MigrationExecutor');

    const tests = await readFile(join(outputPath, 'migrate.test.js'), 'utf-8');
    expect(tests).toContain('Running migration tests');
  });

  it('should handle complex function transformations', () => {
    const report: BreakingChangeReport = {
      ...createTestReport(),
      changes: [{
        type: 'modified',
        category: 'function',
        name: 'complexFunction',
        path: 'src/complex.ts',
        details: {
          before: 'function complexFunction(a: string, b: string): void',
          after: 'function complexFunction(a: string, b: number, c?: boolean): void',
          breaking: true,
          severity: 'major',
          migrationHint: 'Parameter types changed'
        }
      }]
    };

    const script = generator.generateMigrationScript(report);
    const rule = script.rules.find(r => r.description.includes('complexFunction'));

    expect(rule).toBeDefined();
    expect(typeof rule?.replacement).toBe('function');
  });
});