import { describe, it, expect, beforeEach } from '@jest/globals';
import { CrossPackageAnalyzer } from '../cross-package-analyzer.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('CrossPackageAnalyzer', () => {
  let analyzer: CrossPackageAnalyzer;
  let testDir: string;

  beforeEach(async () => {
    analyzer = new CrossPackageAnalyzer();
    testDir = join(tmpdir(), `cross-package-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  async function createPackage(
    name: string,
    dependencies: Record<string, string> = {},
    sourceFiles: Record<string, string> = {}
  ) {
    const packageDir = join(testDir, 'packages', name);
    const srcDir = join(packageDir, 'src');
    await mkdir(srcDir, { recursive: true });

    await writeFile(
      join(packageDir, 'package.json'),
      JSON.stringify({
        name: `@brutal/${name}`,
        version: '1.0.0',
        dependencies
      }, null, 2)
    );

    for (const [file, content] of Object.entries(sourceFiles)) {
      await writeFile(join(srcDir, file), content);
    }
  }

  it('should build dependency graph', async () => {
    await createPackage('core');
    await createPackage('utils', {
      '@brutal/core': '1.0.0'
    });
    await createPackage('components', {
      '@brutal/core': '1.0.0',
      '@brutal/utils': '1.0.0'
    });

    const graph = await analyzer.buildDependencyGraph(testDir);

    expect(graph.nodes.size).toBe(3);
    expect(graph.nodes.has('@brutal/core')).toBe(true);
    expect(graph.nodes.has('@brutal/utils')).toBe(true);
    expect(graph.nodes.has('@brutal/components')).toBe(true);

    const componentEdges = graph.edges.get('@brutal/components');
    expect(componentEdges?.has('@brutal/core')).toBe(true);
    expect(componentEdges?.has('@brutal/utils')).toBe(true);
  });

  it('should find direct dependents', async () => {
    await createPackage('base');
    await createPackage('dep1', { '@brutal/base': '1.0.0' });
    await createPackage('dep2', { '@brutal/base': '1.0.0' });
    await createPackage('unrelated');

    await analyzer.buildDependencyGraph(testDir);
    
    // Use private method through reflection for testing
    const dependents = (analyzer as any).findDirectDependents('@brutal/base');
    
    expect(dependents.size).toBe(2);
    expect(dependents.has('@brutal/dep1')).toBe(true);
    expect(dependents.has('@brutal/dep2')).toBe(true);
  });

  it('should find transitive dependents', async () => {
    await createPackage('base');
    await createPackage('middle', { '@brutal/base': '1.0.0' });
    await createPackage('top', { '@brutal/middle': '1.0.0' });

    await analyzer.buildDependencyGraph(testDir);
    
    const transitive = (analyzer as any).findTransitiveDependents('@brutal/base');
    
    expect(transitive.has('@brutal/middle')).toBe(true);
    expect(transitive.has('@brutal/top')).toBe(true);
  });

  it('should analyze impact of removal', async () => {
    await createPackage('shared', {}, {
      'index.ts': `
        export function sharedFunction() {}
        export class SharedClass {}
      `
    });

    await createPackage('consumer', {
      '@brutal/shared': '1.0.0'
    }, {
      'index.ts': `
        import { sharedFunction } from '@brutal/shared';
        
        export function useShared() {
          sharedFunction();
        }
      `
    });

    await analyzer.buildDependencyGraph(testDir);
    
    const impact = await analyzer.analyzeImpact(
      '@brutal/shared',
      'removal',
      'sharedFunction',
      'Function will be removed in v2.0'
    );

    expect(impact.impact.totalAffected).toBeGreaterThan(0);
    expect(impact.impact.directDependents).toHaveLength(1);
    expect(impact.impact.directDependents[0].package).toBe('@brutal/consumer');
    expect(impact.impact.directDependents[0].usageCount).toBeGreaterThan(0);
    expect(impact.impact.severity).toBe('low'); // Only 1 usage
  });

  it('should track usage points', async () => {
    await createPackage('lib', {}, {
      'index.ts': `
        export function func1() {}
        export function func2() {}
        export const constant = 42;
      `
    });

    await createPackage('app', {
      '@brutal/lib': '1.0.0'
    }, {
      'main.ts': `
        import { func1, constant } from '@brutal/lib';
        
        func1();
        console.log(constant);
      `,
      'utils.ts': `
        import { func2 } from '@brutal/lib';
        
        export function wrapper() {
          func2();
          func2(); // Used twice
        }
      `
    });

    await analyzer.buildDependencyGraph(testDir);
    
    const usage = await (analyzer as any).findUsage(
      join(testDir, 'packages', 'app'),
      '@brutal/lib',
      'func2'
    );

    expect(usage.length).toBeGreaterThan(0);
    expect(usage[0].file).toContain('utils.ts');
    expect(usage[0].imports).toContain('func2');
  });

  it('should calculate severity based on usage', async () => {
    // Create a simple package structure first
    await createPackage('core');
    await analyzer.buildDependencyGraph(testDir);
    
    // Mock heavy usage scenario
    const mockImpact = await analyzer.analyzeImpact(
      '@brutal/core',
      'removal',
      'criticalFunction',
      'Critical function removal'
    );

    // Manually set high usage for testing
    mockImpact.impact.directDependents = Array(15).fill(null).map((_, i) => ({
      package: `@brutal/dep${i}`,
      version: '1.0.0',
      usageCount: 10,
      files: ['index.ts'],
      requiresUpdate: true,
      updateComplexity: 'moderate' as const
    }));

    const severity = (analyzer as any).calculateSeverity(
      'removal',
      mockImpact.impact.directDependents,
      []
    );

    expect(severity).toBe('critical'); // >100 total usage
  });

  it('should generate impact report', () => {
    const analysis = {
      package: '@brutal/core',
      version: '1.0.0',
      change: {
        type: 'removal' as const,
        export: 'deprecatedAPI',
        details: 'API will be removed in v2.0'
      },
      impact: {
        directDependents: [
          {
            package: '@brutal/ui',
            version: '1.0.0',
            usageCount: 5,
            files: ['button.ts', 'form.ts'],
            requiresUpdate: true,
            updateComplexity: 'simple' as const
          }
        ],
        transitiveDependents: [],
        totalAffected: 1,
        severity: 'medium' as const
      },
      recommendations: [
        'Consider deprecating first',
        'Provide migration guide'
      ]
    };

    const report = analyzer.generateImpactReport(analysis);

    expect(report).toContain('# Cross-Package Impact Analysis');
    expect(report).toContain('deprecatedAPI');
    expect(report).toContain('Severity**: medium');
    expect(report).toContain('@brutal/ui');
    expect(report).toContain('| 5 |');
  });

  it('should generate dependency graph visualization', async () => {
    await createPackage('a');
    await createPackage('b', { '@brutal/a': '1.0.0' });
    await createPackage('c', { 
      '@brutal/a': '1.0.0',
      '@brutal/b': '1.0.0'
    });

    const graph = await analyzer.buildDependencyGraph(testDir);
    const viz = analyzer.generateDependencyGraphVisualization(graph);

    expect(viz).toContain('graph TD');
    expect(viz).toContain('_brutal_a');
    expect(viz).toContain('_brutal_b');
    expect(viz).toContain('_brutal_c');
    expect(viz).toContain('-->'); // Edges
  });

  it('should provide recommendations based on impact', async () => {
    await createPackage('widely-used');
    
    // Create many dependents
    for (let i = 0; i < 10; i++) {
      await createPackage(`dep${i}`, { '@brutal/widely-used': '1.0.0' });
    }

    await analyzer.buildDependencyGraph(testDir);
    
    const impact = await analyzer.analyzeImpact(
      '@brutal/widely-used',
      'removal',
      'popularFunction',
      'Function will be removed'
    );

    // Check that at least one recommendation contains 'deprecating'
    const hasDeprecatingRecommendation = impact.recommendations.some(
      r => r.includes('deprecating')
    );
    expect(hasDeprecatingRecommendation).toBe(true);
  });
});