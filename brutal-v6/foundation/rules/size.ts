/**
 * Size limit rule
 * Every byte must justify its existence
 */

import { Rule, RuleResult } from './index';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const SIZE_LIMIT = 2048; // 2KB max per package

export const sizeRule: Rule = {
  name: 'size-limit',
  
  appliesTo: (type: string) => type === 'package' || type === 'build',
  
  async validate(target: any): Promise<RuleResult> {
    const violations = [];
    
    try {
      // For packages, check dist size
      if (target.type === 'package') {
        const distPath = join(target.path || '.', 'dist', 'index.js');
        try {
          const content = await readFile(distPath, 'utf-8');
          const size = Buffer.byteLength(content, 'utf-8');
          
          if (size > SIZE_LIMIT) {
            violations.push({
              rule: 'size-limit',
              severity: 'error' as const,
              message: `Package exceeds ${SIZE_LIMIT}B limit by ${size - SIZE_LIMIT}B (current: ${size}B)`,
              file: distPath,
              fix: async () => {
                // In real implementation, would run aggressive minification
                console.log(`Would minify ${distPath} more aggressively`);
              }
            });
          }
        } catch (e) {
          // No dist file yet, that's OK during development
        }
      }
      
      // For builds, check the size directly
      if (target.type === 'build' && target.content?.size) {
        const size = target.content.size;
        if (size > SIZE_LIMIT) {
          violations.push({
            rule: 'size-limit',
            severity: 'error' as const,
            message: `Build exceeds ${SIZE_LIMIT}B limit by ${size - SIZE_LIMIT}B (current: ${size}B)`
          });
        }
      }
    } catch (error) {
      violations.push({
        rule: 'size-limit',
        severity: 'error' as const,
        message: `Failed to check size: ${error.message}`
      });
    }
    
    return {
      valid: violations.length === 0,
      violations
    };
  }
};