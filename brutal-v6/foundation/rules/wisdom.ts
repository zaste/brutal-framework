/**
 * Wisdom Rule - Prevents ambition from becoming stupidity
 * 
 * This rule ensures we maintain sanity while pursuing ambition.
 * Ambition without wisdom killed V3 (206KB of features nobody asked for).
 */

import { Rule, RuleResult, RuleViolation } from './index';

interface APIComplexity {
  functionName: string;
  parameterCount: number;
  linesOfDocNeeded: number;
}

/**
 * Wisdom thresholds
 */
const WISDOM_LIMITS = {
  maxParametersPerFunction: 4,        // More = confusing
  maxChainedMethods: 3,               // a.b().c().d() = bad
  minDocRatio: 0.5,                   // 1 line doc per 2 lines code
  maxMinificationObscurity: 0.7,      // 70% size reduction max
  maxAPIQuirkiness: 3,                // Max "weird" patterns
} as const;

export const wisdomRule: Rule = {
  name: 'wisdom',
  
  appliesTo: (type: string) => type === 'code' || type === 'package',
  
  async validate(target: any): Promise<RuleResult> {
    const violations: RuleViolation[] = [];
    
    // Check: Are we sacrificing usability for bytes?
    if (target.type === 'code' && target.content) {
      // Check for overly minified names
      const singleLetterVars = (target.content.match(/\b[a-z]\b/g) || []).length;
      const totalVars = (target.content.match(/\b[a-zA-Z_]\w*\b/g) || []).length;
      const minificationRatio = singleLetterVars / totalVars;
      
      if (minificationRatio > WISDOM_LIMITS.maxMinificationObscurity) {
        violations.push({
          rule: 'wisdom',
          severity: 'warning',
          message: `API becoming cryptic. ${(minificationRatio * 100).toFixed(1)}% single-letter names.`,
        });
      }
    }
    
    // Check: Is the API becoming too clever?
    const cleverPatterns = [
      /\(\)\s*=>\s*\(\)\s*=>/,  // Double arrow functions
      /\[\.\.\.[^\]]+\]\[0\]/,   // Spread just to get first
      /!!\+/,                     // Obscure boolean conversion
      /\|\s*0/,                   // Bitwise for integer conversion
    ];
    
    if (target.content) {
      let quirkCount = 0;
      cleverPatterns.forEach(pattern => {
        if (pattern.test(target.content)) quirkCount++;
      });
      
      if (quirkCount > WISDOM_LIMITS.maxAPIQuirkiness) {
        violations.push({
          rule: 'wisdom',
          severity: 'error',
          message: `API too clever. ${quirkCount} quirky patterns found. Remember: humans use this.`,
        });
      }
    }
    
    // Reality check messages (not violations, just wisdom)
    if (violations.length === 0 && Math.random() < 0.1) { // 10% chance
      console.log('\n💭 Wisdom whispers: "Is this still fun to use?"');
    }
    
    return {
      valid: violations.filter(v => v.severity === 'error').length === 0,
      violations,
    };
  },
};