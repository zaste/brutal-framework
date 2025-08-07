/**
 * API Surface Tracker for BRUTAL V5
 * 
 * Tracks and documents the public API surface of packages
 * to ensure stability and proper versioning
 */

import * as ts from 'typescript';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import * as crypto from 'crypto';

export interface APISurface {
  package: string;
  version: string;
  timestamp: string;
  exports: APIExport[];
  hash: string;
  stats: {
    totalExports: number;
    classes: number;
    interfaces: number;
    functions: number;
    types: number;
    enums: number;
    constants: number;
  };
}

export interface APIExport {
  name: string;
  kind: 'class' | 'interface' | 'function' | 'type' | 'enum' | 'const' | 'namespace';
  signature: string;
  documentation?: string;
  deprecated?: boolean;
  since?: string;
  stability?: 'experimental' | 'stable' | 'deprecated';
  members?: APIMember[];
  generics?: string[];
  extends?: string[];
  implements?: string[];
}

export interface APIMember {
  name: string;
  kind: 'property' | 'method' | 'getter' | 'setter' | 'constructor';
  signature: string;
  documentation?: string;
  visibility: 'public' | 'protected' | 'private';
  static?: boolean;
  readonly?: boolean;
  optional?: boolean;
  deprecated?: boolean;
}

export interface APIComparison {
  package: string;
  fromVersion: string;
  toVersion: string;
  compatible: boolean;
  changes: {
    added: APIExport[];
    removed: APIExport[];
    modified: Array<{
      export: APIExport;
      changes: string[];
    }>;
  };
  suggestions: string[];
}

export class APISurfaceTracker {
  private program: ts.Program | null = null;
  private checker: ts.TypeChecker | null = null;
  private compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    lib: ['esnext', 'dom'],
    declaration: true,
    emitDeclarationOnly: true,
    allowJs: true,
    checkJs: false,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true
  };

  async trackPackage(packagePath: string): Promise<APISurface> {
    const packageJson = JSON.parse(
      await readFile(join(packagePath, 'package.json'), 'utf-8')
    );

    // Find entry points
    const entryPoints = await this.findEntryPoints(packagePath, packageJson);
    
    // Create TypeScript program
    this.program = ts.createProgram(entryPoints, this.compilerOptions);
    this.checker = this.program.getTypeChecker();

    // Extract exports
    const exports: APIExport[] = [];
    const processedSymbols = new Set<ts.Symbol>();

    for (const sourceFile of this.program.getSourceFiles()) {
      if (sourceFile.isDeclarationFile) continue;
      
      // Get module symbol
      const moduleSymbol = this.checker.getSymbolAtLocation(sourceFile);
      if (!moduleSymbol) continue;

      // Get exports
      const exportSymbols = this.checker.getExportsOfModule(moduleSymbol);
      
      for (const symbol of exportSymbols) {
        if (processedSymbols.has(symbol)) continue;
        processedSymbols.add(symbol);

        const apiExport = this.extractAPIExport(symbol);
        if (apiExport) {
          exports.push(apiExport);
        }
      }
    }

    // Sort exports for consistent hashing
    exports.sort((a, b) => a.name.localeCompare(b.name));

    // Calculate stats
    const stats = this.calculateStats(exports);

    // Generate hash
    const hash = this.generateHash(exports);

    return {
      package: packageJson.name,
      version: packageJson.version,
      timestamp: new Date().toISOString(),
      exports,
      hash,
      stats
    };
  }

  private async findEntryPoints(
    packagePath: string,
    packageJson: any
  ): Promise<string[]> {
    const entryPoints: string[] = [];

    // Check main entry
    if (packageJson.main) {
      entryPoints.push(join(packagePath, packageJson.main));
    }

    // Check module entry
    if (packageJson.module) {
      entryPoints.push(join(packagePath, packageJson.module));
    }

    // Check exports field
    if (packageJson.exports) {
      const addExport = (exp: any) => {
        if (typeof exp === 'string') {
          entryPoints.push(join(packagePath, exp));
        } else if (exp && typeof exp === 'object') {
          if (exp.import) addExport(exp.import);
          if (exp.require) addExport(exp.require);
          if (exp.default) addExport(exp.default);
        }
      };

      if (typeof packageJson.exports === 'string') {
        addExport(packageJson.exports);
      } else {
        Object.values(packageJson.exports).forEach(addExport);
      }
    }

    // Default to src/index.ts if no entry points found
    if (entryPoints.length === 0) {
      entryPoints.push(join(packagePath, 'src', 'index.ts'));
    }

    // Filter to only existing files
    const { access } = await import('fs/promises');
    const existingFiles: string[] = [];
    
    for (const file of entryPoints) {
      try {
        await access(file);
        existingFiles.push(file);
      } catch {
        // Try with .ts extension
        try {
          await access(file + '.ts');
          existingFiles.push(file + '.ts');
        } catch {
          // File doesn't exist
        }
      }
    }

    return [...new Set(existingFiles)];
  }

  private extractAPIExport(symbol: ts.Symbol): APIExport | null {
    const declaration = symbol.valueDeclaration || symbol.declarations?.[0];
    if (!declaration) return null;

    const type = this.checker!.getTypeOfSymbolAtLocation(symbol, declaration);
    const signature = this.checker!.typeToString(type);
    const documentation = this.getDocumentation(symbol);
    const tags = this.getJSDocTags(symbol);

    let kind: APIExport['kind'] = 'const';
    let members: APIMember[] | undefined;
    let generics: string[] | undefined;
    let extends_: string[] | undefined;
    let implements_: string[] | undefined;

    if (symbol.flags & ts.SymbolFlags.Class) {
      kind = 'class';
      members = this.extractClassMembers(symbol);
      const classDecl = declaration as ts.ClassDeclaration;
      generics = this.extractGenerics(classDecl);
      extends_ = this.extractExtends(classDecl);
      implements_ = this.extractImplements(classDecl);
    } else if (symbol.flags & ts.SymbolFlags.Interface) {
      kind = 'interface';
      members = this.extractInterfaceMembers(symbol);
      const interfaceDecl = declaration as ts.InterfaceDeclaration;
      generics = this.extractGenerics(interfaceDecl);
      extends_ = this.extractExtends(interfaceDecl);
    } else if (symbol.flags & ts.SymbolFlags.Function) {
      kind = 'function';
      const funcDecl = declaration as ts.FunctionDeclaration;
      generics = this.extractGenerics(funcDecl);
    } else if (symbol.flags & ts.SymbolFlags.TypeAlias) {
      kind = 'type';
      const typeDecl = declaration as ts.TypeAliasDeclaration;
      generics = this.extractGenerics(typeDecl);
    } else if (symbol.flags & ts.SymbolFlags.Enum) {
      kind = 'enum';
      members = this.extractEnumMembers(symbol);
    } else if (symbol.flags & ts.SymbolFlags.Namespace) {
      kind = 'namespace';
    }

    return {
      name: symbol.getName(),
      kind,
      signature,
      documentation,
      deprecated: tags['deprecated'] !== undefined,
      since: tags['since'],
      stability: tags['stability'] as any,
      members,
      generics,
      extends: extends_,
      implements: implements_
    };
  }

  private extractClassMembers(symbol: ts.Symbol): APIMember[] {
    const members: APIMember[] = [];
    
    // Get the class declaration
    const classDecl = symbol.valueDeclaration as ts.ClassDeclaration;
    if (!classDecl || !ts.isClassDeclaration(classDecl)) {
      return members;
    }

    // Extract members directly from the class declaration
    for (const member of classDecl.members) {
      if (ts.isPropertyDeclaration(member) || 
          ts.isMethodDeclaration(member) || 
          ts.isGetAccessor(member) || 
          ts.isSetAccessor(member) ||
          ts.isConstructorDeclaration(member)) {
        
        // Skip private members
        const modifiers = ts.getCombinedModifierFlags(member);
        if (modifiers & ts.ModifierFlags.Private) continue;
        
        // Get member name - handle different node types properly
        const memberName = member.name && ts.isIdentifier(member.name) 
          ? member.name.text 
          : member.name?.getText() || 'constructor';
        
        // Determine member kind
        let kind: APIMember['kind'] = 'property';
        if (ts.isMethodDeclaration(member)) {
          kind = 'method';
        } else if (ts.isGetAccessor(member)) {
          kind = 'getter';
        } else if (ts.isSetAccessor(member)) {
          kind = 'setter';
        } else if (ts.isConstructorDeclaration(member)) {
          kind = 'constructor';
        }
        
        // Get visibility
        const visibility = modifiers & ts.ModifierFlags.Private ? 'private' :
                          modifiers & ts.ModifierFlags.Protected ? 'protected' :
                          'public';
        
        // Get type
        const memberSymbol = this.checker!.getSymbolAtLocation(member.name || member);
        const memberType = memberSymbol ? 
          this.checker!.getTypeOfSymbolAtLocation(memberSymbol, member) :
          this.checker!.getTypeAtLocation(member);
        
        members.push({
          name: memberName,
          kind,
          signature: this.checker!.typeToString(memberType),
          documentation: memberSymbol ? this.getDocumentation(memberSymbol) : undefined,
          visibility,
          static: !!(modifiers & ts.ModifierFlags.Static),
          readonly: !!(modifiers & ts.ModifierFlags.Readonly),
          optional: member.questionToken !== undefined
        });
      }
    }

    return members;
  }

  private extractInterfaceMembers(symbol: ts.Symbol): APIMember[] {
    const members: APIMember[] = [];
    
    // Get the interface declaration - try all possible declarations
    const declaration = symbol.valueDeclaration || symbol.declarations?.[0];
    if (!declaration || !ts.isInterfaceDeclaration(declaration)) {
      // If no valueDeclaration, try to get interface from type symbol
      const type = this.checker!.getTypeOfSymbolAtLocation(symbol, declaration || symbol.declarations![0]);
      const typeSymbol = type.getSymbol();
      if (typeSymbol && typeSymbol.members) {
        // Extract members from the type's symbol table
        typeSymbol.members.forEach((memberSymbol, memberName) => {
          const memberType = this.checker!.getTypeOfSymbolAtLocation(memberSymbol, memberSymbol.valueDeclaration || memberSymbol.declarations![0]);
          const flags = memberSymbol.getFlags();
          
          members.push({
            name: memberName.toString(),
            kind: flags & ts.SymbolFlags.Method ? 'method' : 'property',
            signature: this.checker!.typeToString(memberType),
            documentation: this.getDocumentation(memberSymbol),
            visibility: 'public',
            readonly: false, // Will be set based on modifiers check below
            optional: !!(flags & ts.SymbolFlags.Optional)
          });
        });
        return members;
      }
      return members;
    }

    // Extract members directly from the interface declaration
    for (const member of declaration.members) {
      if (ts.isPropertySignature(member) || ts.isMethodSignature(member)) {
        // Extract member name properly - member.name is an Identifier node
        const memberName = member.name && ts.isIdentifier(member.name) 
          ? member.name.text 
          : member.name?.getText() || '';
        
        // Get member type
        const memberType = this.checker!.getTypeAtLocation(member);
        
        members.push({
          name: memberName,
          kind: ts.isMethodSignature(member) ? 'method' : 'property',
          signature: this.checker!.typeToString(memberType),
          documentation: undefined, // Can be extracted from JSDoc if needed
          visibility: 'public', // Interfaces are always public
          readonly: member.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword) || false,
          optional: member.questionToken !== undefined
        });
      }
    }

    return members;
  }

  private extractEnumMembers(symbol: ts.Symbol): APIMember[] {
    const members: APIMember[] = [];
    
    if (symbol.exports) {
      symbol.exports.forEach((memberSymbol, name) => {
        members.push({
          name: name.toString(),
          kind: 'property',
          signature: this.checker!.typeToString(
            this.checker!.getTypeOfSymbolAtLocation(
              memberSymbol,
              memberSymbol.valueDeclaration!
            )
          ),
          visibility: 'public',
          readonly: true
        });
      });
    }

    return members;
  }

  private extractMember(symbol: ts.Symbol): APIMember | null {
    const type = this.checker!.getTypeOfSymbolAtLocation(
      symbol,
      symbol.valueDeclaration!
    );
    
    const flags = symbol.getFlags();
    let kind: APIMember['kind'] = 'property';
    
    if (flags & ts.SymbolFlags.Method) {
      kind = 'method';
    } else if (flags & ts.SymbolFlags.GetAccessor) {
      kind = 'getter';
    } else if (flags & ts.SymbolFlags.SetAccessor) {
      kind = 'setter';
    }

    if (!symbol.valueDeclaration) {
      return null;
    }
    
    const modifiers = ts.getCombinedModifierFlags(symbol.valueDeclaration as ts.Declaration);
    const visibility = modifiers & ts.ModifierFlags.Private ? 'private' :
                      modifiers & ts.ModifierFlags.Protected ? 'protected' :
                      'public';

    const tags = this.getJSDocTags(symbol);

    return {
      name: symbol.getName(),
      kind,
      signature: this.checker!.typeToString(type),
      documentation: this.getDocumentation(symbol),
      visibility,
      static: !!(modifiers & ts.ModifierFlags.Static),
      readonly: !!(modifiers & ts.ModifierFlags.Readonly),
      optional: !!(symbol.flags & ts.SymbolFlags.Optional),
      deprecated: tags['deprecated'] !== undefined
    };
  }

  private extractGenerics(
    node: ts.ClassDeclaration | ts.InterfaceDeclaration | 
          ts.FunctionDeclaration | ts.TypeAliasDeclaration
  ): string[] | undefined {
    if (!node.typeParameters) return undefined;
    
    return node.typeParameters.map(param => {
      let generic = param.name.text;
      
      if (param.constraint) {
        generic += ' extends ' + param.constraint.getText();
      }
      
      if (param.default) {
        generic += ' = ' + param.default.getText();
      }
      
      return generic;
    });
  }

  private extractExtends(
    node: ts.ClassDeclaration | ts.InterfaceDeclaration
  ): string[] | undefined {
    if (!node.heritageClauses) return undefined;
    
    const extendsClause = node.heritageClauses.find(
      clause => clause.token === ts.SyntaxKind.ExtendsKeyword
    );
    
    if (!extendsClause) return undefined;
    
    return extendsClause.types.map(type => type.expression.getText());
  }

  private extractImplements(node: ts.ClassDeclaration): string[] | undefined {
    if (!node.heritageClauses) return undefined;
    
    const implementsClause = node.heritageClauses.find(
      clause => clause.token === ts.SyntaxKind.ImplementsKeyword
    );
    
    if (!implementsClause) return undefined;
    
    return implementsClause.types.map(type => type.expression.getText());
  }

  private getDocumentation(symbol: ts.Symbol): string | undefined {
    const docs = symbol.getDocumentationComment(this.checker);
    if (docs.length === 0) return undefined;
    
    return docs.map(doc => doc.text).join('\n');
  }

  private getJSDocTags(symbol: ts.Symbol): Record<string, string> {
    const tags: Record<string, string> = {};
    const jsdocTags = symbol.getJsDocTags();
    
    for (const tag of jsdocTags) {
      tags[tag.name] = tag.text?.map(t => t.text).join('') || '';
    }
    
    return tags;
  }

  private calculateStats(exports: APIExport[]): APISurface['stats'] {
    const stats = {
      totalExports: exports.length,
      classes: 0,
      interfaces: 0,
      functions: 0,
      types: 0,
      enums: 0,
      constants: 0
    };

    for (const exp of exports) {
      switch (exp.kind) {
        case 'class': stats.classes++; break;
        case 'interface': stats.interfaces++; break;
        case 'function': stats.functions++; break;
        case 'type': stats.types++; break;
        case 'enum': stats.enums++; break;
        case 'const': stats.constants++; break;
      }
    }

    return stats;
  }

  private generateHash(exports: APIExport[]): string {
    const content = JSON.stringify(exports);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  compareSurfaces(oldSurface: APISurface, newSurface: APISurface): APIComparison {
    const oldExportsMap = new Map(oldSurface.exports.map(e => [e.name, e]));
    const newExportsMap = new Map(newSurface.exports.map(e => [e.name, e]));

    const added: APIExport[] = [];
    const removed: APIExport[] = [];
    const modified: Array<{ export: APIExport; changes: string[] }> = [];

    // Find removed exports
    for (const [name, exp] of oldExportsMap) {
      if (!newExportsMap.has(name)) {
        removed.push(exp);
      }
    }

    // Find added and modified exports
    for (const [name, exp] of newExportsMap) {
      const oldExp = oldExportsMap.get(name);
      
      if (!oldExp) {
        added.push(exp);
      } else {
        const changes = this.compareExports(oldExp, exp);
        if (changes.length > 0) {
          modified.push({ export: exp, changes });
        }
      }
    }

    const compatible = removed.length === 0 && 
                      modified.every(m => !m.changes.some(c => c.includes('breaking')));

    const suggestions = this.generateSuggestions(added, removed, modified);

    return {
      package: newSurface.package,
      fromVersion: oldSurface.version,
      toVersion: newSurface.version,
      compatible,
      changes: { added, removed, modified },
      suggestions
    };
  }

  private compareExports(oldExp: APIExport, newExp: APIExport): string[] {
    const changes: string[] = [];

    if (oldExp.kind !== newExp.kind) {
      changes.push(`breaking: kind changed from ${oldExp.kind} to ${newExp.kind}`);
    }

    if (oldExp.signature !== newExp.signature) {
      changes.push(`signature changed`);
    }

    // Compare members
    if (oldExp.members && newExp.members) {
      const oldMembers = new Map(oldExp.members.map(m => [m.name, m]));
      const newMembers = new Map(newExp.members.map(m => [m.name, m]));

      for (const [name, member] of oldMembers) {
        if (!newMembers.has(name)) {
          changes.push(`breaking: member '${name}' removed`);
        }
      }

      for (const [name, member] of newMembers) {
        const oldMember = oldMembers.get(name);
        if (!oldMember) {
          if (!member.optional) {
            changes.push(`potentially breaking: required member '${name}' added`);
          } else {
            changes.push(`member '${name}' added`);
          }
        } else if (oldMember.signature !== member.signature) {
          changes.push(`breaking: member '${name}' signature changed`);
        }
      }
    }

    return changes;
  }

  private generateSuggestions(
    added: APIExport[],
    removed: APIExport[],
    modified: Array<{ export: APIExport; changes: string[] }>
  ): string[] {
    const suggestions: string[] = [];

    if (removed.length > 0) {
      suggestions.push(
        `Major version bump required: ${removed.length} exports were removed`
      );
    } else if (modified.some(m => m.changes.some(c => c.includes('breaking')))) {
      suggestions.push(
        'Major version bump required: breaking changes detected'
      );
    } else if (added.length > 0) {
      suggestions.push(
        `Minor version bump suggested: ${added.length} new exports added`
      );
    } else if (modified.length > 0) {
      suggestions.push(
        'Patch version bump suggested: non-breaking modifications'
      );
    }

    // Deprecation suggestions
    const deprecatedExports = added.concat(
      modified.map(m => m.export)
    ).filter(e => e.deprecated);

    if (deprecatedExports.length > 0) {
      suggestions.push(
        `Consider removing deprecated exports in next major version: ${
          deprecatedExports.map(e => e.name).join(', ')
        }`
      );
    }

    return suggestions;
  }

  async generateReport(surface: APISurface, outputPath: string): Promise<void> {
    const report = this.generateMarkdownReport(surface);
    await writeFile(outputPath, report);
  }

  generateMarkdownReport(surface: APISurface): string {
    let md = `# API Surface Report\n\n`;
    md += `Package: **${surface.package}** v${surface.version}\n`;
    md += `Generated: ${surface.timestamp}\n`;
    md += `API Hash: \`${surface.hash.substring(0, 16)}...\`\n\n`;

    // Stats
    md += `## Statistics\n\n`;
    md += `- Total exports: ${surface.stats.totalExports}\n`;
    md += `- Classes: ${surface.stats.classes}\n`;
    md += `- Interfaces: ${surface.stats.interfaces}\n`;
    md += `- Functions: ${surface.stats.functions}\n`;
    md += `- Types: ${surface.stats.types}\n`;
    md += `- Enums: ${surface.stats.enums}\n`;
    md += `- Constants: ${surface.stats.constants}\n\n`;

    // Exports by category
    const categories = ['class', 'interface', 'function', 'type', 'enum', 'const'] as const;
    
    for (const category of categories) {
      const categoryExports = surface.exports.filter(e => e.kind === category);
      if (categoryExports.length === 0) continue;

      // Properly pluralize the category name
      let categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
      if (category === 'class') {
        categoryTitle += 'es';
      } else if (category === 'interface') {
        categoryTitle += 's';
      } else if (category === 'const') {
        categoryTitle = 'Constants';
      } else if (category === 'type') {
        categoryTitle = 'Types';
      } else if (category === 'enum') {
        categoryTitle = 'Enums';
      } else if (category === 'function') {
        categoryTitle = 'Functions';
      }
      
      md += `## ${categoryTitle}\n\n`;
      
      for (const exp of categoryExports) {
        md += `### ${exp.name}`;
        
        if (exp.generics) {
          md += `<${exp.generics.join(', ')}>`;
        }
        
        if (exp.deprecated) {
          md += ' **[DEPRECATED]**';
        }
        
        md += '\n\n';
        
        if (exp.documentation) {
          md += `${exp.documentation}\n\n`;
        }
        
        md += `\`\`\`typescript\n${exp.signature}\n\`\`\`\n\n`;
        
        if (exp.since) {
          md += `**Since**: v${exp.since}\n\n`;
        }
        
        if (exp.members && exp.members.length > 0) {
          md += `**Members**:\n\n`;
          
          for (const member of exp.members) {
            const visibility = member.visibility !== 'public' ? `${member.visibility} ` : '';
            const static_ = member.static ? 'static ' : '';
            const readonly = member.readonly ? 'readonly ' : '';
            
            md += `- ${visibility}${static_}${readonly}**${member.name}**`;
            
            if (member.optional) md += '?';
            if (member.deprecated) md += ' [DEPRECATED]';
            
            md += `: \`${member.signature}\`\n`;
            
            if (member.documentation) {
              md += `  ${member.documentation}\n`;
            }
          }
          
          md += '\n';
        }
      }
    }

    return md;
  }

  generateComparisonReport(comparison: APIComparison): string {
    let md = `# API Comparison Report\n\n`;
    md += `Package: **${comparison.package}**\n`;
    md += `Version: ${comparison.fromVersion} → ${comparison.toVersion}\n`;
    md += `Compatible: ${comparison.compatible ? '✅ Yes' : '❌ No'}\n\n`;

    // Summary
    md += `## Summary\n\n`;
    md += `- Added: ${comparison.changes.added.length} exports\n`;
    md += `- Removed: ${comparison.changes.removed.length} exports\n`;
    md += `- Modified: ${comparison.changes.modified.length} exports\n\n`;

    // Suggestions
    if (comparison.suggestions.length > 0) {
      md += `## Suggestions\n\n`;
      comparison.suggestions.forEach(s => md += `- ${s}\n`);
      md += '\n';
    }

    // Removed exports
    if (comparison.changes.removed.length > 0) {
      md += `## ❌ Removed Exports\n\n`;
      for (const exp of comparison.changes.removed) {
        md += `- **${exp.name}** (${exp.kind})\n`;
      }
      md += '\n';
    }

    // Added exports
    if (comparison.changes.added.length > 0) {
      md += `## ✅ Added Exports\n\n`;
      for (const exp of comparison.changes.added) {
        md += `- **${exp.name}** (${exp.kind})`;
        if (exp.deprecated) md += ' [DEPRECATED]';
        md += '\n';
      }
      md += '\n';
    }

    // Modified exports
    if (comparison.changes.modified.length > 0) {
      md += `## 🔄 Modified Exports\n\n`;
      for (const { export: exp, changes } of comparison.changes.modified) {
        md += `### ${exp.name}\n`;
        changes.forEach(c => md += `- ${c}\n`);
        md += '\n';
      }
    }

    return md;
  }
}