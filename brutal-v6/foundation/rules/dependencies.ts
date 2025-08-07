/**
 * Dependencies rule
 * Zero external runtime dependencies allowed
 */

import { Rule, RuleResult } from './index';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const dependenciesRule: Rule = {
  name: 'zero-dependencies',
  
  appliesTo: (type: string) => type === 'package',
  
  async validate(target: any): Promise<RuleResult> {
    const violations = [];
    
    try {
      let pkg: any;
      
      // Load package.json
      if (target.path) {
        const pkgPath = join(target.path, 'package.json');
        try {
          const content = await readFile(pkgPath, 'utf-8');
          pkg = JSON.parse(content);
        } catch (e) {
          // No package.json, skip validation
          return { valid: true, violations: [] };
        }
      } else if (target.content) {
        pkg = target.content;
      }
      
      if (pkg && pkg.dependencies) {
        const deps = Object.keys(pkg.dependencies);
        const externalDeps = deps.filter(d => !d.startsWith('@brutal/'));
        
        if (externalDeps.length > 0) {
          violations.push({
            rule: 'zero-dependencies',
            severity: 'error' as const,
            message: `External dependencies not allowed: ${externalDeps.join(', ')}`,
            file: 'package.json',
            fix: async () => {
              // Would remove external deps from package.json
              console.log(`Would remove dependencies: ${externalDeps.join(', ')}`);
            }
          });
        }
      }
      
      // Check devDependencies allowlist
      if (pkg && pkg.devDependencies) {
        const allowed = ['typescript', 'tsup', 'jest', '@types/*', 'esbuild'];
        const devDeps = Object.keys(pkg.devDependencies);
        
        const notAllowed = devDeps.filter(dep => {
          return !allowed.some(pattern => {
            if (pattern.endsWith('*')) {
              return dep.startsWith(pattern.slice(0, -1));
            }
            return dep === pattern;
          });
        });
        
        if (notAllowed.length > 0) {
          violations.push({
            rule: 'zero-dependencies',
            severity: 'warning' as const,
            message: `Dev dependencies not in allowlist: ${notAllowed.join(', ')}`,
            file: 'package.json'
          });
        }
      }
    } catch (error) {
      violations.push({
        rule: 'zero-dependencies',
        severity: 'error' as const,
        message: `Failed to check dependencies: ${error.message}`
      });
    }
    
    return {
      valid: violations.length === 0,
      violations
    };
  }
};