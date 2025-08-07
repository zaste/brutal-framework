/**
 * Duplication rule
 * One implementation per feature
 */

import { Rule, RuleResult } from './index';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export const duplicationRule: Rule = {
  name: 'no-duplication',
  
  appliesTo: (type: string) => type === 'package',
  
  async validate(target: any): Promise<RuleResult> {
    const violations = [];
    
    try {
      const basePath = target.path || '.';
      
      // Check for common duplication patterns
      const patterns = [
        {
          // Multiple implementations of same concept
          check: async () => {
            const srcPath = join(basePath, 'src');
            try {
              const files = await readdir(srcPath);
              
              // Look for files that suggest multiple implementations
              const implementations: Record<string, string[]> = {};
              
              for (const file of files) {
                // Common patterns: thing.ts, thing2.ts, thing-alt.ts, thing.old.ts
                const base = file.replace(/\.(ts|js)$/, '')
                  .replace(/[-_]?(alt|old|new|v\d+|2|backup|temp|tmp)$/, '')
                  .replace(/\.min$/, '');
                
                if (!implementations[base]) {
                  implementations[base] = [];
                }
                implementations[base].push(file);
              }
              
              // Flag when multiple files for same concept
              for (const [base, files] of Object.entries(implementations)) {
                if (files.length > 1) {
                  violations.push({
                    rule: 'no-duplication',
                    severity: 'error' as const,
                    message: `Multiple implementations of "${base}": ${files.join(', ')}`,
                    file: srcPath,
                    fix: async () => {
                      console.log(`Would consolidate ${files.join(', ')} into single ${base}.ts`);
                    }
                  });
                }
              }
            } catch (e) {
              // No src directory, that's OK
            }
          }
        },
        {
          // Minimal vs full implementations
          check: async () => {
            const srcPath = join(basePath, 'src');
            try {
              const files = await readdir(srcPath);
              
              if (files.includes('index.ts') && files.includes('minimal.ts')) {
                violations.push({
                  rule: 'no-duplication',
                  severity: 'error' as const,
                  message: 'Both index.ts and minimal.ts found. Choose one implementation.',
                  file: srcPath,
                  fix: async () => {
                    console.log('Would merge minimal.ts into index.ts as single optimized version');
                  }
                });
              }
            } catch (e) {
              // No src directory
            }
          }
        }
      ];
      
      // Run all duplication checks
      for (const pattern of patterns) {
        await pattern.check();
      }
      
    } catch (error) {
      violations.push({
        rule: 'no-duplication',
        severity: 'error' as const,
        message: `Failed to check duplication: ${error.message}`
      });
    }
    
    return {
      valid: violations.length === 0,
      violations
    };
  }
};