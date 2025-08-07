/**
 * Composition rule
 * No inheritance except HTMLElement
 */

import { Rule, RuleResult } from './index';
import { readFile } from 'fs/promises';

export const compositionRule: Rule = {
  name: 'composition-only',
  
  appliesTo: (type: string) => type === 'file' || type === 'code',
  
  async validate(target: any): Promise<RuleResult> {
    const violations = [];
    
    try {
      let code: string;
      
      if (target.type === 'file' && target.path) {
        // Skip non-JS/TS files
        if (!target.path.match(/\.(ts|js|tsx|jsx)$/)) {
          return { valid: true, violations: [] };
        }
        code = await readFile(target.path, 'utf-8');
      } else if (target.type === 'code' && target.content) {
        code = target.content;
      } else {
        return { valid: true, violations: [] };
      }
      
      // Check for class inheritance (except HTMLElement)
      const lines = code.split('\n');
      const inheritancePattern = /class\s+(\w+)\s+extends\s+(?!HTMLElement)(\w+)/;
      
      lines.forEach((line, index) => {
        const match = line.match(inheritancePattern);
        if (match) {
          violations.push({
            rule: 'composition-only',
            severity: 'error' as const,
            message: `Class "${match[1]}" extends "${match[2]}". Use composition instead of inheritance.`,
            file: target.path,
            line: index + 1,
            fix: async () => {
              // Would refactor to composition pattern
              console.log(`Would refactor ${match[1]} to use composition instead of extending ${match[2]}`);
            }
          });
        }
      });
      
      // Check for React.Component inheritance (common anti-pattern)
      const reactPattern = /extends\s+(React\.)?Component/;
      lines.forEach((line, index) => {
        if (reactPattern.test(line)) {
          violations.push({
            rule: 'composition-only',
            severity: 'error' as const,
            message: 'React class components not allowed. Use function components.',
            file: target.path,
            line: index + 1
          });
        }
      });
    } catch (error) {
      violations.push({
        rule: 'composition-only',
        severity: 'error' as const,
        message: `Failed to check composition: ${error.message}`
      });
    }
    
    return {
      valid: violations.length === 0,
      violations
    };
  }
};