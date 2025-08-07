/**
 * Migration Tool Generator for BRUTAL V5
 * 
 * Automatically generates migration scripts and codemods
 * based on breaking change analysis
 */

import * as ts from 'typescript';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import type { APIChange, BreakingChangeReport } from './breaking-change-analyzer.js';

export interface MigrationRule {
  pattern: string;
  replacement: string | ((match: string, ...args: any[]) => string);
  filePattern?: string;
  description: string;
  testCase?: {
    before: string;
    after: string;
  };
}

export interface MigrationScript {
  name: string;
  description: string;
  fromVersion: string;
  toVersion: string;
  rules: MigrationRule[];
  customTransforms?: CustomTransform[];
  preScript?: string;
  postScript?: string;
}

export interface CustomTransform {
  name: string;
  description: string;
  transform: (sourceFile: ts.SourceFile, context: ts.TransformationContext) => ts.SourceFile;
}

export interface MigrationResult {
  filesProcessed: number;
  filesModified: number;
  errors: Array<{ file: string; error: string }>;
  warnings: Array<{ file: string; warning: string }>;
}

export class MigrationGenerator {
  generateMigrationScript(report: BreakingChangeReport): MigrationScript {
    const rules: MigrationRule[] = [];
    const customTransforms: CustomTransform[] = [];

    // Generate rules for each breaking change
    for (const change of report.changes.filter(c => c.details.breaking)) {
      switch (change.type) {
        case 'removed':
          rules.push(...this.generateRemovalRules(change));
          break;
        case 'modified':
          rules.push(...this.generateModificationRules(change));
          customTransforms.push(...this.generateCustomTransforms(change));
          break;
        case 'renamed':
          rules.push(...this.generateRenameRules(change));
          break;
      }
    }

    return {
      name: `migrate-${report.package}-${report.fromVersion}-to-${report.toVersion}`,
      description: `Migration script for ${report.package} from ${report.fromVersion} to ${report.toVersion}`,
      fromVersion: report.fromVersion,
      toVersion: report.toVersion,
      rules,
      customTransforms,
      preScript: this.generatePreScript(report),
      postScript: this.generatePostScript(report)
    };
  }

  private generateRemovalRules(change: APIChange): MigrationRule[] {
    const rules: MigrationRule[] = [];

    switch (change.category) {
      case 'function':
        rules.push({
          pattern: `\\b${change.name}\\s*\\(`,
          replacement: `/* TODO: ${change.name} was removed - ${change.details.migrationHint} */ deprecated_${change.name}(`,
          description: `Mark removed function ${change.name} calls`,
          testCase: {
            before: `const result = ${change.name}(param);`,
            after: `const result = /* TODO: ${change.name} was removed - ${change.details.migrationHint} */ deprecated_${change.name}(param);`
          }
        });
        break;

      case 'class':
        rules.push({
          pattern: `new\\s+${change.name}\\s*\\(`,
          replacement: `/* TODO: ${change.name} was removed */ new Deprecated${change.name}(`,
          description: `Mark removed class ${change.name} instantiations`
        });
        rules.push({
          pattern: `extends\\s+${change.name}\\b`,
          replacement: `extends /* TODO: ${change.name} was removed */ Deprecated${change.name}`,
          description: `Mark removed class ${change.name} inheritance`
        });
        break;

      case 'interface':
      case 'type':
        rules.push({
          pattern: `:\\s*${change.name}\\b`,
          replacement: `: /* TODO: ${change.name} was removed */ Deprecated${change.name}`,
          description: `Mark removed type ${change.name} usage`
        });
        break;
    }

    return rules;
  }

  private generateModificationRules(change: APIChange): MigrationRule[] {
    const rules: MigrationRule[] = [];

    // Generate specific rules based on the type of modification
    if (change.category === 'function' && change.details.before && change.details.after) {
      // Function signature changed
      const oldParams = this.extractFunctionParams(change.details.before);
      const newParams = this.extractFunctionParams(change.details.after);

      if (oldParams.length !== newParams.length) {
        rules.push({
          pattern: `${change.name}\\s*\\(([^)]*)\\)`,
          replacement: (match, params) => {
            return this.transformFunctionCall(change.name, params, oldParams, newParams);
          },
          description: `Update ${change.name} function calls for new signature`
        });
      }
    }

    if (change.category === 'class' || change.category === 'interface') {
      // Member changes
      const memberChanges = this.analyzeMemberChanges(change);
      
      for (const memberChange of memberChanges) {
        if (memberChange.type === 'renamed') {
          rules.push({
            pattern: `\\.${memberChange.oldName}\\b`,
            replacement: `.${memberChange.newName}`,
            description: `Rename member ${memberChange.oldName} to ${memberChange.newName}`
          });
        }
      }
    }

    return rules;
  }

  private generateRenameRules(change: APIChange): MigrationRule[] {
    const oldName = change.name;
    const newName = change.details.after || change.name;

    return [{
      pattern: `\\b${oldName}\\b`,
      replacement: newName,
      description: `Rename ${oldName} to ${newName}`,
      testCase: {
        before: `import { ${oldName} } from '@brutal/package';`,
        after: `import { ${newName} } from '@brutal/package';`
      }
    }];
  }

  private generateCustomTransforms(change: APIChange): CustomTransform[] {
    const transforms: CustomTransform[] = [];

    // Complex transformations that can't be handled by simple regex
    if (change.category === 'class' && this.requiresComplexTransform(change)) {
      transforms.push({
        name: `transform-${change.name}`,
        description: `Complex transformation for ${change.name}`,
        transform: this.createClassTransform(change)
      });
    }

    return transforms;
  }

  private createClassTransform(change: APIChange): (
    sourceFile: ts.SourceFile,
    context: ts.TransformationContext
  ) => ts.SourceFile {
    return (sourceFile: ts.SourceFile, context: ts.TransformationContext) => {
      const visitor = (node: ts.Node): ts.Node => {
        // Transform class usage
        if (ts.isNewExpression(node) && 
            ts.isIdentifier(node.expression) && 
            node.expression.text === change.name) {
          // Add migration comment
          const comment = ts.addSyntheticLeadingComment(
            node,
            ts.SyntaxKind.MultiLineCommentTrivia,
            ` TODO: Verify ${change.name} usage - ${change.details.migrationHint} `,
            true
          );
          return comment;
        }

        return ts.visitEachChild(node, visitor, context);
      };

      return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
    };
  }

  private generatePreScript(report: BreakingChangeReport): string {
    return `
// Pre-migration script for ${report.package} ${report.fromVersion} to ${report.toVersion}
console.log('Starting migration...');
console.log('Breaking changes to handle: ${report.summary.breakingChanges}');

// Backup recommendation
console.warn('⚠️  Make sure to backup your code before running this migration!');
`;
  }

  private generatePostScript(report: BreakingChangeReport): string {
    return `
// Post-migration script
console.log('Migration complete!');
console.log('Please review all TODO comments added by the migration.');
console.log('Run your tests to ensure everything works correctly.');

// Verification steps
const verificationSteps = ${JSON.stringify(report.migrationSteps, null, 2)};
console.log('\\nRecommended verification steps:');
verificationSteps.forEach((step, i) => console.log(\`\${i + 1}. \${step}\`));
`;
  }

  async executeMigration(
    script: MigrationScript,
    targetPath: string,
    options: {
      dryRun?: boolean;
      verbose?: boolean;
      include?: string[];
      exclude?: string[];
    } = {}
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      filesProcessed: 0,
      filesModified: 0,
      errors: [],
      warnings: []
    };

    try {
      // Execute pre-script
      if (script.preScript && options.verbose) {
        console.log('Executing pre-script...');
        eval(script.preScript);
      }

      // Find all TypeScript/JavaScript files
      const files = await this.findFiles(targetPath, options.include, options.exclude);
      
      for (const file of files) {
        result.filesProcessed++;
        
        try {
          const modified = await this.processFile(file, script, options);
          if (modified) {
            result.filesModified++;
          }
        } catch (error) {
          result.errors.push({
            file,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Execute post-script
      if (script.postScript && options.verbose) {
        console.log('Executing post-script...');
        eval(script.postScript);
      }

    } catch (error) {
      result.errors.push({
        file: 'migration',
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return result;
  }

  private async processFile(
    filePath: string,
    script: MigrationScript,
    options: { dryRun?: boolean; verbose?: boolean }
  ): Promise<boolean> {
    const { readFile } = await import('fs/promises');
    let content = await readFile(filePath, 'utf-8');
    const originalContent = content;

    // Apply regex rules
    for (const rule of script.rules) {
      if (!rule.filePattern || new RegExp(rule.filePattern).test(filePath)) {
        const regex = new RegExp(rule.pattern, 'g');
        content = content.replace(regex, rule.replacement as any);
      }
    }

    // Apply custom transforms if it's a TypeScript file
    if (script.customTransforms && script.customTransforms.length > 0 && 
        (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) {
      content = await this.applyCustomTransforms(content, filePath, script.customTransforms);
    }

    // Check if file was modified
    if (content !== originalContent) {
      if (!options.dryRun) {
        await writeFile(filePath, content, 'utf-8');
      }
      
      if (options.verbose) {
        console.log(`✓ Modified: ${filePath}`);
      }
      
      return true;
    }

    return false;
  }

  private async applyCustomTransforms(
    content: string,
    filePath: string,
    transforms: CustomTransform[]
  ): Promise<string> {
    // Create TypeScript source file
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    // Apply each transform
    let transformedFile = sourceFile;
    for (const transform of transforms) {
      const transformContext: ts.TransformationContext = {
        getCompilerOptions: () => ({}),
        startLexicalEnvironment: () => {},
        suspendLexicalEnvironment: () => {},
        resumeLexicalEnvironment: () => {},
        endLexicalEnvironment: () => [],
        hoistFunctionDeclaration: () => {},
        hoistVariableDeclaration: () => {},
        requestEmitHelper: () => {},
        readEmitHelpers: () => [],
        enableSubstitution: () => {},
        isSubstitutionEnabled: () => false,
        onSubstituteNode: () => {},
        enableEmitNotification: () => {},
        isEmitNotificationEnabled: () => false,
        onEmitNode: () => {},
        factory: ts.factory
      } as any;

      transformedFile = transform.transform(transformedFile, transformContext);
    }

    // Convert back to string
    const printer = ts.createPrinter();
    return printer.printFile(transformedFile);
  }

  private async findFiles(
    targetPath: string,
    include?: string[],
    exclude?: string[]
  ): Promise<string[]> {
    const files: string[] = [];
    const { readdir } = await import('fs/promises');
    
    const scanDir = async (dir: string) => {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip excluded directories
          if (exclude && exclude.some(pattern => fullPath.includes(pattern))) {
            continue;
          }
          
          await scanDir(fullPath);
        } else if (entry.isFile()) {
          // Check if file should be included
          const shouldInclude = !include || include.some(pattern => 
            fullPath.includes(pattern)
          );
          
          const shouldExclude = exclude && exclude.some(pattern => 
            fullPath.includes(pattern)
          );
          
          if (shouldInclude && !shouldExclude && 
              (entry.name.endsWith('.ts') || 
               entry.name.endsWith('.tsx') || 
               entry.name.endsWith('.js') || 
               entry.name.endsWith('.jsx'))) {
            files.push(fullPath);
          }
        }
      }
    };

    await scanDir(targetPath);
    return files;
  }

  // Helper methods
  private extractFunctionParams(signature: string): string[] {
    const match = signature.match(/\(([^)]*)\)/);
    if (!match) return [];
    
    return match[1].split(',').map(p => p.trim()).filter(p => p);
  }

  private transformFunctionCall(
    funcName: string,
    params: string,
    oldParams: string[],
    newParams: string[]
  ): string {
    // Simple parameter transformation logic
    const paramList = params.split(',').map(p => p.trim());
    
    // Add TODO comment for complex cases
    if (oldParams.length !== newParams.length) {
      return `/* TODO: Update ${funcName} call - parameters changed */ ${funcName}(${params})`;
    }
    
    return `${funcName}(${params})`;
  }

  private analyzeMemberChanges(change: APIChange): Array<{
    type: 'renamed' | 'removed' | 'added';
    oldName?: string;
    newName?: string;
  }> {
    // This would analyze the before/after to determine member changes
    // For now, return empty array
    return [];
  }

  private requiresComplexTransform(change: APIChange): boolean {
    // Determine if the change requires AST transformation
    return change.details.severity === 'major';
  }

  async generateMigrationPackage(
    script: MigrationScript,
    outputPath: string
  ): Promise<void> {
    // Create migration package structure
    await mkdir(outputPath, { recursive: true });
    
    // Generate main migration script
    const mainScript = this.generateMainScript(script);
    await writeFile(join(outputPath, 'migrate.js'), mainScript);
    
    // Generate README
    const readme = this.generateReadme(script);
    await writeFile(join(outputPath, 'README.md'), readme);
    
    // Generate test file
    const tests = this.generateTests(script);
    await writeFile(join(outputPath, 'migrate.test.js'), tests);
    
    // Generate package.json
    const packageJson = {
      name: script.name,
      version: '1.0.0',
      description: script.description,
      main: 'migrate.js',
      scripts: {
        'test': 'node migrate.test.js',
        'migrate': 'node migrate.js'
      },
      dependencies: {
        'typescript': '^5.0.0'
      }
    };
    
    await writeFile(
      join(outputPath, 'package.json'), 
      JSON.stringify(packageJson, null, 2)
    );
  }

  private generateMainScript(script: MigrationScript): string {
    return `#!/usr/bin/env node
/**
 * ${script.description}
 * Auto-generated migration script
 */

const { MigrationExecutor } = require('./executor');

const migrationScript = ${JSON.stringify(script, null, 2)};

async function main() {
  const args = process.argv.slice(2);
  const targetPath = args[0] || process.cwd();
  
  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose')
  };
  
  console.log('🔄 Running migration: ${script.name}');
  console.log(\`📁 Target path: \${targetPath}\`);
  console.log(\`⚙️  Options: \${JSON.stringify(options)}\`);
  
  const executor = new MigrationExecutor();
  const result = await executor.execute(migrationScript, targetPath, options);
  
  console.log('\\n📊 Migration Results:');
  console.log(\`  Files processed: \${result.filesProcessed}\`);
  console.log(\`  Files modified: \${result.filesModified}\`);
  console.log(\`  Errors: \${result.errors.length}\`);
  console.log(\`  Warnings: \${result.warnings.length}\`);
  
  if (result.errors.length > 0) {
    console.error('\\n❌ Errors:');
    result.errors.forEach(e => console.error(\`  \${e.file}: \${e.error}\`));
    process.exit(1);
  }
  
  if (options.dryRun) {
    console.log('\\n✅ Dry run complete. No files were modified.');
  } else {
    console.log('\\n✅ Migration complete!');
  }
}

main().catch(console.error);
`;
  }

  private generateReadme(script: MigrationScript): string {
    return `# ${script.name}

${script.description}

## Usage

\`\`\`bash
# Install dependencies
npm install

# Run migration (dry run)
npm run migrate -- /path/to/your/project --dry-run

# Run migration (actual)
npm run migrate -- /path/to/your/project

# Run tests
npm test
\`\`\`

## Migration Rules

${script.rules.map(rule => `- ${rule.description}`).join('\n')}

## Version Information

- From: ${script.fromVersion}
- To: ${script.toVersion}

## What This Migration Does

${script.rules.map(rule => {
  let desc = `### ${rule.description}\n\n`;
  if (rule.testCase) {
    desc += 'Before:\n\`\`\`javascript\n' + rule.testCase.before + '\n\`\`\`\n\n';
    desc += 'After:\n\`\`\`javascript\n' + rule.testCase.after + '\n\`\`\`\n';
  }
  return desc;
}).join('\n')}

## Manual Steps Required

After running this migration, you should:

1. Review all TODO comments added by the migration
2. Run your test suite
3. Check for any compilation errors
4. Verify runtime behavior

## Troubleshooting

If you encounter issues:

1. Make sure you have a backup of your code
2. Run with --dry-run first to see what will change
3. Check the error messages for specific files that failed
4. Report issues at: https://github.com/brutal/migration-tools
`;
  }

  private generateTests(script: MigrationScript): string {
    return `/**
 * Tests for ${script.name}
 */

const assert = require('assert');

// Test data
const testCases = ${JSON.stringify(
  script.rules.filter(r => r.testCase).map(r => ({
    description: r.description,
    pattern: r.pattern,
    before: r.testCase!.before,
    after: r.testCase!.after
  })),
  null,
  2
)};

// Run tests
console.log('🧪 Running migration tests...');

testCases.forEach((testCase, i) => {
  console.log(\`\\nTest \${i + 1}: \${testCase.description}\`);
  
  const regex = new RegExp(testCase.pattern, 'g');
  const result = testCase.before.replace(regex, testCase.after);
  
  try {
    assert.strictEqual(result, testCase.after);
    console.log('  ✅ PASSED');
  } catch (error) {
    console.log('  ❌ FAILED');
    console.log(\`    Expected: \${testCase.after}\`);
    console.log(\`    Got: \${result}\`);
  }
});

console.log('\\n✅ All tests complete!');
`;
  }
}