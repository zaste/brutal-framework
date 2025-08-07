/**
 * Breaking Change Analyzer for BRUTAL V5
 * 
 * Automatically detects breaking changes between package versions
 * by analyzing API surfaces, types, and behavioral changes
 */

import * as ts from 'typescript';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface APIChange {
  type: 'added' | 'removed' | 'modified' | 'renamed';
  category: 'class' | 'interface' | 'function' | 'type' | 'enum' | 'const' | 'export';
  name: string;
  path: string;
  details: {
    before?: string;
    after?: string;
    signature?: string;
    breaking: boolean;
    severity: 'major' | 'minor' | 'patch';
    migrationHint?: string;
  };
}

export interface BreakingChangeReport {
  package: string;
  fromVersion: string;
  toVersion: string;
  timestamp: string;
  summary: {
    totalChanges: number;
    breakingChanges: number;
    additions: number;
    removals: number;
    modifications: number;
  };
  changes: APIChange[];
  migrationSteps: string[];
  estimatedEffort: 'low' | 'medium' | 'high';
}

export class BreakingChangeAnalyzer {
  private program: ts.Program | null = null;
  private checker: ts.TypeChecker | null = null;

  async analyzePackage(
    packagePath: string,
    oldVersion: string,
    newVersion: string
  ): Promise<BreakingChangeReport> {
    // Get API surfaces for both versions
    const oldAPI = await this.extractAPISurface(join(packagePath, 'old', 'src'));
    const newAPI = await this.extractAPISurface(join(packagePath, 'new', 'src'));

    // Compare APIs
    const changes = this.compareAPIs(oldAPI, newAPI);

    // Generate report
    return this.generateReport(
      packagePath.split('/').pop() || 'unknown',
      oldVersion,
      newVersion,
      changes
    );
  }

  private async extractAPISurface(sourcePath: string): Promise<Map<string, APIDefinition>> {
    const apiSurface = new Map<string, APIDefinition>();

    // Create TypeScript program
    const configPath = ts.findConfigFile(sourcePath, ts.sys.fileExists, 'tsconfig.json');
    let compilerOptions: ts.CompilerOptions;
    
    if (configPath) {
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        sourcePath
      );
      compilerOptions = {
        ...parsedConfig.options,
        declaration: true,
        emitDeclarationOnly: true,
        allowJs: true,
        checkJs: false,
      };
    } else {
      // Default compiler options if no tsconfig.json
      compilerOptions = {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        lib: ["lib.es2020.d.ts"],
        declaration: true,
        emitDeclarationOnly: true,
        allowJs: true,
        checkJs: false,
      };
    }

    // Find all TypeScript files
    const sourceFiles: string[] = [];
    const findFiles = async (dir: string) => {
      try {
        const { readdir } = await import('fs/promises');
        const entries = await readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            await findFiles(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            sourceFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Directory doesn't exist
      }
    };

    await findFiles(sourcePath);

    if (sourceFiles.length === 0) {
      return apiSurface;
    }

    // Create program and type checker
    this.program = ts.createProgram(sourceFiles, compilerOptions);
    this.checker = this.program.getTypeChecker();

    // Extract API from each source file
    for (const sourceFile of this.program.getSourceFiles()) {
      if (sourceFile.isDeclarationFile) continue;
      
      ts.forEachChild(sourceFile, (node) => {
        this.visitNode(node, sourceFile, apiSurface);
      });
    }

    return apiSurface;
  }

  private visitNode(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    apiSurface: Map<string, APIDefinition>
  ) {
    // Only process exported declarations
    if (!this.isExported(node)) return;

    const symbol = this.checker?.getSymbolAtLocation(
      (node as any).name || node
    );

    if (!symbol) return;

    const name = symbol.getName();
    const type = this.checker!.typeToString(
      this.checker!.getTypeOfSymbolAtLocation(symbol, node)
    );

    // Extract API definition based on node kind
    let apiDef: APIDefinition | null = null;

    if (ts.isClassDeclaration(node)) {
      apiDef = this.extractClassAPI(node, name, type);
    } else if (ts.isInterfaceDeclaration(node)) {
      apiDef = this.extractInterfaceAPI(node, name, type);
    } else if (ts.isFunctionDeclaration(node)) {
      apiDef = this.extractFunctionAPI(node, name, type);
    } else if (ts.isTypeAliasDeclaration(node)) {
      apiDef = this.extractTypeAPI(node, name, type);
    } else if (ts.isEnumDeclaration(node)) {
      apiDef = this.extractEnumAPI(node, name);
    } else if (ts.isVariableStatement(node)) {
      apiDef = this.extractConstAPI(node, name, type);
    }

    if (apiDef) {
      apiDef.path = sourceFile.fileName;
      apiSurface.set(name, apiDef);
    }
  }

  private isExported(node: ts.Node): boolean {
    // Check if the node has export modifier
    if (ts.canHaveModifiers(node)) {
      const modifiers = ts.getCombinedModifierFlags(node as ts.Declaration);
      if (modifiers & ts.ModifierFlags.Export) {
        return true;
      }
    }
    
    // Check if it's a top-level declaration with export keyword
    if (node.parent && ts.isSourceFile(node.parent)) {
      // For export declarations like "export { ... }"
      const sourceFile = node.parent;
      for (const statement of sourceFile.statements) {
        if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
          for (const element of statement.exportClause.elements) {
            const exportedName = element.propertyName?.text || element.name.text;
            if ((node as any).name?.text === exportedName) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  }

  private extractClassAPI(
    node: ts.ClassDeclaration,
    name: string,
    type: string
  ): APIDefinition {
    const members: MemberDefinition[] = [];

    node.members.forEach(member => {
      if (this.isPublicMember(member)) {
        const memberName = (member.name as ts.Identifier)?.text || '';
        const memberType = this.getMemberType(member);
        
        members.push({
          name: memberName,
          type: memberType,
          kind: this.getMemberKind(member),
          optional: !!(member as any).questionToken,
          static: !!(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static)
        });
      }
    });

    return {
      category: 'class',
      name,
      type,
      members,
      extends: this.getExtends(node),
      implements: this.getImplements(node)
    };
  }

  private extractInterfaceAPI(
    node: ts.InterfaceDeclaration,
    name: string,
    type: string
  ): APIDefinition {
    const members: MemberDefinition[] = [];

    node.members.forEach(member => {
      const memberName = (member.name as ts.Identifier)?.text || '';
      const memberType = this.getMemberType(member);
      
      members.push({
        name: memberName,
        type: memberType,
        kind: 'property',
        optional: !!(member as any).questionToken,
        static: false
      });
    });

    return {
      category: 'interface',
      name,
      type,
      members,
      extends: this.getExtends(node)
    };
  }

  private extractFunctionAPI(
    node: ts.FunctionDeclaration,
    name: string,
    type: string
  ): APIDefinition {
    const signature = this.getFunctionSignature(node);
    
    return {
      category: 'function',
      name,
      type,
      signature,
      parameters: this.getParameters(node),
      returnType: this.getReturnType(node)
    };
  }

  private extractTypeAPI(
    node: ts.TypeAliasDeclaration,
    name: string,
    type: string
  ): APIDefinition {
    return {
      category: 'type',
      name,
      type,
      definition: node.type ? this.checker!.typeToString(
        this.checker!.getTypeFromTypeNode(node.type)
      ) : type
    };
  }

  private extractEnumAPI(
    node: ts.EnumDeclaration,
    name: string
  ): APIDefinition {
    const members: string[] = [];
    
    node.members.forEach(member => {
      members.push((member.name as ts.Identifier).text);
    });

    return {
      category: 'enum',
      name,
      type: 'enum',
      enumMembers: members
    };
  }

  private extractConstAPI(
    node: ts.VariableStatement,
    name: string,
    type: string
  ): APIDefinition {
    return {
      category: 'const',
      name,
      type,
      value: this.getConstValue(node)
    };
  }

  private compareAPIs(
    oldAPI: Map<string, APIDefinition>,
    newAPI: Map<string, APIDefinition>
  ): APIChange[] {
    const changes: APIChange[] = [];

    // Check for removals and modifications
    for (const [name, oldDef] of oldAPI) {
      const newDef = newAPI.get(name);
      
      if (!newDef) {
        // Removed
        changes.push({
          type: 'removed',
          category: oldDef.category,
          name,
          path: oldDef.path || '',
          details: {
            before: this.serializeDefinition(oldDef),
            breaking: true,
            severity: 'major',
            migrationHint: `${name} has been removed. Look for alternative APIs or migration guides.`
          }
        });
      } else if (!this.areDefinitionsEqual(oldDef, newDef)) {
        // Modified
        const breakingDetails = this.analyzeBreakingChange(oldDef, newDef);
        changes.push({
          type: 'modified',
          category: oldDef.category,
          name,
          path: newDef.path || '',
          details: {
            before: this.serializeDefinition(oldDef),
            after: this.serializeDefinition(newDef),
            ...breakingDetails
          }
        });
      }
    }

    // Check for additions
    for (const [name, newDef] of newAPI) {
      if (!oldAPI.has(name)) {
        changes.push({
          type: 'added',
          category: newDef.category,
          name,
          path: newDef.path || '',
          details: {
            after: this.serializeDefinition(newDef),
            breaking: false,
            severity: 'minor'
          }
        });
      }
    }

    return changes;
  }

  private analyzeBreakingChange(
    oldDef: APIDefinition,
    newDef: APIDefinition
  ): { breaking: boolean; severity: 'major' | 'minor' | 'patch'; migrationHint?: string } {
    // Different categories are always breaking
    if (oldDef.category !== newDef.category) {
      return {
        breaking: true,
        severity: 'major',
        migrationHint: `Type changed from ${oldDef.category} to ${newDef.category}. Complete refactor required.`
      };
    }

    switch (oldDef.category) {
      case 'class':
      case 'interface':
        return this.analyzeClassOrInterfaceChange(oldDef, newDef);
      
      case 'function':
        return this.analyzeFunctionChange(oldDef, newDef);
      
      case 'type':
        return this.analyzeTypeChange(oldDef, newDef);
      
      case 'enum':
        return this.analyzeEnumChange(oldDef, newDef);
      
      default:
        return { breaking: false, severity: 'patch' };
    }
  }

  private analyzeClassOrInterfaceChange(
    oldDef: APIDefinition,
    newDef: APIDefinition
  ): { breaking: boolean; severity: 'major' | 'minor' | 'patch'; migrationHint?: string } {
    const oldMembers = new Map(oldDef.members?.map(m => [m.name, m]) || []);
    const newMembers = new Map(newDef.members?.map(m => [m.name, m]) || []);
    
    // Check for removed members (breaking)
    for (const [name, oldMember] of oldMembers) {
      if (!newMembers.has(name)) {
        return {
          breaking: true,
          severity: 'major',
          migrationHint: `Member '${name}' was removed. Update all usages.`
        };
      }
    }

    // Check for type changes in members (potentially breaking)
    for (const [name, oldMember] of oldMembers) {
      const newMember = newMembers.get(name);
      if (newMember && oldMember.type !== newMember.type) {
        return {
          breaking: true,
          severity: 'major',
          migrationHint: `Member '${name}' type changed from '${oldMember.type}' to '${newMember.type}'.`
        };
      }
    }

    // Check for new required members (breaking for interfaces)
    if (oldDef.category === 'interface') {
      for (const [name, newMember] of newMembers) {
        if (!oldMembers.has(name) && !newMember.optional) {
          return {
            breaking: true,
            severity: 'major',
            migrationHint: `New required member '${name}' added. All implementations must be updated.`
          };
        }
      }
    }

    // New optional members or new methods in classes are non-breaking
    return { breaking: false, severity: 'minor' };
  }

  private analyzeFunctionChange(
    oldDef: APIDefinition,
    newDef: APIDefinition
  ): { breaking: boolean; severity: 'major' | 'minor' | 'patch'; migrationHint?: string } {
    // Check parameter count
    const oldParams = oldDef.parameters || [];
    const newParams = newDef.parameters || [];
    
    if (oldParams.length > newParams.length) {
      return {
        breaking: true,
        severity: 'major',
        migrationHint: 'Function parameters removed. Update all calls.'
      };
    }

    // Check for new required parameters
    if (newParams.length > oldParams.length) {
      const newRequired = newParams.slice(oldParams.length).filter(p => !p.optional);
      if (newRequired.length > 0) {
        return {
          breaking: true,
          severity: 'major',
          migrationHint: `New required parameters added: ${newRequired.map(p => p.name).join(', ')}`
        };
      }
    }

    // Check return type change
    if (oldDef.returnType !== newDef.returnType) {
      return {
        breaking: true,
        severity: 'major',
        migrationHint: `Return type changed from '${oldDef.returnType}' to '${newDef.returnType}'.`
      };
    }

    return { breaking: false, severity: 'patch' };
  }

  private analyzeTypeChange(
    oldDef: APIDefinition,
    newDef: APIDefinition
  ): { breaking: boolean; severity: 'major' | 'minor' | 'patch'; migrationHint?: string } {
    if (oldDef.definition !== newDef.definition) {
      // Simple check - in reality would need more sophisticated type compatibility checking
      return {
        breaking: true,
        severity: 'major',
        migrationHint: 'Type definition changed. Review all usages.'
      };
    }
    return { breaking: false, severity: 'patch' };
  }

  private analyzeEnumChange(
    oldDef: APIDefinition,
    newDef: APIDefinition
  ): { breaking: boolean; severity: 'major' | 'minor' | 'patch'; migrationHint?: string } {
    const oldMembers = new Set(oldDef.enumMembers || []);
    const newMembers = new Set(newDef.enumMembers || []);
    
    // Removed enum members are breaking
    for (const member of oldMembers) {
      if (!newMembers.has(member)) {
        return {
          breaking: true,
          severity: 'major',
          migrationHint: `Enum member '${member}' was removed.`
        };
      }
    }

    // Added enum members are non-breaking
    return { breaking: false, severity: 'minor' };
  }

  private generateReport(
    packageName: string,
    fromVersion: string,
    toVersion: string,
    changes: APIChange[]
  ): BreakingChangeReport {
    const breakingChanges = changes.filter(c => c.details.breaking);
    
    const summary = {
      totalChanges: changes.length,
      breakingChanges: breakingChanges.length,
      additions: changes.filter(c => c.type === 'added').length,
      removals: changes.filter(c => c.type === 'removed').length,
      modifications: changes.filter(c => c.type === 'modified').length
    };

    const migrationSteps = this.generateMigrationSteps(breakingChanges);
    const estimatedEffort = this.estimateEffort(breakingChanges);

    return {
      package: packageName,
      fromVersion,
      toVersion,
      timestamp: new Date().toISOString(),
      summary,
      changes,
      migrationSteps,
      estimatedEffort
    };
  }

  private generateMigrationSteps(breakingChanges: APIChange[]): string[] {
    const steps: string[] = [];
    
    // Group by change type
    const removals = breakingChanges.filter(c => c.type === 'removed');
    const modifications = breakingChanges.filter(c => c.type === 'modified');
    
    if (removals.length > 0) {
      steps.push('1. Replace removed APIs:');
      removals.forEach(change => {
        steps.push(`   - ${change.name}: ${change.details.migrationHint}`);
      });
    }
    
    if (modifications.length > 0) {
      steps.push(`${steps.length + 1}. Update modified APIs:`);
      modifications.forEach(change => {
        steps.push(`   - ${change.name}: ${change.details.migrationHint}`);
      });
    }
    
    steps.push(`${steps.length + 1}. Run tests to verify all changes`);
    steps.push(`${steps.length + 1}. Update documentation`);
    
    return steps;
  }

  private estimateEffort(breakingChanges: APIChange[]): 'low' | 'medium' | 'high' {
    if (breakingChanges.length === 0) return 'low';
    if (breakingChanges.length <= 5) return 'medium';
    return 'high';
  }

  // Helper methods
  private isPublicMember(member: ts.ClassElement): boolean {
    const modifiers = ts.getCombinedModifierFlags(member);
    return !(modifiers & ts.ModifierFlags.Private) && 
           !(modifiers & ts.ModifierFlags.Protected);
  }

  private getMemberType(member: ts.Node): string {
    if (this.checker && (member as any).type) {
      return this.checker.typeToString(
        this.checker.getTypeFromTypeNode((member as any).type)
      );
    }
    return 'unknown';
  }

  private getMemberKind(member: ts.ClassElement): 'property' | 'method' | 'getter' | 'setter' {
    if (ts.isMethodDeclaration(member)) return 'method';
    if (ts.isGetAccessor(member)) return 'getter';
    if (ts.isSetAccessor(member)) return 'setter';
    return 'property';
  }

  private getExtends(node: ts.ClassDeclaration | ts.InterfaceDeclaration): string[] {
    if (!node.heritageClauses) return [];
    
    const extendsClause = node.heritageClauses.find(
      clause => clause.token === ts.SyntaxKind.ExtendsKeyword
    );
    
    if (!extendsClause) return [];
    
    return extendsClause.types.map(type => type.expression.getText());
  }

  private getImplements(node: ts.ClassDeclaration): string[] {
    if (!node.heritageClauses) return [];
    
    const implementsClause = node.heritageClauses.find(
      clause => clause.token === ts.SyntaxKind.ImplementsKeyword
    );
    
    if (!implementsClause) return [];
    
    return implementsClause.types.map(type => type.expression.getText());
  }

  private getFunctionSignature(node: ts.FunctionDeclaration): string {
    return node.getText();
  }

  private getParameters(node: ts.FunctionDeclaration): ParameterDefinition[] {
    return node.parameters.map(param => ({
      name: (param.name as ts.Identifier).text,
      type: param.type ? this.checker!.typeToString(
        this.checker!.getTypeFromTypeNode(param.type)
      ) : 'any',
      optional: !!param.questionToken,
      hasDefault: !!param.initializer
    }));
  }

  private getReturnType(node: ts.FunctionDeclaration): string {
    if (node.type && this.checker) {
      return this.checker.typeToString(
        this.checker.getTypeFromTypeNode(node.type)
      );
    }
    return 'void';
  }

  private getConstValue(node: ts.VariableStatement): string {
    const declaration = node.declarationList.declarations[0];
    return declaration.initializer?.getText() || 'undefined';
  }

  private serializeDefinition(def: APIDefinition): string {
    switch (def.category) {
      case 'class':
      case 'interface':
        return `${def.category} ${def.name} { ${def.members?.length || 0} members }`;
      case 'function':
        return def.signature || `function ${def.name}()`;
      case 'type':
        return `type ${def.name} = ${def.definition}`;
      case 'enum':
        return `enum ${def.name} { ${def.enumMembers?.join(', ')} }`;
      default:
        return `${def.category} ${def.name}`;
    }
  }

  private areDefinitionsEqual(def1: APIDefinition, def2: APIDefinition): boolean {
    // Simple equality check - could be more sophisticated
    return this.serializeDefinition(def1) === this.serializeDefinition(def2);
  }

  generateMarkdownReport(report: BreakingChangeReport): string {
    let md = `# Breaking Change Analysis Report\n\n`;
    md += `Package: **${report.package}**\n`;
    md += `Version: ${report.fromVersion} → ${report.toVersion}\n`;
    md += `Generated: ${report.timestamp}\n\n`;

    // Summary
    md += `## Summary\n\n`;
    md += `- Total changes: ${report.summary.totalChanges}\n`;
    md += `- **Breaking changes: ${report.summary.breakingChanges}**\n`;
    md += `- Additions: ${report.summary.additions}\n`;
    md += `- Removals: ${report.summary.removals}\n`;
    md += `- Modifications: ${report.summary.modifications}\n`;
    md += `- Estimated effort: **${report.estimatedEffort}**\n\n`;

    // Breaking changes
    if (report.summary.breakingChanges > 0) {
      md += `## ⚠️ Breaking Changes\n\n`;
      
      const breakingChanges = report.changes.filter(c => c.details.breaking);
      for (const change of breakingChanges) {
        md += `### ${change.name}\n`;
        md += `- **Type**: ${change.type} ${change.category}\n`;
        md += `- **Severity**: ${change.details.severity}\n`;
        if (change.details.before) {
          md += `- **Before**: \`${change.details.before}\`\n`;
        }
        if (change.details.after) {
          md += `- **After**: \`${change.details.after}\`\n`;
        }
        if (change.details.migrationHint) {
          md += `- **Migration**: ${change.details.migrationHint}\n`;
        }
        md += '\n';
      }
    }

    // Migration steps
    if (report.migrationSteps.length > 0) {
      md += `## 📋 Migration Steps\n\n`;
      report.migrationSteps.forEach(step => {
        md += `${step}\n`;
      });
      md += '\n';
    }

    // All changes
    md += `## All Changes\n\n`;
    md += `| Type | Category | Name | Breaking | Severity |\n`;
    md += `|------|----------|------|----------|----------|\n`;
    
    for (const change of report.changes) {
      const breaking = change.details.breaking ? '⚠️ Yes' : '✅ No';
      md += `| ${change.type} | ${change.category} | ${change.name} | ${breaking} | ${change.details.severity} |\n`;
    }

    return md;
  }
}

// Type definitions
interface APIDefinition {
  category: APIChange['category'];
  name: string;
  type: string;
  path?: string;
  
  // For classes/interfaces
  members?: MemberDefinition[];
  extends?: string[];
  implements?: string[];
  
  // For functions
  signature?: string;
  parameters?: ParameterDefinition[];
  returnType?: string;
  
  // For types
  definition?: string;
  
  // For enums
  enumMembers?: string[];
  
  // For consts
  value?: string;
}

interface MemberDefinition {
  name: string;
  type: string;
  kind: 'property' | 'method' | 'getter' | 'setter';
  optional: boolean;
  static: boolean;
}

interface ParameterDefinition {
  name: string;
  type: string;
  optional: boolean;
  hasDefault: boolean;
}