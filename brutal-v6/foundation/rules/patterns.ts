/**
 * Patterns rule
 * Enforce approved patterns
 */

import { Rule, RuleResult } from './index';
import { readFile } from 'fs/promises';

// Approved patterns
const APPROVED_PATTERNS = {
  // Composition pattern
  compose: /export\s+const\s+compose\s*=\s*\(\.\.\.fns\)\s*=>\s*x\s*=>\s*fns\.reduceRight/,
  
  // State pattern using Proxy
  proxyState: /new\s+Proxy\s*\([^)]+,\s*{\s*set\s*\(/,
  
  // Event delegation pattern
  eventDelegation: /addEventListener\s*\(\s*['"]click['"]\s*,\s*\(\s*e\s*\)\s*=>\s*{[^}]*closest/
};

// Anti-patterns to avoid
const ANTI_PATTERNS = [
  {
    pattern: /console\.(log|warn|error|info)/,
    message: 'Remove console statements',
    severity: 'warning' as const
  },
  {
    pattern: /:\s*any\b/,
    message: 'Avoid "any" type. Use specific types.',
    severity: 'error' as const
  },
  {
    pattern: /\/\/\s*TODO/i,
    message: 'Complete TODO or create issue',
    severity: 'warning' as const
  },
  {
    pattern: /setTimeout\s*\([^,]+,\s*0\)/,
    message: 'Use queueMicrotask() instead of setTimeout(_, 0)',
    severity: 'warning' as const
  },
  {
    pattern: /\.innerHTML\s*=/,
    message: 'Use textContent or DOM methods instead of innerHTML',
    severity: 'error' as const
  },
  {
    pattern: /new\s+Function\s*\(/,
    message: 'Avoid dynamic function creation',
    severity: 'error' as const
  },
  {
    pattern: /eval\s*\(/,
    message: 'Never use eval()',
    severity: 'error' as const
  }
];

export const patternsRule: Rule = {
  name: 'approved-patterns',
  
  appliesTo: (type: string) => type === 'file' || type === 'code',
  
  async validate(target: any): Promise<RuleResult> {
    const violations = [];
    
    try {
      let code: string;
      
      if (target.type === 'file' && target.path) {
        // Skip non-code files
        if (!target.path.match(/\.(ts|js|tsx|jsx)$/)) {
          return { valid: true, violations: [] };
        }
        // Skip test files for some patterns
        const isTest = target.path.includes('.test.') || target.path.includes('.spec.');
        
        code = await readFile(target.path, 'utf-8');
        
        // Check anti-patterns
        const lines = code.split('\n');
        for (const antiPattern of ANTI_PATTERNS) {
          // Skip console checks in test files
          if (isTest && antiPattern.pattern.toString().includes('console')) {
            continue;
          }
          
          lines.forEach((line, index) => {
            if (antiPattern.pattern.test(line)) {
              violations.push({
                rule: 'approved-patterns',
                severity: antiPattern.severity,
                message: antiPattern.message,
                file: target.path,
                line: index + 1
              });
            }
          });
        }
      } else if (target.type === 'code' && target.content) {
        code = target.content;
        
        // Check anti-patterns in code snippets
        for (const antiPattern of ANTI_PATTERNS) {
          if (antiPattern.pattern.test(code)) {
            violations.push({
              rule: 'approved-patterns',
              severity: antiPattern.severity,
              message: antiPattern.message
            });
          }
        }
      }
    } catch (error) {
      violations.push({
        rule: 'approved-patterns',
        severity: 'error' as const,
        message: `Failed to check patterns: ${error.message}`
      });
    }
    
    return {
      valid: violations.length === 0,
      violations
    };
  }
};