/**
 * Cross-Package Impact Analyzer for BRUTAL V5
 * 
 * Analyzes dependencies between packages to understand
 * the impact of changes across the ecosystem
 */

import * as ts from 'typescript';
import { readFile, readdir } from 'fs/promises';
import { join, relative } from 'path';
import { APISurface, APIExport } from './api-surface-tracker.js';

export interface PackageDependency {
  name: string;
  version: string;
  usage: UsagePoint[];
}

export interface UsagePoint {
  file: string;
  line: number;
  column: number;
  type: 'import' | 'require' | 'type-import';
  imports: string[];
  context?: string;
}

export interface ImpactAnalysis {
  package: string;
  version: string;
  change: {
    type: 'removal' | 'modification' | 'addition';
    export: string;
    details: string;
  };
  impact: {
    directDependents: PackageImpact[];
    transitiveDependents: PackageImpact[];
    totalAffected: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  recommendations: string[];
}

export interface PackageImpact {
  package: string;
  version: string;
  usageCount: number;
  files: string[];
  requiresUpdate: boolean;
  updateComplexity: 'trivial' | 'simple' | 'moderate' | 'complex';
}

export interface DependencyGraph {
  nodes: Map<string, PackageNode>;
  edges: Map<string, Set<string>>;
}

export interface PackageNode {
  name: string;
  version: string;
  path: string;
  dependencies: Map<string, string>;
  devDependencies: Map<string, string>;
  exports?: APISurface;
}

export class CrossPackageAnalyzer {
  private dependencyGraph: DependencyGraph = {
    nodes: new Map(),
    edges: new Map()
  };
  
  private usageCache: Map<string, Map<string, UsagePoint[]>> = new Map();

  async buildDependencyGraph(rootPath: string): Promise<DependencyGraph> {
    // Find all packages
    const packages = await this.findPackages(rootPath);
    
    // Build nodes
    for (const packagePath of packages) {
      const packageJson = JSON.parse(
        await readFile(join(packagePath, 'package.json'), 'utf-8')
      );
      
      const node: PackageNode = {
        name: packageJson.name,
        version: packageJson.version,
        path: packagePath,
        dependencies: new Map(Object.entries(packageJson.dependencies || {})),
        devDependencies: new Map(Object.entries(packageJson.devDependencies || {}))
      };
      
      this.dependencyGraph.nodes.set(packageJson.name, node);
    }
    
    // Build edges
    for (const [packageName, node] of this.dependencyGraph.nodes) {
      const edges = new Set<string>();
      
      // Add dependencies
      for (const dep of node.dependencies.keys()) {
        if (this.dependencyGraph.nodes.has(dep)) {
          edges.add(dep);
        }
      }
      
      // Add dev dependencies
      for (const dep of node.devDependencies.keys()) {
        if (this.dependencyGraph.nodes.has(dep)) {
          edges.add(dep);
        }
      }
      
      this.dependencyGraph.edges.set(packageName, edges);
    }
    
    return this.dependencyGraph;
  }

  async analyzeImpact(
    packageName: string,
    changeType: 'removal' | 'modification',
    exportName: string,
    details: string
  ): Promise<ImpactAnalysis> {
    const node = this.dependencyGraph.nodes.get(packageName);
    if (!node) {
      throw new Error(`Package ${packageName} not found in dependency graph`);
    }

    // Find direct dependents
    const directDependents = this.findDirectDependents(packageName);
    const directImpacts: PackageImpact[] = [];

    for (const dependent of directDependents) {
      const impact = await this.analyzePackageImpact(
        dependent,
        packageName,
        exportName,
        changeType
      );
      
      if (impact.usageCount > 0) {
        directImpacts.push(impact);
      }
    }

    // Find transitive dependents
    const transitiveDependents = this.findTransitiveDependents(packageName);
    const transitiveImpacts: PackageImpact[] = [];

    for (const dependent of transitiveDependents) {
      if (directDependents.has(dependent)) continue; // Skip direct dependents
      
      const impact = await this.analyzePackageImpact(
        dependent,
        packageName,
        exportName,
        changeType,
        true // indirect usage
      );
      
      if (impact.usageCount > 0) {
        transitiveImpacts.push(impact);
      }
    }

    const totalAffected = directImpacts.length + transitiveImpacts.length;
    const severity = this.calculateSeverity(changeType, directImpacts, transitiveImpacts);
    const recommendations = this.generateRecommendations(
      packageName,
      exportName,
      changeType,
      directImpacts,
      transitiveImpacts
    );

    return {
      package: packageName,
      version: node.version,
      change: {
        type: changeType,
        export: exportName,
        details
      },
      impact: {
        directDependents: directImpacts,
        transitiveDependents: transitiveImpacts,
        totalAffected,
        severity
      },
      recommendations
    };
  }

  private async analyzePackageImpact(
    dependentPackage: string,
    targetPackage: string,
    exportName: string,
    changeType: 'removal' | 'modification',
    indirect: boolean = false
  ): Promise<PackageImpact> {
    const node = this.dependencyGraph.nodes.get(dependentPackage)!;
    const usage = await this.findUsage(node.path, targetPackage, exportName);
    
    const requiresUpdate = changeType === 'removal' || 
                          (changeType === 'modification' && usage.length > 0);
    
    const updateComplexity = this.calculateUpdateComplexity(
      changeType,
      usage.length,
      indirect
    );

    return {
      package: dependentPackage,
      version: node.version,
      usageCount: usage.length,
      files: [...new Set(usage.map(u => u.file))],
      requiresUpdate,
      updateComplexity
    };
  }

  private async findUsage(
    packagePath: string,
    targetPackage: string,
    exportName: string
  ): Promise<UsagePoint[]> {
    const cacheKey = `${packagePath}:${targetPackage}`;
    
    if (!this.usageCache.has(cacheKey)) {
      const usage = await this.scanPackageForUsage(packagePath, targetPackage);
      this.usageCache.set(cacheKey, usage);
    }
    
    const packageUsage = this.usageCache.get(cacheKey)!;
    return packageUsage.get(exportName) || [];
  }

  private async scanPackageForUsage(
    packagePath: string,
    targetPackage: string
  ): Promise<Map<string, UsagePoint[]>> {
    const usageMap = new Map<string, UsagePoint[]>();
    const sourceFiles = await this.findSourceFiles(packagePath);
    
    for (const file of sourceFiles) {
      const content = await readFile(file, 'utf-8');
      const sourceFile = ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        true
      );
      
      // Find imports
      ts.forEachChild(sourceFile, node => {
        if (ts.isImportDeclaration(node)) {
          const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
          
          if (moduleSpecifier === targetPackage || 
              moduleSpecifier.startsWith(targetPackage + '/')) {
            const imports = this.extractImports(node);
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(
              node.getStart()
            );
            
            for (const imp of imports) {
              if (!usageMap.has(imp)) {
                usageMap.set(imp, []);
              }
              
              usageMap.get(imp)!.push({
                file: relative(packagePath, file),
                line: line + 1,
                column: character + 1,
                type: 'import',
                imports: [imp],
                context: node.getText()
              });
            }
            
            // Also scan for usage in the file
            this.scanForUsageInFile(
              sourceFile,
              imports,
              file,
              packagePath,
              usageMap
            );
          }
        }
      });
    }
    
    return usageMap;
  }

  private scanForUsageInFile(
    sourceFile: ts.SourceFile,
    imports: string[],
    filePath: string,
    packagePath: string,
    usageMap: Map<string, UsagePoint[]>
  ) {
    const visit = (node: ts.Node) => {
      if (ts.isIdentifier(node)) {
        const name = node.text;
        
        if (imports.includes(name)) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(
            node.getStart()
          );
          
          // Get parent for context
          let context = '';
          let parent = node.parent;
          while (parent && !ts.isStatement(parent)) {
            parent = parent.parent;
          }
          if (parent) {
            context = parent.getText().substring(0, 100);
          }
          
          if (!usageMap.has(name)) {
            usageMap.set(name, []);
          }
          
          usageMap.get(name)!.push({
            file: relative(packagePath, filePath),
            line: line + 1,
            column: character + 1,
            type: 'import',
            imports: [name],
            context
          });
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    ts.forEachChild(sourceFile, visit);
  }

  private extractImports(node: ts.ImportDeclaration): string[] {
    const imports: string[] = [];
    
    if (node.importClause) {
      // Default import
      if (node.importClause.name) {
        imports.push(node.importClause.name.text);
      }
      
      // Named imports
      if (node.importClause.namedBindings) {
        if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          imports.push(node.importClause.namedBindings.name.text);
        } else if (ts.isNamedImports(node.importClause.namedBindings)) {
          for (const element of node.importClause.namedBindings.elements) {
            imports.push(element.name.text);
          }
        }
      }
    }
    
    return imports;
  }

  private findDirectDependents(packageName: string): Set<string> {
    const dependents = new Set<string>();
    
    for (const [pkg, edges] of this.dependencyGraph.edges) {
      if (edges.has(packageName)) {
        dependents.add(pkg);
      }
    }
    
    return dependents;
  }

  private findTransitiveDependents(
    packageName: string,
    visited: Set<string> = new Set()
  ): Set<string> {
    const allDependents = new Set<string>();
    const directDependents = this.findDirectDependents(packageName);
    
    for (const dependent of directDependents) {
      if (!visited.has(dependent)) {
        visited.add(dependent);
        allDependents.add(dependent);
        
        // Recursively find dependents of dependents
        const transitive = this.findTransitiveDependents(dependent, visited);
        for (const t of transitive) {
          allDependents.add(t);
        }
      }
    }
    
    return allDependents;
  }

  private calculateSeverity(
    changeType: 'removal' | 'modification',
    directImpacts: PackageImpact[],
    transitiveImpacts: PackageImpact[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    const totalUsage = directImpacts.reduce((sum, i) => sum + i.usageCount, 0) +
                      transitiveImpacts.reduce((sum, i) => sum + i.usageCount, 0);
    
    if (changeType === 'removal') {
      if (totalUsage > 100) return 'critical';
      if (totalUsage > 50) return 'high';
      if (totalUsage > 10) return 'medium';
      return 'low';
    } else {
      if (totalUsage > 200) return 'high';
      if (totalUsage > 50) return 'medium';
      return 'low';
    }
  }

  private calculateUpdateComplexity(
    changeType: 'removal' | 'modification',
    usageCount: number,
    indirect: boolean
  ): 'trivial' | 'simple' | 'moderate' | 'complex' {
    if (indirect) {
      return usageCount > 10 ? 'complex' : 'moderate';
    }
    
    if (changeType === 'removal') {
      if (usageCount > 50) return 'complex';
      if (usageCount > 10) return 'moderate';
      return 'simple';
    } else {
      if (usageCount > 100) return 'complex';
      if (usageCount > 20) return 'moderate';
      if (usageCount > 5) return 'simple';
      return 'trivial';
    }
  }

  private generateRecommendations(
    packageName: string,
    exportName: string,
    changeType: 'removal' | 'modification',
    directImpacts: PackageImpact[],
    transitiveImpacts: PackageImpact[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (changeType === 'removal') {
      recommendations.push(
        `Consider deprecating '${exportName}' first before removal`
      );
      
      if (directImpacts.length > 0) {
        recommendations.push(
          `Provide migration guide for ${directImpacts.length} direct dependents`
        );
      }
      
      if (directImpacts.some(i => i.usageCount > 20)) {
        recommendations.push(
          'Create automated migration tool due to high usage'
        );
      }
    }
    
    if (directImpacts.length > 5) {
      recommendations.push(
        'Send advance notice to dependent package maintainers'
      );
    }
    
    if (transitiveImpacts.length > 10) {
      recommendations.push(
        `Consider phased rollout - ${transitiveImpacts.length} packages indirectly affected`
      );
    }
    
    const complexUpdates = directImpacts.filter(
      i => i.updateComplexity === 'complex'
    );
    
    if (complexUpdates.length > 0) {
      recommendations.push(
        `Provide extra support for complex updates: ${
          complexUpdates.map(u => u.package).join(', ')
        }`
      );
    }
    
    return recommendations;
  }

  private async findPackages(rootPath: string): Promise<string[]> {
    const packages: string[] = [];
    
    const scanDir = async (dir: string) => {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = join(dir, entry.name);
          
          // Check if it's a package
          try {
            await readFile(join(fullPath, 'package.json'));
            packages.push(fullPath);
          } catch {
            // Not a package, scan subdirectories
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
              await scanDir(fullPath);
            }
          }
        }
      }
    };
    
    await scanDir(rootPath);
    return packages;
  }

  private async findSourceFiles(packagePath: string): Promise<string[]> {
    const files: string[] = [];
    const srcPath = join(packagePath, 'src');
    
    const scanDir = async (dir: string) => {
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            await scanDir(fullPath);
          } else if (
            entry.isFile() && 
            (entry.name.endsWith('.ts') || 
             entry.name.endsWith('.tsx') ||
             entry.name.endsWith('.js') ||
             entry.name.endsWith('.jsx'))
          ) {
            files.push(fullPath);
          }
        }
      } catch {
        // Directory doesn't exist
      }
    };
    
    await scanDir(srcPath);
    return files;
  }

  generateImpactReport(analysis: ImpactAnalysis): string {
    let md = `# Cross-Package Impact Analysis\n\n`;
    md += `Package: **${analysis.package}** v${analysis.version}\n`;
    md += `Change: ${analysis.change.type} of \`${analysis.change.export}\`\n`;
    md += `Details: ${analysis.change.details}\n\n`;
    
    // Summary
    md += `## Impact Summary\n\n`;
    md += `- **Severity**: ${analysis.impact.severity}\n`;
    md += `- **Total affected packages**: ${analysis.impact.totalAffected}\n`;
    md += `- **Direct dependents**: ${analysis.impact.directDependents.length}\n`;
    md += `- **Transitive dependents**: ${analysis.impact.transitiveDependents.length}\n\n`;
    
    // Recommendations
    if (analysis.recommendations.length > 0) {
      md += `## Recommendations\n\n`;
      analysis.recommendations.forEach(r => md += `- ${r}\n`);
      md += '\n';
    }
    
    // Direct impacts
    if (analysis.impact.directDependents.length > 0) {
      md += `## Direct Dependents\n\n`;
      md += `| Package | Version | Usage Count | Files | Update Complexity |\n`;
      md += `|---------|---------|-------------|-------|------------------|\n`;
      
      for (const impact of analysis.impact.directDependents) {
        md += `| ${impact.package} | ${impact.version} | ${impact.usageCount} | ${impact.files.length} | ${impact.updateComplexity} |\n`;
      }
      md += '\n';
    }
    
    // Transitive impacts
    if (analysis.impact.transitiveDependents.length > 0) {
      md += `## Transitive Dependents\n\n`;
      md += `| Package | Version | Usage Count | Update Complexity |\n`;
      md += `|---------|---------|-------------|------------------|\n`;
      
      for (const impact of analysis.impact.transitiveDependents) {
        md += `| ${impact.package} | ${impact.version} | ${impact.usageCount} | ${impact.updateComplexity} |\n`;
      }
    }
    
    return md;
  }

  generateDependencyGraphVisualization(graph: DependencyGraph): string {
    let mermaid = 'graph TD\n';
    
    // Add nodes
    for (const [name, node] of graph.nodes) {
      const label = `${name}\\nv${node.version}`;
      mermaid += `  ${name.replace(/[@/]/g, '_')}["${label}"]\n`;
    }
    
    mermaid += '\n';
    
    // Add edges
    for (const [from, edges] of graph.edges) {
      for (const to of edges) {
        mermaid += `  ${from.replace(/[@/]/g, '_')} --> ${to.replace(/[@/]/g, '_')}\n`;
      }
    }
    
    return mermaid;
  }
}